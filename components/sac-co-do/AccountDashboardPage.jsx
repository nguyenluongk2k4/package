"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import SectionTitle from "./SectionTitle";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useToast } from "./ToastProvider";

const CERTS = [
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
    description: "Đóng đủ 6 dấu mốc di sản",
    required: 6,
    icon: "/assets/ho-chieu-hanh-trinh/desktop-icon/ic-cert-3.svg",
    svgUrl: "/certificate/HERITAGE-CHAMPION.svg",
  },
];

const ORDER_HISTORY_ENABLED = false;

function toDateValue(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = toDateValue(value);
  if (!date) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatVnd(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function orderStatusLabel(status) {
  return (
    {
      pending: "Chờ xử lý",
      paid: "Đã thanh toán",
      shipping: "Đang giao",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
      failed: "Thất bại",
    }[status] || status || "pending"
  );
}

function paymentStatusLabel(status) {
  return (
    {
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      failed: "Thất bại",
      refunded: "Đã hoàn tiền",
    }[status] || status || "pending"
  );
}

function timelineMessageLabel(item) {
  const rawMessage = String(item?.message || item?.type || "Cập nhật đơn hàng");
  const normalizedMessage = rawMessage.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (item?.type === "sepay_ipn") {
    if (item?.notificationType === "ORDER_PAID") return "Xác nhận thanh toán thành công";
    if (item?.notificationType === "TRANSACTION_VOID") return "Thanh toán không thành công";
    return "Cập nhật trạng thái thanh toán";
  }

  if (item?.type === "sepay_checkout_ready") {
    return "Khởi tạo phiên thanh toán";
  }

  if (item?.type === "order_created" && /sepay/i.test(normalizedMessage)) {
    return "Người dùng tạo đơn chờ thanh toán";
  }

  if (/xac nhan thanh toan sepay/i.test(normalizedMessage)) {
    return "Xác nhận thanh toán thành công";
  }

  if (/khoi tao phien thanh toan sepay/i.test(normalizedMessage)) {
    return "Khởi tạo phiên thanh toán";
  }

  return rawMessage
    .replace(/SePay/gi, "Thanh toán")
    .replace(/sepay/gi, "thanh toán");
}

function StatusBadge({ status, type = "order" }) {
  let palette = { background: "#e2e8f0", color: "#334155" };

  if (type === "payment") {
    if (status === "paid") palette = { background: "#dcfce7", color: "#166534" };
    if (status === "failed") palette = { background: "#fee2e2", color: "#b91c1c" };
    if (status === "refunded") palette = { background: "#ede9fe", color: "#6d28d9" };
    if (status === "pending") palette = { background: "#fef3c7", color: "#92400e" };
  } else {
    if (status === "pending") palette = { background: "#fef3c7", color: "#92400e" };
    if (status === "paid") palette = { background: "#dbeafe", color: "#1d4ed8" };
    if (status === "shipping") palette = { background: "#cffafe", color: "#0f766e" };
    if (status === "completed") palette = { background: "#dcfce7", color: "#166534" };
    if (status === "cancelled" || status === "failed") palette = { background: "#fee2e2", color: "#b91c1c" };
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 800,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        ...palette,
      }}
    >
      {type === "payment" ? paymentStatusLabel(status) : orderStatusLabel(status)}
    </span>
  );
}

function EmptyCard({ title, description, actionHref, actionLabel }) {
  return (
    <article
      style={{
        padding: "24px",
        borderRadius: "22px",
        border: "1px dashed rgba(16, 76, 39, 0.18)",
        background: "#f8fafc",
        display: "grid",
        gap: "10px",
      }}
    >
      <h3 style={{ margin: 0, color: "#063823" }}>{title}</h3>
      <p style={{ margin: 0, color: "#64748b", lineHeight: 1.7 }}>{description}</p>
      {actionHref && actionLabel ? (
        <a href={actionHref} style={{ color: "#104c27", fontWeight: 800 }}>
          {actionLabel}
        </a>
      ) : null}
    </article>
  );
}

export default function AccountDashboardPage() {
  const { user, db, profile, refreshProfile, logout } = useFirebaseAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [selectedCert, setSelectedCert] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [orderEvents, setOrderEvents] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [requestedOrderId, setRequestedOrderId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setRequestedOrderId(params.get("order") || "");
  }, []);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || profile.displayName || user?.displayName || "");
      setPhoneNumber(profile.phoneNumber || profile.phone || "");
    } else if (user) {
      setFullName(user.displayName || "");
      setPhoneNumber("");
    } else if (typeof window !== "undefined") {
      setFullName(localStorage.getItem("scd_guest_name") || "");
      setPhoneNumber(localStorage.getItem("scd_guest_phone") || "");
    }
  }, [profile, user]);

  useEffect(() => {
    let active = true;

    async function loadJourneyStats() {
      let guestCount = 0;
      if (typeof window !== "undefined") {
        try {
          const visitedList = JSON.parse(localStorage.getItem("scd_visited_stations") || "[]");
          guestCount = visitedList.length;
        } catch {}
      }

      if (!db || !user) {
        if (active) setCompletedCount(guestCount);
        return;
      }

      try {
        const querySnapshot = await getDocs(collection(db, "users", user.uid, "journeyProgress"));
        if (!active) return;
        setCompletedCount(Math.max(querySnapshot.size, guestCount));
      } catch (error) {
        console.warn("Journey stats load failed:", error);
        if (active) setCompletedCount(guestCount);
      }
    }

    loadJourneyStats();
    return () => {
      active = false;
    };
  }, [db, user]);

  useEffect(() => {
    if (!ORDER_HISTORY_ENABLED || !db || !user) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    let active = true;

    async function loadOrders() {
      setLoadingOrders(true);
      try {
        const snapshot = await getDocs(query(collection(db, "orders"), where("userId", "==", user.uid)));
        if (!active) return;

        const rows = snapshot.docs
          .map((orderDoc) => ({ id: orderDoc.id, ...orderDoc.data() }))
          .sort((a, b) => (toDateValue(b.updatedAt || b.createdAt)?.getTime() || 0) - (toDateValue(a.updatedAt || a.createdAt)?.getTime() || 0));

        setOrders(rows);
        if (requestedOrderId && rows.some((item) => item.id === requestedOrderId || item.orderCode === requestedOrderId)) {
          setSelectedOrderId(requestedOrderId);
        } else if (!selectedOrderId && rows[0]?.id) {
          setSelectedOrderId(rows[0].id);
        }
      } catch (error) {
        console.warn("Order load failed:", error);
        if (active) setOrders([]);
      } finally {
        if (active) setLoadingOrders(false);
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, [db, requestedOrderId, selectedOrderId, user]);

  useEffect(() => {
    if (!ORDER_HISTORY_ENABLED || !db || !selectedOrderId || !user) {
      setOrderEvents([]);
      return;
    }

    let active = true;

    async function loadOrderEvents() {
      try {
        const snapshot = await getDocs(collection(db, "orders", selectedOrderId, "events"));
        if (!active) return;

        const rows = snapshot.docs
          .map((eventDoc) => ({ id: eventDoc.id, ...eventDoc.data() }))
          .sort((a, b) => (toDateValue(b.createdAt)?.getTime() || 0) - (toDateValue(a.createdAt)?.getTime() || 0));

        setOrderEvents(rows);
      } catch (error) {
        console.warn("Order events load failed:", error);
        if (active) setOrderEvents([]);
      }
    }

    loadOrderEvents();

    return () => {
      active = false;
    };
  }, [db, selectedOrderId, user]);

  async function handleSaveProfile(event) {
    event.preventDefault();
    if (!fullName.trim()) {
      showToast("Vui lòng nhập họ và tên.", "error");
      return;
    }

    setIsSaving(true);
    try {
      if (user && db) {
        await setDoc(
          doc(db, "users", user.uid),
          {
            fullName: fullName.trim(),
            displayName: fullName.trim(),
            phone: phoneNumber.trim(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        await refreshProfile();
      } else if (typeof window !== "undefined") {
        localStorage.setItem("scd_guest_name", fullName.trim());
        localStorage.setItem("scd_guest_phone", phoneNumber.trim());
      }
      showToast("Cập nhật thông tin thành công.", "success");
    } catch (error) {
      console.error("Profile update failed:", error);
      showToast("Không thể cập nhật thông tin. Vui lòng thử lại.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  const unlockedCerts = useMemo(() => CERTS.filter((item) => completedCount >= item.required), [completedCount]);
  const selectedOrder = useMemo(() => orders.find((item) => item.id === selectedOrderId) || null, [orders, selectedOrderId]);

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <SectionTitle
          eyebrow="Tài khoản"
          title="Của tôi"
          description="Quản lý thông tin cá nhân, theo dõi hành trình và certificate di sản của bạn."
        />

        <div className="profile-page-container">
          <section className="profile-card" aria-label="Thông tin cá nhân">
            <h2>Thông tin cá nhân</h2>

            {!user ? (
              <div className="profile-login-prompt font-baloo">
                Bạn đang truy cập ở chế độ <strong>Khách tham quan</strong>. Đăng nhập để đồng bộ tiến trình và certificate.
                <a href="/dang-nhap">Đăng nhập ngay</a>
              </div>
            ) : null}

            <form onSubmit={handleSaveProfile}>
              <div className="profile-form-group">
                <label className="font-baloo">Họ và tên</label>
                <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nhập họ và tên..." required />
              </div>

              <div className="profile-form-group">
                <label className="font-baloo">Email</label>
                <input type="email" value={user?.email || "Chưa đăng nhập"} disabled />
              </div>

              <div className="profile-form-group">
                <label className="font-baloo">Số điện thoại</label>
                <input type="text" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Nhập số điện thoại..." />
              </div>

              <button type="submit" className="profile-submit-btn font-baloo" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </form>

            {user ? (
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
            ) : null}
          </section>

          <section className="profile-card" aria-label="Certificate di sản">
            <h2>Certificate đạt được ({unlockedCerts.length}/3)</h2>
            <div className="profile-certs-list">
              {CERTS.map((cert) => {
                const isUnlocked = completedCount >= cert.required;
                return (
                  <article className={`profile-cert-item ${isUnlocked ? "is-unlocked" : ""}`} key={cert.id}>
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
                          <span className="badge-unlocked font-baloo">Đã đạt</span>
                          <button type="button" className="profile-cert-action-btn font-baloo" onClick={() => setSelectedCert(cert)}>
                            Nhận certificate
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="badge-locked font-baloo">Chưa đạt</span>
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

        <section
          className="legacy-orders-section"
          style={{
            width: "min(1180px, calc(100% - 32px))",
            margin: "40px auto 0",
            display: "grid",
            gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
            gap: "24px",
          }}
        >
          <article
            style={{
              background: "#ffffff",
              border: "1px solid rgba(16, 76, 39, 0.1)",
              borderRadius: "26px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(6, 56, 35, 0.06)",
              display: "grid",
              gap: "18px",
              alignSelf: "start",
            }}
          >
            <div style={{ display: "grid", gap: "6px" }}>
              <h2 style={{ margin: 0, color: "#063823" }}>Đơn hàng của tôi</h2>
              <p style={{ margin: 0, color: "#64748b", lineHeight: 1.7 }}>
                Theo dõi trạng thái xử lý, thanh toán và giao hàng ngay trong tài khoản.
              </p>
            </div>

            {loadingOrders ? <EmptyCard title="Đang tải đơn hàng..." description="Hệ thống đang lấy lịch sử đơn hàng từ Firebase." /> : null}
            {!loadingOrders && !user ? (
              <EmptyCard
                title="Đăng nhập để xem đơn hàng"
                description="Lịch sử đơn hàng được gắn theo tài khoản Firebase của bạn."
                actionHref="/dang-nhap?next=/cua-toi"
                actionLabel="Đăng nhập ngay"
              />
            ) : null}
            {!loadingOrders && user && orders.length === 0 ? (
              <EmptyCard
                title="Chưa có đơn hàng nào"
                description="Sau khi đặt hàng từ giỏ hàng, đơn sẽ hiện tại đây để bạn và admin cùng theo dõi."
                actionHref="/san-pham"
                actionLabel="Khám phá sản phẩm"
              />
            ) : null}

            {!loadingOrders && user && orders.length > 0 ? (
              <div style={{ display: "grid", gap: "12px" }}>
                {orders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    style={{
                      border: selectedOrderId === order.id ? "1px solid rgba(16, 76, 39, 0.24)" : "1px solid rgba(16, 76, 39, 0.08)",
                      background: selectedOrderId === order.id ? "rgba(240, 249, 244, 0.9)" : "#ffffff",
                      borderRadius: "18px",
                      padding: "16px",
                      display: "grid",
                      gap: "10px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <strong style={{ color: "#063823" }}>{order.orderCode || order.id}</strong>
                      <StatusBadge status={order.orderStatus} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", color: "#64748b", fontSize: "13px" }}>
                      <span>{formatDate(order.createdAt)}</span>
                      <span>{formatVnd(order.total)}</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <StatusBadge status={order.paymentStatus} type="payment" />
                      <span style={{ color: "#0f172a", fontWeight: 700, fontSize: "13px" }}>
                        {(order.paymentMethod || "cod").toUpperCase()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </article>

          <article
            style={{
              background: "#ffffff",
              border: "1px solid rgba(16, 76, 39, 0.1)",
              borderRadius: "26px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(6, 56, 35, 0.06)",
              display: "grid",
              gap: "20px",
            }}
          >
            {!selectedOrder ? (
              <EmptyCard
                title="Chọn một đơn hàng"
                description="Chi tiết xử lý, timeline và danh sách sản phẩm sẽ hiện ở đây khi bạn chọn một đơn hàng."
              />
            ) : (
              <>
                <div style={{ display: "grid", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    <div>
                      <span style={{ color: "#8a6418", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "12px" }}>
                        Theo dõi đơn hàng
                      </span>
                      <h2 style={{ margin: "6px 0 0", color: "#063823" }}>{selectedOrder.orderCode || selectedOrder.id}</h2>
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <StatusBadge status={selectedOrder.orderStatus} />
                      <StatusBadge status={selectedOrder.paymentStatus} type="payment" />
                    </div>
                  </div>
                  <p style={{ margin: 0, color: "#64748b", lineHeight: 1.7 }}>
                    Phương thức thanh toán: <strong>{(selectedOrder.paymentMethod || "cod").toUpperCase()}</strong> · Cập nhật gần nhất {formatDate(selectedOrder.updatedAt || selectedOrder.createdAt)}
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "14px",
                  }}
                >
                  <div style={{ padding: "16px", borderRadius: "18px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <strong style={{ color: "#063823" }}>Người nhận</strong>
                    <p style={{ margin: "8px 0 0", color: "#0f172a" }}>{selectedOrder.customer?.name || "Chưa có"}</p>
                    <small style={{ color: "#64748b" }}>{selectedOrder.customer?.phone || selectedOrder.customer?.email || "Chưa có thông tin liên hệ"}</small>
                  </div>
                  <div style={{ padding: "16px", borderRadius: "18px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <strong style={{ color: "#063823" }}>Tổng thanh toán</strong>
                    <p style={{ margin: "8px 0 0", color: "#0f172a", fontSize: "20px", fontWeight: 900 }}>{formatVnd(selectedOrder.total)}</p>
                    <small style={{ color: "#64748b" }}>
                      Tạm tính {formatVnd(selectedOrder.subtotal)} · Ship {formatVnd(selectedOrder.shippingFee)}
                    </small>
                  </div>
                </div>

                <section style={{ display: "grid", gap: "12px" }}>
                  <h3 style={{ margin: 0, color: "#063823" }}>Sản phẩm</h3>
                  <div style={{ display: "grid", gap: "12px" }}>
                    {(selectedOrder.items || []).map((item, index) => (
                      <article
                        key={`${item.productId || item.slug || item.name || "item"}-${index}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "72px 1fr auto",
                          gap: "14px",
                          alignItems: "center",
                          padding: "14px 0",
                          borderBottom: "1px solid #edf1ef",
                        }}
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.name || "Item"} style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "14px" }} />
                        ) : (
                          <div style={{ width: "72px", height: "72px", borderRadius: "14px", background: "#e2e8f0", display: "grid", placeItems: "center", color: "#64748b", fontWeight: 800 }}>
                            SP
                          </div>
                        )}
                        <div style={{ display: "grid", gap: "4px" }}>
                          <strong style={{ color: "#063823" }}>{item.name || item.slug || "Sản phẩm"}</strong>
                          <span style={{ color: "#64748b", fontSize: "13px" }}>Số lượng: {Number(item.quantity || 1)}</span>
                        </div>
                        <strong style={{ color: "#0f172a" }}>{formatVnd(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
                      </article>
                    ))}
                  </div>
                </section>

                <section style={{ display: "grid", gap: "12px" }}>
                  <h3 style={{ margin: 0, color: "#063823" }}>Timeline</h3>
                  {orderEvents.length === 0 ? (
                    <EmptyCard title="Chưa có mốc timeline" description="Hệ thống sẽ hiện các mốc tạo đơn, thanh toán, giao hàng và hoàn thành tại đây." />
                  ) : (
                    <div style={{ display: "grid", gap: "12px" }}>
                      {orderEvents.map((item) => (
                        <article
                          key={item.id}
                          style={{
                            padding: "16px 18px",
                            borderRadius: "18px",
                            border: "1px solid rgba(16, 76, 39, 0.1)",
                            background: "#fcfffd",
                            display: "grid",
                            gap: "6px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                            <strong style={{ color: "#063823" }}>{timelineMessageLabel(item)}</strong>
                            <small style={{ color: "#64748b" }}>{formatDate(item.createdAt)}</small>
                          </div>
                          {item.from || item.to ? (
                            <span style={{ color: "#64748b", fontSize: "13px" }}>
                              {`${orderStatusLabel(item.from)} -> ${orderStatusLabel(item.to)}`}
                            </span>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </article>
        </section>
      </main>
      <SiteFooter />

      {selectedCert ? (
        <LocalCertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
          initialName={fullName || profile?.fullName || user?.displayName || "Lữ khách di sản"}
        />
      ) : null}
    </>
  );
}

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
      document.fonts.load('1em "Alex Brush"').then(() => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(110 * scale, 396 * scale, 375 * scale, 58 * scale);
        ctx.fillStyle = "#1a1a1a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${32 * scale}px "Alex Brush", cursive`;
        ctx.fillText(customName, (595.5 / 2) * scale, 428 * scale);

        try {
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `Chung_Nhan_Scd_${certificate.id}_${customName.replace(/\s+/g, "_")}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error("Canvas export failed:", error);
        } finally {
          setIsDownloading(false);
        }
      }).catch(() => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(110 * scale, 396 * scale, 375 * scale, 58 * scale);
        ctx.fillStyle = "#1a1a1a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${28 * scale}px "Alex Brush", cursive`;
        ctx.fillText(customName, (595.5 / 2) * scale, 428 * scale);

        try {
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `Chung_Nhan_Scd_${certificate.id}_${customName.replace(/\s+/g, "_")}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error("Canvas export failed:", error);
        } finally {
          setIsDownloading(false);
        }
      });
    };

    img.onerror = () => setIsDownloading(false);
  };

  return (
    <div className="cert-modal-backdrop" onClick={onClose}>
      <div className="cert-modal-content" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="cert-modal-close" onClick={onClose} aria-label="Đóng">
          ×
        </button>

        <div className="cert-modal-left">
          <h3>Chứng nhận di sản</h3>
          <p className="cert-modal-hint font-baloo">Họ tên in trên chứng chỉ:</p>

          <div className="cert-input-group">
            <input type="text" value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Nhập họ tên nhận chứng chỉ..." maxLength={40} />
          </div>

          <div className="cert-modal-actions">
            <button type="button" className="cert-download-btn font-baloo" onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? "Đang tạo..." : "Tải xuống certificate (PNG)"}
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
