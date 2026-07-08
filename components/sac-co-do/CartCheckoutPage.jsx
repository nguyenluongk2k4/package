"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { hardcodedProducts } from "../../data/products";
import { loadCommerceSettings } from "../../lib/firebase/appSettings";
import { createOrderFromCart } from "../../lib/firebase/userData";
import { requestSePayCheckout, submitSePayForm } from "../../lib/sepay/browser";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useToast } from "./ToastProvider";

function resolveProvinceLabel(item) {
  return item?.FullName || item?.Name || "";
}

function resolveWardLabel(item) {
  return item?.FullName || item?.Name || "";
}

export default function CartCheckoutPage() {
  const { user, db, loading, profile } = useFirebaseAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [cartStatus, setCartStatus] = useState("loading");
  const [checkoutSaving, setCheckoutSaving] = useState(false);
  const [redirectingToSePay, setRedirectingToSePay] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [baseShippingFee, setBaseShippingFee] = useState(0);
  const [defaultProvince, setDefaultProvince] = useState("Ninh Binh");
  const [provinceRows, setProvinceRows] = useState([]);
  const [loadingAddressData, setLoadingAddressData] = useState(true);
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
  const shippingFee = items.length > 0 ? Number(baseShippingFee || 0) : 0;
  const discount = 0;
  const total = subtotal + shippingFee - discount;

  const selectedProvince = useMemo(
    () => provinceRows.find((item) => resolveProvinceLabel(item) === draft.province || item.Name === draft.province) || null,
    [draft.province, provinceRows]
  );

  const wardOptions = useMemo(
    () => (Array.isArray(selectedProvince?.Wards) ? selectedProvince.Wards : []),
    [selectedProvince]
  );

  function formatVnd(value) {
    return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
  }

  useEffect(() => {
    if (!db) return undefined;

    let mounted = true;

    async function loadSettings() {
      try {
        const settings = await loadCommerceSettings(db);
        if (!mounted) return;

        setBaseShippingFee(Number(settings.baseShippingFee || 0));
        if (settings.defaultProvince) {
          setDefaultProvince(settings.defaultProvince);
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Load commerce settings for checkout failed:", error);
        setBaseShippingFee(0);
        setDefaultProvince("Ninh Binh");
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, [db]);

  useEffect(() => {
    let mounted = true;

    async function loadAddressData() {
      setLoadingAddressData(true);

      try {
        const response = await fetch("/data-tinh-thanh.json", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Address dataset responded ${response.status}`);
        }

        const data = await response.json();
        if (!mounted) return;
        setProvinceRows(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!mounted) return;
        console.error("Load checkout address dataset failed:", error);
        setProvinceRows([]);
      } finally {
        if (mounted) setLoadingAddressData(false);
      }
    }

    loadAddressData();

    return () => {
      mounted = false;
    };
  }, []);

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
            name: snapshotData.name || "Sản phẩm",
            price: Number(snapshotData.price || 0),
            image: snapshotData.image || "/assets/anh-new/logo.png",
            category: snapshotData.badge || snapshotData.category || snapshotData.weight || "Sản phẩm di sản",
          };
        });

        setItems(firebaseItems);
        setCartStatus(firebaseItems.length ? "ready" : "empty");
      },
      (error) => {
        console.error("Cart snapshot failed:", error);
        setItems([]);
        setCartStatus("error");
        showToast(error.message || "Không thể tải giỏ hàng từ database.", "error");
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

  useEffect(() => {
    if (!provinceRows.length) return;

    setDraft((current) => {
      const currentProvinceExists = provinceRows.some(
        (item) => resolveProvinceLabel(item) === current.province || item.Name === current.province
      );

      if (currentProvinceExists) {
        return current;
      }

      const fallbackProvince =
        provinceRows.find((item) => resolveProvinceLabel(item) === defaultProvince || item.Name === defaultProvince)
        || provinceRows[0]
        || null;

      if (!fallbackProvince) {
        return current;
      }

      return {
        ...current,
        province: resolveProvinceLabel(fallbackProvince),
        ward: "",
        district: "",
      };
    });
  }, [defaultProvince, provinceRows]);

  function setDraftField(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function setProvince(value) {
    setDraft((current) => ({
      ...current,
      province: value,
      ward: "",
      district: "",
    }));
  }

  function setWard(value) {
    setDraft((current) => ({
      ...current,
      ward: value,
      district: "",
    }));
  }

  async function updateQuantity(id, nextQuantity) {
    const item = items.find((currentItem) => currentItem.id === id || currentItem.cartDocId === id);
    const safeQuantity = Math.max(1, nextQuantity);

    if (!user || !db || !item?.cartDocId) {
      showToast("Đăng nhập để cập nhật giỏ hàng.", "info");
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
      showToast(error.message || "Không thể cập nhật số lượng.", "error");
    }
  }

  async function removeItem(id) {
    const item = items.find((currentItem) => currentItem.id === id || currentItem.cartDocId === id);

    if (!user || !db || !item?.cartDocId) {
      showToast("Đăng nhập để xóa sản phẩm khỏi giỏ hàng.", "info");
      return;
    }

    setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== id && currentItem.cartDocId !== id));

    try {
      await deleteDoc(doc(db, "users", user.uid, "cart", item.cartDocId));
      showToast("Đã xóa sản phẩm khỏi giỏ hàng.", "success");
    } catch (error) {
      console.error("Cart remove failed:", error);
      showToast(error.message || "Không thể xóa sản phẩm.", "error");
    }
  }

  async function submitOrder(event) {
    event.preventDefault();

    if (!user || !db) {
      showToast("Đăng nhập để tạo đơn hàng.", "info");
      return;
    }

    if (!items.length) {
      showToast("Giỏ hàng đang trống.", "info");
      return;
    }

    if (!draft.name.trim() || !draft.email.trim() || !draft.phone.trim() || !draft.addressLine.trim()) {
      showToast("Vui lòng nhập đầy đủ tên, email, số điện thoại và địa chỉ giao hàng.", "error");
      return;
    }

    if (provinceRows.length > 0 && (!draft.province.trim() || !draft.ward.trim())) {
      showToast("Vui lòng chọn tỉnh/thành và phường/xã từ bộ địa giới hiện tại.", "error");
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
        showToast(`Đã tạo đơn ${result.orderCode}. Đang chuyển sang cổng thanh toán SePay...`, "success");
        setRedirectingToSePay(true);

        try {
          const payment = await requestSePayCheckout({ orderId: result.id, user });
          submitSePayForm(payment);
          return;
        } catch (paymentError) {
          console.error("SePay checkout init failed:", paymentError);
          showToast(
            paymentError.message || "Đã tạo đơn nhưng chưa khởi tạo được SePay. Bạn có thể thanh toán lại trong trang Của tôi.",
            "error"
          );
        } finally {
          setRedirectingToSePay(false);
        }
      } else {
        showToast(`Đã tạo đơn ${result.orderCode} thành công.`, "success");
      }
    } catch (error) {
      console.error("Order creation failed:", error);
      showToast(error.message || "Không thể tạo đơn hàng. Vui lòng thử lại.", "error");
    } finally {
      setCheckoutSaving(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="heritage-cart-page">
        <section className="heritage-cart-hero" aria-labelledby="cart-title">
          <h1 id="cart-title">Giỏ hàng</h1>
          <p>Lưu giữ những mảnh hồn di sản bạn đã chọn.</p>
        </section>

        <section className="heritage-cart-layout" data-source="firebase" aria-label="Chi tiết giỏ hàng">
          <div className="heritage-cart-main">
            <div className="heritage-cart-items">
              {cartStatus === "loading" ? (
                <article className="heritage-cart-state">
                  <h2>Đang tải giỏ hàng...</h2>
                </article>
              ) : null}

              {cartStatus === "auth" ? (
                <article className="heritage-cart-state">
                  <h2>Đăng nhập để xem giỏ hàng</h2>
                  <p>Giỏ hàng được lưu theo tài khoản để đồng bộ trên mọi thiết bị.</p>
                  <a href="/dang-nhap?next=/gio-hang">Đăng nhập ngay</a>
                </article>
              ) : null}

              {cartStatus === "unconfigured" || cartStatus === "error" ? (
                <article className="heritage-cart-state">
                  <h2>Chưa thể tải giỏ hàng</h2>
                  <p>Database chưa sẵn sàng hoặc kết nối đang gặp lỗi. Vui lòng thử lại sau.</p>
                </article>
              ) : null}

              {cartStatus === "empty" ? (
                <article className="heritage-cart-state">
                  <h2>Giỏ hàng đang trống</h2>
                  <p>Chọn sản phẩm di sản yêu thích để lưu vào giỏ hàng của bạn.</p>
                  <a href="/san-pham">Đi mua sắm</a>
                </article>
              ) : null}

              {items.map((item) => (
                <article className="heritage-cart-item" key={item.id}>
                  <img className="heritage-cart-item-image" src={item.image} alt={item.name} loading="lazy" decoding="async" />
                  <div className="heritage-cart-item-copy">
                    <h2>{item.name}</h2>
                    <p>{item.category}</p>
                    <div className="heritage-quantity-control" aria-label={`Số lượng ${item.name}`}>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Giảm số lượng">
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Tăng số lượng">
                        +
                      </button>
                    </div>
                  </div>
                  <strong className="heritage-cart-item-price">{formatVnd(item.price * item.quantity)}</strong>
                  <button className="heritage-cart-remove" type="button" onClick={() => removeItem(item.id)} aria-label={`Xóa ${item.name}`}>
                    <img src="/assets/ic-trash'.svg" alt="" aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>

            {orderSuccess ? (
              <section className="heritage-cart-checkout-section" aria-live="polite">
                <div className="heritage-cart-checkout-card heritage-cart-checkout-success">
                  <strong>Đặt hàng thành công</strong>
                  <span>Mã đơn: <strong>{orderSuccess.orderCode}</strong></span>
                  <span>Tổng thanh toán: <strong>{formatVnd(orderSuccess.total)}</strong></span>
                  <span>
                    {draft.paymentMethod === "sepay"
                      ? "Đơn SePay đã được tạo. Nếu trình duyệt không tự động chuyển trang thanh toán, bạn có thể vào Của tôi để thanh toán lại."
                      : "Đơn COD đã được tạo. Admin sẽ tiếp nhận và xử lý giao hàng theo timeline order."}
                  </span>
                  {draft.paymentMethod === "sepay" ? (
                    <a href={`/cua-toi?order=${orderSuccess.id}`}>Mở trang theo dõi và thanh toán SePay</a>
                  ) : null}
                </div>
              </section>
            ) : null}

            {items.length > 0 && !orderSuccess ? (
              <section className="heritage-cart-checkout-section" aria-label="Thông tin nhận hàng">
                <form className="heritage-cart-checkout-card" onSubmit={submitOrder}>
                  <div className="heritage-cart-checkout-head">
                    <h2>Thông tin nhận hàng</h2>
                    <p>Nhập đầy đủ thông tin để hệ thống tạo đơn và theo dõi giao hàng.</p>
                  </div>

                  <div className="heritage-cart-checkout-fields">
                    <label className="heritage-cart-field">
                      Họ và tên
                      <input value={draft.name} onChange={(event) => setDraftField("name", event.target.value)} placeholder="Nhập tên người nhận" />
                    </label>

                    <label className="heritage-cart-field">
                      Email
                      <input type="email" value={draft.email} onChange={(event) => setDraftField("email", event.target.value)} placeholder="email@example.com" />
                    </label>

                    <label className="heritage-cart-field">
                      Số điện thoại
                      <input value={draft.phone} onChange={(event) => setDraftField("phone", event.target.value)} placeholder="Nhập số điện thoại" />
                    </label>

                    <label className="heritage-cart-field heritage-cart-field-full">
                      Địa chỉ chi tiết
                      <input value={draft.addressLine} onChange={(event) => setDraftField("addressLine", event.target.value)} placeholder="Số nhà, đường, khu vực..." />
                    </label>

                    <div className="heritage-cart-field-grid heritage-cart-field-full">
                      <label className="heritage-cart-field">
                        Tỉnh / thành phố
                        <select
                          value={draft.province}
                          onChange={(event) => setProvince(event.target.value)}
                          disabled={loadingAddressData || provinceRows.length === 0}
                        >
                          {provinceRows.length === 0 ? <option value="">Chưa có dữ liệu</option> : null}
                          {provinceRows.map((item) => {
                            const label = resolveProvinceLabel(item);
                            return (
                              <option key={item.Code} value={label}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      </label>

                      <label className="heritage-cart-field">
                        Phường / xã
                        <select
                          value={draft.ward}
                          onChange={(event) => setWard(event.target.value)}
                          disabled={loadingAddressData || wardOptions.length === 0}
                        >
                          <option value="">
                            {wardOptions.length ? "Chọn phường / xã" : "Chưa có phường / xã"}
                          </option>
                          {wardOptions.map((item) => (
                            <option key={item.Code} value={resolveWardLabel(item)}>
                              {resolveWardLabel(item)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="heritage-cart-field">
                        Quận / huyện
                        <input
                          value={draft.district}
                          onChange={(event) => setDraftField("district", event.target.value)}
                          placeholder="Không bắt buộc nếu không dùng"
                        />
                      </label>
                    </div>

                    {loadingAddressData ? (
                      <p className="heritage-cart-field-note">Đang tải dữ liệu tỉnh / thành và phường / xã...</p>
                    ) : null}

                    {!loadingAddressData && provinceRows.length > 0 ? (
                      <p className="heritage-cart-field-note">
                        Form đang dùng bộ địa giới mới từ file dữ liệu hệ thống. Trường quận / huyện được giữ mở để ghi chú thêm khi cần.
                      </p>
                    ) : null}

                    <label className="heritage-cart-field heritage-cart-field-full">
                      Phương thức thanh toán
                      <select value={draft.paymentMethod} onChange={(event) => setDraftField("paymentMethod", event.target.value)}>
                        <option value="cod">COD - Thanh toán khi nhận hàng</option>
                        <option value="sepay">Chuyển khoản</option>
                      </select>
                    </label>

                    <label className="heritage-cart-field heritage-cart-field-full">
                      Ghi chú
                      <textarea value={draft.notes} onChange={(event) => setDraftField("notes", event.target.value)} placeholder="Lưu ý giao hàng, thời gian nhận..." />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="heritage-checkout-button"
                    style={{ width: "100%", border: "none", cursor: checkoutSaving || redirectingToSePay ? "wait" : "pointer" }}
                    disabled={checkoutSaving || redirectingToSePay}
                  >
                    {checkoutSaving ? "Đang tạo đơn..." : redirectingToSePay ? "Đang chuyển sang SePay..." : "Xác nhận đặt hàng"}
                    <img src="/assets/ic-next.svg" alt="" aria-hidden="true" />
                  </button>
                </form>
              </section>
            ) : null}
          </div>

          <aside className="heritage-cart-summary" aria-label="Tổng đơn hàng">
            <img className="heritage-cart-summary-bar" src="/assets/img-thanh-ngang-tong-don-gio-hang.svg" alt="" aria-hidden="true" />
            <div className="heritage-cart-summary-panel">
              <h2>Tổng cộng</h2>
              <dl>
                <div>
                  <dt>Tạm tính:</dt>
                  <dd>{formatVnd(subtotal)}</dd>
                </div>
                <div>
                  <dt>Phí vận chuyển:</dt>
                  <dd>{formatVnd(shippingFee)}</dd>
                </div>
                <div className="is-discount">
                  <dt>Giảm giá Passport:</dt>
                  <dd>- {formatVnd(discount)}</dd>
                </div>
              </dl>
              <div className="heritage-cart-total">
                <span>Thành tiền:</span>
                <strong>{formatVnd(total)}</strong>
              </div>

              {items.length === 0 ? (
                <a className="heritage-checkout-button is-disabled" href="/san-pham">
                  Chọn sản phẩm
                  <img src="/assets/ic-next.svg" alt="" aria-hidden="true" />
                </a>
              ) : null}

              <a className="heritage-continue-button" href="/san-pham">Tiếp tục mua sắm</a>
              <p>Cam kết bảo tồn giá trị di sản qua từng sản phẩm.</p>
            </div>
            <img className="heritage-cart-summary-bar" src="/assets/img-thanh-ngang-tong-don-gio-hang.svg" alt="" aria-hidden="true" />
          </aside>
        </section>

        <section className="heritage-cart-suggestions" aria-labelledby="cart-suggestion-title">
          <div className="heritage-cart-suggestions-inner">
            <h2 id="cart-suggestion-title">Gợi ý thêm cho hành trình của bạn</h2>
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
