"use client";

import { useState, useEffect } from "react";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc, getDocs } from "firebase/firestore";
import { gallery, stations } from "../../data/sac-co-do";
import { hardcodedProducts } from "../../data/products";
import SectionTitle from "./SectionTitle";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import WebArViewer from "./WebArViewer";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { saveJourneyProgress } from "../../lib/firebase/userData";
import { useToast } from "./ToastProvider";

export function CartPage() {
  const { user, db, loading } = useFirebaseAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [cartStatus, setCartStatus] = useState("loading");
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = items.length > 0 ? 35000 : 0;
  const discount = 0;
  const total = subtotal + shippingFee - discount;

  function formatVnd(value) {
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
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

  async function updateQuantity(id, nextQuantity) {
    const item = items.find((currentItem) => currentItem.id === id || currentItem.cartDocId === id);
    const safeQuantity = Math.max(1, nextQuantity);

    if (!user || !db || !item?.cartDocId) {
      showToast("Đăng nhập để cập nhật giỏ hàng.", "info");
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id || item.cartDocId === id ? { ...item, quantity: safeQuantity } : item
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

    setItems((currentItems) => currentItems.filter((item) => item.id !== id && item.cartDocId !== id));

    try {
      await deleteDoc(doc(db, "users", user.uid, "cart", item.cartDocId));
      showToast("Đã xóa sản phẩm khỏi giỏ hàng.", "success");
    } catch (error) {
      console.error("Cart remove failed:", error);
      showToast(error.message || "Không thể xóa sản phẩm.", "error");
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
                  <p>Giỏ hàng đang được đồng bộ từ database.</p>
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
              <a className={`heritage-checkout-button ${items.length ? "" : "is-disabled"}`} href={items.length ? "/kich-hoat" : "/san-pham"}>
                {items.length ? "Tiến hành thanh toán" : "Chọn sản phẩm"}
                <img src="/assets/ic-next.svg" alt="" aria-hidden="true" />
              </a>
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
                    {item.badge && <span className="heritage-suggestion-badge">{item.badge}</span>}
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

export function DashboardPage() {
  const { user, db, profile, refreshProfile, logout } = useFirebaseAuth();
  const { showToast } = useToast();
  
  // Local profile states
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Local checkin states
  const [completedCount, setCompletedCount] = useState(0);
  const [selectedCert, setSelectedCert] = useState(null);

  // Sync profile state when loaded
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || profile.displayName || user?.displayName || "");
      setPhoneNumber(profile.phoneNumber || profile.phone || "");
    } else if (user) {
      setFullName(user.displayName || "");
      setPhoneNumber("");
    } else if (typeof window !== "undefined") {
      // Guest mode sync
      setFullName(localStorage.getItem("scd_guest_name") || "");
      setPhoneNumber(localStorage.getItem("scd_guest_phone") || "");
    }
  }, [profile, user]);

  // Load completed stops count
  useEffect(() => {
    let active = true;

    async function loadStats() {
      // Guest local completed count
      let guestCount = 0;
      if (typeof window !== "undefined") {
        try {
          const visitedList = JSON.parse(localStorage.getItem("scd_visited_stations") || "[]");
          guestCount = visitedList.length;
        } catch (_) {}
      }

      if (!db || !user) {
        if (active) setCompletedCount(guestCount);
        return;
      }

      try {
        const querySnapshot = await getDocs(collection(db, "users", user.uid, "journeyProgress"));
        if (!active) return;
        const dbCount = querySnapshot.size;
        setCompletedCount(Math.max(dbCount, guestCount)); // Merge database and guest local
      } catch (err) {
        console.warn("⚠️ [Dashboard] Lỗi tải tiến trình:", err);
        if (active) setCompletedCount(guestCount);
      }
    }

    loadStats();
    return () => {
      active = false;
    };
  }, [user, db]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast("Vui lòng nhập họ và tên.", "error");
      return;
    }

    setIsSaving(true);
    try {
      if (user && db) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          fullName: fullName.trim(),
          displayName: fullName.trim(),
        });
        await refreshProfile();
      } else if (typeof window !== "undefined") {
        // Guest mode save
        localStorage.setItem("scd_guest_name", fullName.trim());
      }
      showToast("Cập nhật thông tin hồ sơ thành công!", "success");
    } catch (err) {
      console.error("Failed to update profile:", err);
      showToast("Không thể cập nhật hồ sơ. Vui lòng thử lại.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const certs = [
    {
      id: "beginner",
      title: "Kẻ lữ hành tò mò",
      description: "Đã ghé thăm 2 địa điểm di sản",
      required: 2,
      icon: "/assets/ho-chieu-hanh-trinh/desktop-icon/ic-cert-1.svg",
      svgUrl: "/certificate/begin.svg",
    },
    {
      id: "photographer",
      title: "Nhiếp ảnh gia Cố đô",
      description: "Check-in tại 4 địa điểm",
      required: 4,
      icon: "/assets/ho-chieu-hanh-trinh/desktop-icon/ic-cert-2.svg",
      svgUrl: "/certificate/HERITAGE-PHOTOGRAPHER.svg",
    },
    {
      id: "champion",
      title: "Nhà chinh phục Cố đô",
      description: "Đóng đủ 6 dấu mộc di sản",
      required: 6,
      icon: "/assets/ho-chieu-hanh-trinh/desktop-icon/ic-cert-3.svg",
      svgUrl: "/certificate/HERITAGE-CHAMPION.svg",
    },
  ];

  return (
    <>
      <UtilityPage
        eyebrow="Tài khoản"
        title="Hồ Sơ Của Tôi"
        description="Quản lý thông tin cá nhân và xem danh sách chứng chỉ di sản Ninh Bình bạn đã đạt."
      >
        <div className="profile-page-container">
          {/* Personal Info Card */}
          <section className="profile-card" aria-label="Thông tin cá nhân">
            <h2>Thông tin cá nhân</h2>
            
            {!user && (
              <div className="profile-login-prompt font-baloo">
                Bạn đang truy cập ở chế độ <strong>Khách tham quan</strong>. 
                Đăng nhập để lưu trữ thông tin vĩnh viễn và đồng bộ chứng chỉ:
                <a href="/dang-nhap">Đăng nhập ngay</a>
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div className="profile-form-group">
                <label className="font-baloo">Họ và tên</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên nhận chứng chỉ..."
                  required
                />
              </div>

              <div className="profile-form-group">
                <label className="font-baloo">Địa chỉ Email</label>
                <input 
                  type="email" 
                  value={user?.email || "Chưa đăng nhập"} 
                  disabled 
                />
              </div>

              <button 
                type="submit" 
                className="profile-submit-btn font-baloo"
                disabled={isSaving}
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </form>

            {user && (
              <button 
                type="button" 
                className="profile-logout-btn font-baloo" 
                onClick={async () => {
                  await logout();
                  showToast("Bạn đã đăng xuất thành công.", "info");
                  window.location.href = "/";
                }}
              >
                Đăng xuất tài khoản
              </button>
            )}
          </section>

          {/* Certificates Card */}
          <section className="profile-card" aria-label="Chứng chỉ di sản">
            <h2>Chứng chỉ đạt được ({certs.filter(c => completedCount >= c.required).length}/3)</h2>
            <div className="profile-certs-list">
              {certs.map((cert) => {
                const isUnlocked = completedCount >= cert.required;
                return (
                  <article 
                    className={`profile-cert-item ${isUnlocked ? "is-unlocked" : ""}`} 
                    key={cert.id}
                  >
                    <div className="profile-cert-icon-wrapper">
                      <img src={cert.icon} alt="" aria-hidden="true" />
                    </div>
                    <div className="profile-cert-info">
                      <h3>{cert.title}</h3>
                      <p>{cert.description}</p>
                    </div>
                    <div className="profile-cert-status">
                      {isUnlocked ? (
                        <>
                          <span className="badge-unlocked font-baloo">Đã Đạt</span>
                          <button 
                            type="button" 
                            className="profile-cert-action-btn font-baloo"
                            onClick={() => setSelectedCert(cert)}
                          >
                            Nhận chứng chỉ
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="badge-locked font-baloo">Chưa Đạt</span>
                          <p style={{ fontSize: "11px", color: "#a0aec0", fontStyle: "italic" }}>
                            Tiến trình: {completedCount}/{cert.required} chặng
                          </p>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </UtilityPage>

      {selectedCert && (
        <LocalCertificateModal 
          certificate={selectedCert} 
          onClose={() => setSelectedCert(null)}
          initialName={fullName || profile?.fullName || user?.displayName || "Lữ khách di sản"}
        />
      )}
    </>
  );
}

// Local Certificate Modal Component for UtilityPages
function LocalCertificateModal({ certificate, onClose, initialName }) {
  const [customName, setCustomName] = useState(initialName || "Lữ khách hiếu kỳ");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const scale = 3;
    canvas.width = 595.5 * scale;
    canvas.height = 842.25 * scale;

    img.src = certificate.svgUrl;
    img.onload = () => {
      document.fonts.load('1em "HLT Burgues Script"').then(() => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(110 * scale, 396 * scale, 375 * scale, 58 * scale);
        ctx.fillStyle = "#1a1a1a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${32 * scale}px "HLT Burgues Script", cursive`;
        ctx.fillText(customName, (595.5 / 2) * scale, 428 * scale);

        try {
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `Chung_Nhan_Scd_${certificate.id}_${customName.replace(/\s+/g, "_")}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (e) {
          console.error("Canvas export failed:", e);
        } finally {
          setIsDownloading(false);
        }
      }).catch((err) => {
        console.warn("Font loading failed, falling back to cursive:", err);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(110 * scale, 396 * scale, 375 * scale, 58 * scale);
        ctx.fillStyle = "#1a1a1a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `italic 700 ${28 * scale}px "Dancing Script", cursive`;
        ctx.fillText(customName, (595.5 / 2) * scale, 428 * scale);
        try {
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `Chung_Nhan_Scd_${certificate.id}_${customName.replace(/\s+/g, "_")}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (e) {
          console.error("Canvas export failed:", e);
        } finally {
          setIsDownloading(false);
        }
      });
    };

    img.onerror = () => setIsDownloading(false);
  };

  return (
    <div className="cert-modal-backdrop" onClick={onClose}>
      <div className="cert-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cert-modal-close" onClick={onClose} aria-label="Đóng">×</button>
        
        <div className="cert-modal-left">
          <h3>Chứng Nhận Di Sản</h3>
          <p className="cert-modal-hint font-baloo">Họ tên in trên chứng chỉ:</p>
          
          <div className="cert-input-group">
            <input 
              type="text" 
              value={customName} 
              onChange={(e) => setCustomName(e.target.value)} 
              placeholder="Nhập họ tên nhận chứng nhận..." 
              maxLength={40}
            />
          </div>

          <div className="cert-modal-actions">
            <button 
              type="button" 
              className="cert-download-btn font-baloo" 
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? "Đang tạo..." : "Tải xuống Chứng nhận (PNG)"}
            </button>
          </div>
        </div>

        <div className="cert-modal-right">
          <div className="cert-preview-wrapper">
            <img src={certificate.svgUrl} alt="Certificate template" className="cert-img-base" />
            <div className="cert-name-overlay-cover">
              <span className="cert-overlay-text">{customName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhotoboothPage() {
  const { user, db } = useFirebaseAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPhotos() {
      // 1. Load from localStorage fallback
      let localPhotosList = [];
      if (typeof window !== "undefined") {
        try {
          const photosMap = JSON.parse(localStorage.getItem("scd_station_photos") || "{}");
          localPhotosList = Object.keys(photosMap).map((key) => ({
            id: key,
            url: photosMap[key],
            caption: `Kỷ niệm check-in tại ${stations.find(s => s.id === key)?.name || key}`,
          }));
        } catch (_) {}
      }

      // If not logged in, set local photos and return
      if (!db || !user) {
        if (active) {
          setPhotos(localPhotosList.length > 0 ? localPhotosList : gallery.map((url, idx) => ({ id: `place-${idx}`, url, caption: "Ảnh mẫu Ninh Bình" })));
          setLoading(false);
        }
        return;
      }

      // 2. Load from Firestore users/{uid}/photoboothPhotos
      try {
        const querySnapshot = await getDocs(collection(db, "users", user.uid, "photoboothPhotos"));
        if (!active) return;
        
        const dbPhotos = [];
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          dbPhotos.push({
            id: docSnapshot.id,
            url: data.url,
            caption: data.caption || "Ảnh kỷ niệm",
            createdAt: data.createdAt,
          });
        });

        // Sort by createdAt desc
        dbPhotos.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        // Merge with local photos to ensure nothing is lost
        const mergedMap = new Map();
        localPhotosList.forEach((item) => mergedMap.set(item.url, item));
        dbPhotos.forEach((item) => mergedMap.set(item.url, item));

        const finalPhotos = Array.from(mergedMap.values());

        setPhotos(finalPhotos.length > 0 ? finalPhotos : gallery.map((url, idx) => ({ id: `place-${idx}`, url, caption: "Ảnh mẫu Ninh Bình" })));
      } catch (err) {
        console.warn("⚠️ [Photobooth] Lỗi tải ảnh từ Firestore:", err);
        setPhotos(localPhotosList.length > 0 ? localPhotosList : gallery.map((url, idx) => ({ id: `place-${idx}`, url, caption: "Ảnh mẫu Ninh Bình" })));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPhotos();
    return () => {
      active = false;
    };
  }, [user, db]);

  return (
    <UtilityPage
      eyebrow="Photobooth"
      title="Khung ảnh lưu niệm của bạn"
      description="Sau khi chụp ảnh check-in AR tại các danh thắng, những bức ảnh lưu niệm độc quyền của bạn sẽ được lưu giữ tại đây."
    >
      {loading ? (
        <div className="loading-placeholder-container">
          <div className="spinner" />
        </div>
      ) : (
        <div className="gallery-strip framed" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              className="passport-polaroid-frame" 
              style={{ paddingBottom: "24px" }}
            >
              <div className="passport-polaroid-img-wrapper" style={{ height: "85%" }}>
                <img 
                  className="passport-polaroid-img" 
                  src={photo.url} 
                  alt={photo.caption} 
                  loading="lazy" 
                  decoding="async" 
                />
              </div>
              <span className="passport-polaroid-caption" style={{ fontSize: "11px", marginTop: "6px" }}>
                {photo.caption}
              </span>
            </div>
          ))}
        </div>
      )}
    </UtilityPage>
  );
}

export function RewardPage() {
  return (
    <UtilityPage
      eyebrow="Phần thưởng"
      title="Certificate và quà số sau khi hoàn thành"
      description="Hoàn thành 6 trạm để nhận certificate cá nhân và bộ ảnh lưu niệm."
    >
      <div className="reward-card">
        <span>Sắc Cố Đô</span>
        <h3>Certificate of Journey</h3>
        <p>Trao cho người đã hoàn thành đủ 6 dấu mộc Ninh Bình.</p>
      </div>
    </UtilityPage>
  );
}

export function ArOnboardingGuide({ onClose, onStart }) {
  const [activeStep, setActiveStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const GUIDE_STEPS = [
    {
      title: "Bước 1: Quét bề mặt đất",
      dialogue: "Xin chào bạn hữu! Hãy cùng tôi khám phá di sản nhé. Đầu tiên, bạn hãy lia camera điện thoại chậm rãi để quét sạch bề mặt sàn nhà hoặc mặt đất xung quanh.",
      image: "/tour-guide/asset/step1-nibi.png",
      badge: "Bước 1"
    },
    {
      title: "Bước 2: Chọn vị trí đặt Nibi",
      dialogue: "Tuyệt vời! Khi thấy vòng tròn vàng xuất hiện, bạn hãy chạm nhẹ tay lên vị trí đó để đặt tôi đứng vững trong không gian nhé.",
      image: "/tour-guide/asset/step2-nibi.png",
      badge: "Bước 2"
    },
    {
      title: "Bước 3: Chụp và lưu ảnh cùng Nibi",
      dialogue: "Cười lên nào! Bạn hãy căn chỉnh góc máy thật đẹp, xoay/phóng to thu nhỏ tôi cho hợp lý, rồi nhấn nút chụp ảnh để lưu giữ kỷ niệm vào thiết bị.",
      image: "/tour-guide/asset/step3--nibi.png",
      badge: "Bước 3"
    },
    {
      title: "Bước 4: Đóng dấu mộc hộ chiếu",
      dialogue: "Sắp hoàn thành rồi! Bây giờ bạn hãy tải bức ảnh vừa chụp lên website để hệ thống xác nhận và đóng con dấu mộc số lưu niệm vào cuốn hộ chiếu di sản nha.",
      image: "/tour-guide/asset/step4-nibi.png",
      badge: "Bước 4"
    },
    {
      title: "Bước 5: Chia sẻ hành trình di sản",
      dialogue: "Tuyệt vời ông mặt trời! Hãy chia sẻ khoảnh khắc đáng nhớ cùng Sắc Cố Đô để lưu giữ những kỷ niệm đẹp và tiếp tục hành trình di sản của bạn.",
      image: "/tour-guide/asset/step5-nibi.png",
      badge: "Bước 5"
    }
  ];

  const currentStep = GUIDE_STEPS[activeStep];

  const handleNext = () => {
    if (activeStep < 4) {
      setActiveStep((prev) => prev + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem("scd_ar_guide_completed", "true");
      }
      onStart();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  return (
    <>
      <div className="ar-guide-overlay" role="dialog" aria-modal="true">
        <div className="ar-guide-backdrop" onClick={onClose} />
        <div className="ar-guide-card animate-scale-up">
          <button className="ar-guide-close" onClick={onClose} aria-label="Đóng">✕</button>
          
          <div className="ar-guide-grid-container">
            {/* Left side: Image container */}
            <div className="ar-guide-left-col">
              <div className={`ar-guide-image-container ${activeStep === 0 || activeStep === 1 ? "align-bottom" : ""}`}>
                <img src={currentStep.image} alt={currentStep.title} className="ar-guide-mascot-img-main" />
              </div>
            </div>

            {/* Right side: Stepper controls & Dialogue */}
            <div className="ar-guide-right-col">
              <div className="ar-guide-header flex items-center justify-between w-full mb-4">
                <span className="ar-guide-badge px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100 uppercase tracking-wider">
                  {currentStep.badge}
                </span>
                <span className="ar-guide-step-indicator text-xs text-neutral-400 font-medium">
                  Bước {activeStep + 1}/5
                </span>
              </div>

              <div className="ar-guide-copy text-center mb-4">
                <h3 className="text-xl font-bold text-neutral-900">{currentStep.title}</h3>
              </div>

              <div className="ar-guide-dialogue">
                <div className="ar-guide-dialogue-avatar-wrapper">
                  <img src="/ar/avt-nibi-no-bg.png" alt="Nibi Tourguide" className="ar-guide-dialogue-avatar" />
                </div>
                <div className="ar-guide-dialogue-content">
                  <div className="ar-guide-dialogue-name">Nibi Hướng Dẫn Viên</div>
                  <p className="ar-guide-dialogue-text">
                    "{currentStep.dialogue}"
                  </p>
                </div>
              </div>

              <div className="ar-guide-dots flex justify-center gap-1.5 mb-5">
                {GUIDE_STEPS.map((_, i) => (
                  <span key={i} className={`ar-guide-dot ${i === activeStep ? "active" : ""}`} />
                ))}
              </div>

              <div className="ar-guide-footer w-full flex flex-col gap-4 border-t border-neutral-100 pt-4">
                {activeStep === 4 && (
                  <label className="ar-guide-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={dontShowAgain} 
                      onChange={(e) => setDontShowAgain(e.target.checked)} 
                      className="ar-guide-checkbox" 
                    />
                    <span>Không hiển thị lại hướng dẫn này</span>
                  </label>
                )}
                <div className="ar-guide-buttons flex items-center justify-between gap-3 w-full">
                  {activeStep > 0 ? (
                    <button 
                      type="button"
                      className="ar-guide-btn-secondary" 
                      onClick={handleBack}
                    >
                      Quay lại
                    </button>
                  ) : (
                    <div className="flex-1" />
                  )}
                  
                  <button 
                    type="button"
                    className="ar-guide-btn-primary" 
                    onClick={handleNext}
                  >
                    {activeStep === 4 ? "Bắt đầu ngay ✨" : "Tiếp theo"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thêm CSS Keyframe Animations cục bộ cho UtilityPages */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </>
  );
}

function UtilityPage({ eyebrow, title, description, children }) {
  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <SectionTitle eyebrow={eyebrow} title={title} description={description} />
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
