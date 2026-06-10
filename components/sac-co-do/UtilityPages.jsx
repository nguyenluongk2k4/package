"use client";

import { useState, useEffect } from "react";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { gallery, souvenirProducts, stations } from "../../data/sac-co-do";
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
  const suggestedItems = [
    {
      id: "ve-thuyen-trang-an",
      name: "Vé Thuyền Tràng An",
      price: "250.000đ",
      image: stations[0]?.image,
      href: "/hanh-trinh/trang-an",
    },
    {
      id: "tra-sen-co-do",
      name: "Trà Sen Cố Đô",
      price: "180.000đ",
      image: "/assets/gowilds/assets/images/gallery/act-1.jpg",
      href: "/san-pham/com-chay-dang-tui",
    },
    {
      id: "combo-qua-tang",
      name: "Combo Quà Tặng",
      price: "Liên hệ",
      image: "",
      href: "/san-pham/com-chay-ruoc-dam-vi",
    },
    {
      id: "cam-nang-ninh-binh",
      name: "Cẩm Nang Ninh Bình",
      price: "Miễn phí",
      image: "",
      href: "/hanh-trinh",
    },
  ];

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

            <article className="heritage-cart-promo">
              <div className="heritage-cart-promo-icon">
                <img src="/assets/ic-uu-dai.svg" alt="" aria-hidden="true" />
              </div>
              <div>
                <h2>Ưu đãi dành riêng cho bạn</h2>
                <p>Thành viên sở hữu Heritage Passport ép cọc giảm ngay 15% trên tổng hóa đơn.</p>
              </div>
              <button type="button">Áp dụng ngay</button>
            </article>
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
          <h2 id="cart-suggestion-title">Gợi ý thêm cho hành trình của bạn</h2>
          <div className="heritage-suggestion-grid">
            {suggestedItems.map((item) => (
              <a className="heritage-suggestion-card" href={item.href} key={item.id}>
                <div className="heritage-suggestion-media">
                  {item.image ? (
                    <img src={item.image} alt={item.name} loading="lazy" decoding="async" />
                  ) : (
                    <span aria-hidden="true">{item.id === "combo-qua-tang" ? "+" : "□"}</span>
                  )}
                </div>
                <h3>{item.name}</h3>
                <p>{item.price}</p>
              </a>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export function DashboardPage() {
  return (
    <UtilityPage
      eyebrow="Của tôi"
      title="Tiến độ passport cá nhân"
      description="Màn hình tổng hợp số trạm đã đi, dấu đã nhận và phần thưởng đang mở khóa."
    >
      <div className="progress-grid">
        {stations.slice(0, 4).map((station, index) => (
          <article key={station.id}>
            <span>{index < 2 ? "Đã nhận" : "Chưa mở"}</span>
            <h3>{station.name}</h3>
            <p>{station.stamp}</p>
          </article>
        ))}
      </div>
    </UtilityPage>
  );
}

export function PhotoboothPage() {
  return (
    <UtilityPage
      eyebrow="Photobooth"
      title="Khung ảnh mở khóa theo từng trạm"
      description="Sau khi check-in, người dùng có thể dùng frame theo điểm đến để lưu ảnh kỷ niệm."
    >
      <div className="gallery-strip framed">
        {gallery.map((image) => (
          <img key={image} src={image} alt="" loading="lazy" decoding="async" />
        ))}
      </div>
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

export function CheckinPage({ stationId }) {
  const { user, db } = useFirebaseAuth();
  const station = stations.find((item) => item.id === stationId) || stations[0];
  const [showAr, setShowAr] = useState(false);
  const [isStamped, setIsStamped] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showManualSuccess, setShowManualSuccess] = useState(false);

  // Kiểm tra xem trạm này đã được đóng dấu trong LocalStorage chưa
  useEffect(() => {
    if (typeof window !== "undefined") {
      const visited = JSON.parse(localStorage.getItem("scd_visited_stations") || "[]");
      if (visited.includes(stationId)) {
        setIsStamped(true);
      }
    }
  }, [stationId]);

  // Xử lý khi quét/đóng dấu AR thành công
  const handleArSuccess = (id) => {
    setIsStamped(true);
    setShowAr(false);
  };

  // Xử lý đóng dấu bằng mã ngày thủ công
  const handleManualCheckin = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setErrorMessage("Vui lòng nhập mã ngày.");
      return;
    }

    // Giả định mã ngày đúng là "SCD2026" hoặc có tiền tố SCD
    const codeUpper = manualCode.toUpperCase().trim();
    if (codeUpper === "SCD2026" || codeUpper.startsWith("SCD")) {
      setErrorMessage("");
      
      // Phát âm thanh tiếng đóng dấu gỗ "cộp"
      const stampSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2012/2012-84.wav");
      stampSound.play().catch((err) => console.log(err));

      setShowManualSuccess(true);
      
      setTimeout(async () => {
        setIsStamped(true);
        setShowManualSuccess(false);

        // Lưu vào LocalStorage
        const visited = JSON.parse(localStorage.getItem("scd_visited_stations") || "[]");
        if (!visited.includes(stationId)) {
          visited.push(stationId);
          localStorage.setItem("scd_visited_stations", JSON.stringify(visited));
        }

        await saveJourneyProgress({
          db,
          uid: user?.uid,
          stationId,
          stationName: station.name,
          source: "manual-code",
        });
      }, 1500);
    } else {
      setErrorMessage("Mã ngày không hợp lệ. Vui lòng hỏi nhân viên tại quầy!");
    }
  };

  return (
    <>
      {showAr ? (
        <WebArViewer 
          stationId={stationId} 
          onClose={() => setShowAr(false)} 
          onCheckinSuccess={handleArSuccess} 
        />
      ) : (
        <UtilityPage
          eyebrow="Check-in Hành trình"
          title={`Trạm ${station.name}`}
          description={station.description}
        >
          <div className="checkin-shell max-w-2xl mx-auto px-4 py-8">
            <div className="checkin-card-modern bg-white rounded-3xl overflow-hidden shadow-2xl border border-neutral-100 flex flex-col md:flex-row transition-all duration-300 hover:shadow-neutral-200">
              
              {/* Ảnh trạm check-in + Dấu mộc đè lên nếu đã đóng dấu */}
              <div className="checkin-hero relative w-full md:w-1/2 h-64 md:h-auto min-h-[300px]">
                <img 
                  src={station.image} 
                  alt={station.name} 
                  className="w-full h-full object-cover"
                  loading="lazy" 
                  decoding="async" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                
                {isStamped && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-950/20 backdrop-blur-xs animate-scale-up">
                    {/* Con dấu tròn đỏ rực đóng đè lên ảnh cảnh danh thắng */}
                    <div className="w-36 h-36 rounded-full border-4 border-red-600 border-dashed flex flex-col items-center justify-center text-red-600 bg-white/90 shadow-2xl transform -rotate-12 select-none">
                      <span className="text-[10px] tracking-widest font-bold uppercase">Sắc Cố Đô</span>
                      <div className="w-4/5 h-[2px] bg-red-600 my-1"></div>
                      <span className="text-center font-extrabold text-xs leading-none uppercase px-2">{station.stamp}</span>
                      <div className="w-4/5 h-[2px] bg-red-600 my-1"></div>
                      <span className="text-[9px] font-bold tracking-wider">ĐÃ ĐÓNG DẤU</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chi tiết trạm check-in và tuỳ chọn check-in */}
              <div className="checkin-details w-full md:w-1/2 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full border border-red-100 uppercase tracking-wider">
                      {station.tag}
                    </span>
                    <span className="text-xs text-neutral-500 font-light flex items-center gap-1">
                      🕒 {station.hours}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">{station.name}</h3>
                  <p className="text-sm text-neutral-500 font-light leading-relaxed mb-6">
                    {isStamped 
                      ? `Chúc mừng bạn đã check-in thành công trạm ${station.name}! Dấu mộc "${station.stamp}" đã chính thức được đóng vào cuốn passport số của bạn.` 
                      : `Chào mừng bạn đến với ${station.name}! Quét mã QR tại điểm để mở ra trải nghiệm WebAR sinh động với hướng dẫn viên 3D cầm sản phẩm kể chuyện văn hóa và đóng dấu passport số.`}
                  </p>
                </div>

                {isStamped ? (
                  /* Giao diện khi đã đóng dấu */
                  <div className="mt-4">
                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3.5 mb-5">
                      <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow-md">✓</div>
                      <div>
                        <h4 className="text-sm font-bold text-green-900">Đã đóng dấu mộc số!</h4>
                        <p className="text-xs text-green-700 font-light">Kiểm tra tiến trình tại trang cá nhân của bạn.</p>
                      </div>
                    </div>
                    <a 
                      href="/cua-toi" 
                      className="w-full h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-neutral-900/10 active:scale-98 transition-all"
                    >
                      📖 XEM PASSPORT CỦA TÔI
                    </a>
                  </div>
                ) : (
                  /* Giao diện khi chưa đóng dấu */
                  <div className="checkin-actions space-y-6">
                    
                    {/* TUỲ CHỌN 1: MỞ CAMERA AR (TRẢI NGHIỆM ĐỈNH CAO GIỐNG POKEMON GO) */}
                    <div>
                      <button
                        onClick={() => setShowAr(true)}
                        className="checkin-ar-button w-full h-14 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-amber-600 text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-xl shadow-red-700/20 border border-amber-400/20 active:scale-97 hover:brightness-105 transition-all animate-pulse"
                      >
                        <span className="text-lg">✨</span>
                        MỞ TRẢI NGHIỆM AR
                      </button>
                      <p className="text-[10px] text-neutral-400 text-center font-light mt-2 italic">
                        Bấm tiếp "Mở AR thật" trên điện thoại HTTPS để track mặt đất và đặt nhân vật.
                      </p>
                    </div>

                    {/* Đường phân chia ngăn cách */}
                    <div className="relative flex items-center justify-center py-2">
                      <div className="w-full border-t border-neutral-100"></div>
                      <span className="absolute bg-white px-3 text-[10px] text-neutral-400 font-medium tracking-widest uppercase">Hoặc</span>
                    </div>

                    {/* TUỲ CHỌN 2: NHẬP MÃ NGÀY THỦ CÔNG */}
                    <form onSubmit={handleManualCheckin} className="checkin-manual-form space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                          Đóng dấu thủ công bằng mã ngày
                        </label>
                        <div className="flex gap-2">
                          <input 
                            placeholder="Mã ngày tại quầy (VD: SCD2026)" 
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            className="flex-1 h-11 px-4 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-neutral-800 placeholder-neutral-400 font-medium tracking-wide uppercase"
                          />
                          <button
                            type="submit"
                            className="h-11 px-5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider active:scale-98 transition-all"
                          >
                            Đóng dấu
                          </button>
                        </div>
                      </div>
                      
                      {errorMessage && (
                        <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
                      )}
                    </form>
                  </div>
                )}
              </div>

            </div>
            {station.gallery?.length > 1 && (
              <div className="checkin-gallery" aria-label={`Ảnh tham khảo ${station.name}`}>
                {station.gallery.slice(1, 4).map((image) => (
                  <img key={image} src={image} alt="" loading="lazy" decoding="async" />
                ))}
              </div>
            )}
          </div>

          {/* Hiệu ứng đóng dấu thủ công thành công */}
          {showManualSuccess && (
            <div className="fixed inset-0 z-50 bg-black/75 flex flex-col items-center justify-center animate-fade-in pointer-events-none">
              <div className="relative flex flex-col items-center gap-6 animate-scale-up">
                <div className="w-36 h-36 rounded-full border-[6px] border-red-600 border-dashed flex flex-col items-center justify-center text-red-600 bg-white shadow-2xl p-4 transform -rotate-12 animate-pulse">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Sắc Cố Đô</span>
                  <div className="w-full h-[2px] bg-red-600 my-1"></div>
                  <span className="text-center font-extrabold text-xs uppercase leading-tight">{station.stamp}</span>
                  <div className="w-full h-[2px] bg-red-600 my-1"></div>
                  <span className="text-[9px] font-bold tracking-wider">ĐÃ ĐÓNG DẤU</span>
                </div>
                <div className="text-center text-white">
                  <h2 className="text-2xl font-bold tracking-wide text-amber-200">Đang đóng dấu...</h2>
                  <p className="text-xs text-neutral-300 mt-1">Hệ thống đang cập nhật passport số của bạn.</p>
                </div>
              </div>
            </div>
          )}
        </UtilityPage>
      )}

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
