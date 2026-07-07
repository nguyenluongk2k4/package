"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { hardcodedProducts } from "../../data/products";
import { createOrderFromCart } from "../../lib/firebase/userData";
import { requestSePayCheckout, submitSePayForm } from "../../lib/sepay/browser";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useToast } from "./ToastProvider";

export default function CartCheckoutPage() {
  const { user, db, loading, profile } = useFirebaseAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [cartStatus, setCartStatus] = useState("loading");
  const [checkoutSaving, setCheckoutSaving] = useState(false);
  const [redirectingToSePay, setRedirectingToSePay] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    phone: "",
    province: "Ninh Binh",
    district: "",
    ward: "",
    addressLine: "",
    paymentMethod: "cod",
    notes: "",
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = items.length > 0 ? 35000 : 0;
  const discount = 0;
  const total = subtotal + shippingFee - discount;

  function formatVnd(value) {
    return `${new Intl.NumberFormat("vi-VN").format(value)}d`;
  }

  useEffect(() => {
    if (loading) {
      setCartStatus("loading");
      return undefined;
    }

    if (!user || !db) {
      setItems([]);
      setCartStatus(user ? "unconfigured" : "auth");
      return undefined;
    }

    setCartStatus("loading");
    const cartRef = collection(db, "users", user.uid, "cart");
    return onSnapshot(
      cartRef,
      (snapshot) => {
        const firebaseItems = snapshot.docs.map((cartDoc) => {
          const data = cartDoc.data();
          const snapshotData = data.snapshot || {};
          return {
            id: data.productId || cartDoc.id,
            cartDocId: cartDoc.id,
            slug: data.slug,
            quantity: Math.max(1, Number(data.quantity || 1)),
            name: snapshotData.name || "San pham",
            price: Number(snapshotData.price || 0),
            image: snapshotData.image || "/assets/anh-new/logo.png",
            category: snapshotData.badge || snapshotData.category || snapshotData.weight || "San pham di san",
          };
        });

        setItems(firebaseItems);
        setCartStatus(firebaseItems.length ? "ready" : "empty");
      },
      (error) => {
        console.error("Cart snapshot failed:", error);
        setItems([]);
        setCartStatus("error");
        showToast(error.message || "Khong the tai gio hang tu database.", "error");
      }
    );
  }, [db, loading, showToast, user]);

  useEffect(() => {
    if (!user && !profile) return;

    setDraft((current) => ({
      ...current,
      name: current.name || profile?.fullName || profile?.displayName || user?.displayName || "",
      email: current.email || profile?.email || user?.email || "",
      phone: current.phone || profile?.phone || profile?.phoneNumber || "",
    }));
  }, [profile, user]);

  function setDraftField(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  async function updateQuantity(id, nextQuantity) {
    const item = items.find((currentItem) => currentItem.id === id || currentItem.cartDocId === id);
    const safeQuantity = Math.max(1, nextQuantity);

    if (!user || !db || !item?.cartDocId) {
      showToast("Dang nhap de cap nhat gio hang.", "info");
      return;
    }

    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === id || currentItem.cartDocId === id ? { ...currentItem, quantity: safeQuantity } : currentItem
      )
    );

    try {
      await updateDoc(doc(db, "users", user.uid, "cart", item.cartDocId), {
        quantity: safeQuantity,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Cart quantity update failed:", error);
      showToast(error.message || "Khong the cap nhat so luong.", "error");
    }
  }

  async function removeItem(id) {
    const item = items.find((currentItem) => currentItem.id === id || currentItem.cartDocId === id);

    if (!user || !db || !item?.cartDocId) {
      showToast("Dang nhap de xoa san pham khoi gio hang.", "info");
      return;
    }

    setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== id && currentItem.cartDocId !== id));

    try {
      await deleteDoc(doc(db, "users", user.uid, "cart", item.cartDocId));
      showToast("Da xoa san pham khoi gio hang.", "success");
    } catch (error) {
      console.error("Cart remove failed:", error);
      showToast(error.message || "Khong the xoa san pham.", "error");
    }
  }

  async function submitOrder(event) {
    event.preventDefault();

    if (!user || !db) {
      showToast("Dang nhap de tao don hang.", "info");
      return;
    }

    if (!items.length) {
      showToast("Gio hang dang trong.", "info");
      return;
    }

    if (!draft.name.trim() || !draft.email.trim() || !draft.phone.trim() || !draft.addressLine.trim()) {
      showToast("Vui long nhap day du ten, email, so dien thoai va dia chi giao hang.", "error");
      return;
    }

    setCheckoutSaving(true);

    try {
      const result = await createOrderFromCart({
        db,
        uid: user.uid,
        items,
        customer: {
          name: draft.name.trim(),
          email: draft.email.trim(),
          phone: draft.phone.trim(),
        },
        shippingAddress: {
          province: draft.province.trim(),
          district: draft.district.trim(),
          ward: draft.ward.trim(),
          addressLine: draft.addressLine.trim(),
        },
        paymentMethod: draft.paymentMethod,
        notes: draft.notes.trim(),
        shippingFee,
        discount,
      });

      setOrderSuccess(result);
      setItems([]);
      setCartStatus("empty");

      if (draft.paymentMethod === "sepay") {
        showToast(`Da tao don ${result.orderCode}. Dang chuyen sang cong thanh toan SePay...`, "success");
        setRedirectingToSePay(true);

        try {
          const payment = await requestSePayCheckout({ orderId: result.id, user });
          submitSePayForm(payment);
          return;
        } catch (paymentError) {
          console.error("SePay checkout init failed:", paymentError);
          showToast(
            paymentError.message || "Da tao don nhung chua khoi tao duoc SePay. Ban co the thanh toan lai trong trang Cua toi.",
            "error"
          );
        } finally {
          setRedirectingToSePay(false);
        }
      } else {
        showToast(`Da tao don ${result.orderCode} thanh cong.`, "success");
      }
    } catch (error) {
      console.error("Order creation failed:", error);
      showToast(error.message || "Khong the tao don hang. Vui long thu lai.", "error");
    } finally {
      setCheckoutSaving(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="heritage-cart-page">
        <section className="heritage-cart-hero" aria-labelledby="cart-title">
          <h1 id="cart-title">Gio hang</h1>
          <p>Luu giu nhung manh hon di san ban da chon.</p>
        </section>

        <section className="heritage-cart-layout" data-source="firebase" aria-label="Chi tiet gio hang">
          <div className="heritage-cart-main">
            <div className="heritage-cart-items">
              {cartStatus === "loading" ? (
                <article className="heritage-cart-state">
                  <h2>Dang tai gio hang...</h2>
                  <p>Gio hang dang duoc dong bo tu database.</p>
                </article>
              ) : null}
              {cartStatus === "auth" ? (
                <article className="heritage-cart-state">
                  <h2>Dang nhap de xem gio hang</h2>
                  <p>Gio hang duoc luu theo tai khoan de dong bo tren moi thiet bi.</p>
                  <a href="/dang-nhap?next=/gio-hang">Dang nhap ngay</a>
                </article>
              ) : null}
              {cartStatus === "unconfigured" || cartStatus === "error" ? (
                <article className="heritage-cart-state">
                  <h2>Chua the tai gio hang</h2>
                  <p>Database chua san sang hoac ket noi dang gap loi. Vui long thu lai sau.</p>
                </article>
              ) : null}
              {cartStatus === "empty" ? (
                <article className="heritage-cart-state">
                  <h2>Gio hang dang trong</h2>
                  <p>Chon san pham di san yeu thich de luu vao gio hang cua ban.</p>
                  <a href="/san-pham">Di mua sam</a>
                </article>
              ) : null}
              {items.map((item) => (
                <article className="heritage-cart-item" key={item.id}>
                  <img className="heritage-cart-item-image" src={item.image} alt={item.name} loading="lazy" decoding="async" />
                  <div className="heritage-cart-item-copy">
                    <h2>{item.name}</h2>
                    <p>{item.category}</p>
                    <div className="heritage-quantity-control" aria-label={`So luong ${item.name}`}>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Giam so luong">
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Tang so luong">
                        +
                      </button>
                    </div>
                  </div>
                  <strong className="heritage-cart-item-price">{formatVnd(item.price * item.quantity)}</strong>
                  <button className="heritage-cart-remove" type="button" onClick={() => removeItem(item.id)} aria-label={`Xoa ${item.name}`}>
                    <img src="/assets/ic-trash'.svg" alt="" aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>

            {orderSuccess ? (
              <section className="heritage-cart-checkout-section" aria-live="polite">
                <div className="heritage-cart-checkout-card heritage-cart-checkout-success">
                  <strong>Dat hang thanh cong</strong>
                  <span>Ma don: <strong>{orderSuccess.orderCode}</strong></span>
                  <span>Tong thanh toan: <strong>{formatVnd(orderSuccess.total)}</strong></span>
                  <span>
                    {draft.paymentMethod === "sepay"
                      ? "Don SePay da duoc tao. Neu trinh duyet khong tu dong chuyen trang thanh toan, ban co the vao Cua toi de thanh toan lai."
                      : "Don COD da duoc tao. Admin se tiep nhan va xu ly giao hang theo timeline order."}
                  </span>
                  {draft.paymentMethod === "sepay" ? (
                    <a href={`/cua-toi?order=${orderSuccess.id}`}>
                      Mo trang theo doi va thanh toan SePay
                    </a>
                  ) : null}
                </div>
              </section>
            ) : null}

            {items.length > 0 ? (
              <section className="heritage-cart-checkout-section" aria-label="Thong tin nhan hang">
                <form className="heritage-cart-checkout-card" onSubmit={submitOrder}>
                  <div className="heritage-cart-checkout-head">
                    <h2>Thong tin nhan hang</h2>
                    <p>Nhap day du thong tin de he thong tao don va theo doi giao hang.</p>
                  </div>

                  <div className="heritage-cart-checkout-fields">
                    <label className="heritage-cart-field">
                      Ho va ten
                      <input value={draft.name} onChange={(event) => setDraftField("name", event.target.value)} placeholder="Nhap ten nguoi nhan" />
                    </label>

                    <label className="heritage-cart-field">
                      Email
                      <input type="email" value={draft.email} onChange={(event) => setDraftField("email", event.target.value)} placeholder="email@example.com" />
                    </label>

                    <label className="heritage-cart-field">
                      So dien thoai
                      <input value={draft.phone} onChange={(event) => setDraftField("phone", event.target.value)} placeholder="Nhap so dien thoai" />
                    </label>

                    <label className="heritage-cart-field heritage-cart-field-full">
                      Dia chi chi tiet
                      <input value={draft.addressLine} onChange={(event) => setDraftField("addressLine", event.target.value)} placeholder="So nha, duong, khu vuc..." />
                    </label>

                    <div className="heritage-cart-field-grid heritage-cart-field-full">
                      <label className="heritage-cart-field">
                        Ward
                        <input value={draft.ward} onChange={(event) => setDraftField("ward", event.target.value)} placeholder="Phuong / xa" />
                      </label>
                      <label className="heritage-cart-field">
                        District
                        <input value={draft.district} onChange={(event) => setDraftField("district", event.target.value)} placeholder="Quan / huyen" />
                      </label>
                      <label className="heritage-cart-field">
                        Province
                        <input value={draft.province} onChange={(event) => setDraftField("province", event.target.value)} placeholder="Tinh / thanh pho" />
                      </label>
                    </div>

                    <label className="heritage-cart-field heritage-cart-field-full">
                      Phuong thuc thanh toan
                      <select value={draft.paymentMethod} onChange={(event) => setDraftField("paymentMethod", event.target.value)}>
                        <option value="cod">COD - Thanh toan khi nhan hang</option>
                        <option value="sepay">Chuyen khoan</option>
                      </select>
                    </label>

                    <label className="heritage-cart-field heritage-cart-field-full">
                      Ghi chu
                      <textarea value={draft.notes} onChange={(event) => setDraftField("notes", event.target.value)} placeholder="Luu y giao hang, thoi gian nhan..." />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="heritage-checkout-button"
                    style={{ width: "100%", border: "none", cursor: checkoutSaving || redirectingToSePay ? "wait" : "pointer" }}
                    disabled={checkoutSaving || redirectingToSePay}
                  >
                    {checkoutSaving ? "Dang tao don..." : redirectingToSePay ? "Dang chuyen sang SePay..." : "Xac nhan dat hang"}
                    <img src="/assets/ic-next.svg" alt="" aria-hidden="true" />
                  </button>
                </form>
              </section>
            ) : null}
          </div>

          <aside className="heritage-cart-summary" aria-label="Tong don hang">
            <img className="heritage-cart-summary-bar" src="/assets/img-thanh-ngang-tong-don-gio-hang.svg" alt="" aria-hidden="true" />
            <div className="heritage-cart-summary-panel">
              <h2>Tong cong</h2>
              <dl>
                <div>
                  <dt>Tam tinh:</dt>
                  <dd>{formatVnd(subtotal)}</dd>
                </div>
                <div>
                  <dt>Phi van chuyen:</dt>
                  <dd>{formatVnd(shippingFee)}</dd>
                </div>
                <div className="is-discount">
                  <dt>Giam gia Passport:</dt>
                  <dd>- {formatVnd(discount)}</dd>
                </div>
              </dl>
              <div className="heritage-cart-total">
                <span>Thanh tien:</span>
                <strong>{formatVnd(total)}</strong>
              </div>

              {items.length === 0 ? (
                <a className="heritage-checkout-button is-disabled" href="/san-pham">
                  Chon san pham
                  <img src="/assets/ic-next.svg" alt="" aria-hidden="true" />
                </a>
              ) : null}

              <a className="heritage-continue-button" href="/san-pham">Tiep tuc mua sam</a>
              <p>Cam ket bao ton gia tri di san qua tung san pham.</p>
            </div>
            <img className="heritage-cart-summary-bar" src="/assets/img-thanh-ngang-tong-don-gio-hang.svg" alt="" aria-hidden="true" />
          </aside>
        </section>

        <section className="heritage-cart-suggestions" aria-labelledby="cart-suggestion-title">
          <div className="heritage-cart-suggestions-inner">
            <h2 id="cart-suggestion-title">Goi y them cho hanh trinh cua ban</h2>
          </div>
          <div className="cart-marquee-track">
            <div className="cart-marquee-inner">
              {[...hardcodedProducts, ...hardcodedProducts].map((item, idx) => (
                <a
                  className="heritage-suggestion-card"
                  href={item.href || `/san-pham/${item.slug || item.id}`}
                  key={`${item.id}-${idx}`}
                  aria-label={item.name}
                >
                  <div className="heritage-suggestion-media">
                    {item.image ? (
                      <img src={item.image} alt={item.name} loading="lazy" decoding="async" />
                    ) : (
                      <span aria-hidden="true">🏺</span>
                    )}
                  </div>
                  <div className="heritage-suggestion-info">
                    {item.badge ? <span className="heritage-suggestion-badge">{item.badge}</span> : null}
                    <h3>{item.name}</h3>
                    <p>{item.priceFormatted}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
