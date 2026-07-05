"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import SectionTitle from "./SectionTitle";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { requestSePayCheckout, submitSePayForm } from "../../lib/sepay/browser";
import { useToast } from "./ToastProvider";

const CERTS = [
  {
    id: "beginner",
    title: "Ke lu hanh to mo",
    description: "Da ghe tham 2 dia diem di san",
    required: 2,
    icon: "/assets/ho-chieu-hanh-trinh/desktop-icon/ic-cert-1.svg",
    svgUrl: "/certificate/begin.svg",
  },
  {
    id: "photographer",
    title: "Nhiep anh gia Co do",
    description: "Check-in tai 4 dia diem",
    required: 4,
    icon: "/assets/ho-chieu-hanh-trinh/desktop-icon/ic-cert-2.svg",
    svgUrl: "/certificate/HERITAGE-PHOTOGRAPHER.svg",
  },
  {
    id: "champion",
    title: "Nha chinh phuc Co do",
    description: "Dong du 6 dau moc di san",
    required: 6,
    icon: "/assets/ho-chieu-hanh-trinh/desktop-icon/ic-cert-3.svg",
    svgUrl: "/certificate/HERITAGE-CHAMPION.svg",
  },
];

function toDateValue(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = toDateValue(value);
  if (!date) return "Chua co";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatVnd(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}d`;
}

function orderStatusLabel(status) {
  return (
    {
      pending: "Cho xu ly",
      paid: "Da thanh toan",
      shipping: "Dang giao",
      completed: "Hoan thanh",
      cancelled: "Da huy",
      failed: "That bai",
    }[status] || status || "pending"
  );
}

function paymentStatusLabel(status) {
  return (
    {
      pending: "Cho thanh toan",
      paid: "Da thanh toan",
      failed: "That bai",
      refunded: "Da hoan tien",
    }[status] || status || "pending"
  );
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
  const [paymentReturn, setPaymentReturn] = useState("");
  const [isPayingOrderId, setIsPayingOrderId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setRequestedOrderId(params.get("order") || "");
    setPaymentReturn(params.get("payment") || "");
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
    if (!db || !user) {
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
    if (!db || !selectedOrderId || !user) {
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

  useEffect(() => {
    if (!paymentReturn) return;

    if (paymentReturn === "success") {
      showToast("Da quay lai tu SePay. He thong dang doi IPN xac nhan thanh toan.", "success");
    } else if (paymentReturn === "cancel") {
      showToast("Ban da huy thanh toan SePay. Co the thu lai bat cu luc nao.", "info");
    } else if (paymentReturn === "error") {
      showToast("SePay tra ve trang thai loi. Vui long thu lai hoac lien he ho tro.", "error");
    }
  }, [paymentReturn, showToast]);

  async function handleSaveProfile(event) {
    event.preventDefault();
    if (!fullName.trim()) {
      showToast("Vui long nhap ho va ten.", "error");
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
      showToast("Cap nhat thong tin thanh cong.", "success");
    } catch (error) {
      console.error("Profile update failed:", error);
      showToast("Khong the cap nhat thong tin. Vui long thu lai.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  const unlockedCerts = useMemo(() => CERTS.filter((item) => completedCount >= item.required), [completedCount]);
  const selectedOrder = useMemo(() => orders.find((item) => item.id === selectedOrderId) || null, [orders, selectedOrderId]);

  async function handleRetrySePay(order) {
    if (!order?.id || !user) {
      showToast("Dang nhap de tiep tuc thanh toan.", "info");
      return;
    }

    setIsPayingOrderId(order.id);

    try {
      const payment = await requestSePayCheckout({ orderId: order.id, user });
      showToast(`Dang chuyen den cong thanh toan cho don ${order.orderCode || order.id}.`, "success");
      submitSePayForm(payment);
    } catch (error) {
      console.error("Retry SePay failed:", error);
      showToast(error.message || "Khong the mo lai phien thanh toan SePay.", "error");
    } finally {
      setIsPayingOrderId("");
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <SectionTitle
          eyebrow="Tai khoan"
          title="Cua toi"
          description="Quan ly thong tin ca nhan, theo doi certificate di san va kiem tra trang thai don hang cua ban."
        />

        <div className="profile-page-container">
          <section className="profile-card" aria-label="Thong tin ca nhan">
            <h2>Thong tin ca nhan</h2>

            {!user ? (
              <div className="profile-login-prompt font-baloo">
                Ban dang truy cap o che do <strong>Khach tham quan</strong>. Dang nhap de dong bo don hang, tien trinh va certificate.
                <a href="/dang-nhap">Dang nhap ngay</a>
              </div>
            ) : null}

            <form onSubmit={handleSaveProfile}>
              <div className="profile-form-group">
                <label className="font-baloo">Ho va ten</label>
                <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nhap ho va ten..." required />
              </div>

              <div className="profile-form-group">
                <label className="font-baloo">Email</label>
                <input type="email" value={user?.email || "Chua dang nhap"} disabled />
              </div>

              <div className="profile-form-group">
                <label className="font-baloo">So dien thoai</label>
                <input type="text" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Nhap so dien thoai..." />
              </div>

              <button type="submit" className="profile-submit-btn font-baloo" disabled={isSaving}>
                {isSaving ? "Dang luu..." : "Luu thay doi"}
              </button>
            </form>

            {user ? (
              <button
                type="button"
                className="profile-logout-btn font-baloo"
                onClick={async () => {
                  await logout();
                  showToast("Ban da dang xuat thanh cong.", "info");
                  window.location.href = "/";
                }}
              >
                Dang xuat tai khoan
              </button>
            ) : null}
          </section>

          <section className="profile-card" aria-label="Certificate di san">
            <h2>Certificate dat duoc ({unlockedCerts.length}/3)</h2>
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
                          <span className="badge-unlocked font-baloo">Da dat</span>
                          <button type="button" className="profile-cert-action-btn font-baloo" onClick={() => setSelectedCert(cert)}>
                            Nhan certificate
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="badge-locked font-baloo">Chua dat</span>
                          <p style={{ fontSize: "11px", color: "#a0aec0", fontStyle: "italic" }}>
                            Tien trinh: {completedCount}/{cert.required} chang
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
              <span style={{ color: "#8a6418", fontSize: "12px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Module 2
              </span>
              <h2 style={{ margin: 0, color: "#063823" }}>Don hang cua toi</h2>
              <p style={{ margin: 0, color: "#64748b", lineHeight: 1.7 }}>
                Theo doi trang thai xu ly, thanh toan va giao hang ngay trong tai khoan.
              </p>
            </div>

            {loadingOrders ? <EmptyCard title="Dang tai don hang..." description="He thong dang lay lich su order tu Firebase." /> : null}
            {!loadingOrders && !user ? (
              <EmptyCard
                title="Dang nhap de xem don hang"
                description="Lich su order duoc gan theo tai khoan Firebase cua ban."
                actionHref="/dang-nhap?next=/cua-toi"
                actionLabel="Dang nhap ngay"
              />
            ) : null}
            {!loadingOrders && user && orders.length === 0 ? (
              <EmptyCard
                title="Chua co don hang nao"
                description="Sau khi dat hang tu gio hang, don se hien tai day de ban va admin cung theo doi."
                actionHref="/san-pham"
                actionLabel="Kham pha san pham"
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
                title="Chon mot don hang"
                description="Chi tiet xu ly, timeline va danh sach san pham se hien o day khi ban chon mot order."
              />
            ) : (
              <>
                <div style={{ display: "grid", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    <div>
                      <span style={{ color: "#8a6418", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "12px" }}>
                        Order tracking
                      </span>
                      <h2 style={{ margin: "6px 0 0", color: "#063823" }}>{selectedOrder.orderCode || selectedOrder.id}</h2>
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <StatusBadge status={selectedOrder.orderStatus} />
                      <StatusBadge status={selectedOrder.paymentStatus} type="payment" />
                    </div>
                  </div>
                  <p style={{ margin: 0, color: "#64748b", lineHeight: 1.7 }}>
                    Phuong thuc thanh toan: <strong>{(selectedOrder.paymentMethod || "cod").toUpperCase()}</strong> · Cap nhat gan nhat {formatDate(selectedOrder.updatedAt || selectedOrder.createdAt)}
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
                    <strong style={{ color: "#063823" }}>Nguoi nhan</strong>
                    <p style={{ margin: "8px 0 0", color: "#0f172a" }}>{selectedOrder.customer?.name || "Chua co"}</p>
                    <small style={{ color: "#64748b" }}>{selectedOrder.customer?.phone || selectedOrder.customer?.email || "Chua co thong tin lien he"}</small>
                  </div>
                  <div style={{ padding: "16px", borderRadius: "18px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <strong style={{ color: "#063823" }}>Tong thanh toan</strong>
                    <p style={{ margin: "8px 0 0", color: "#0f172a", fontSize: "20px", fontWeight: 900 }}>{formatVnd(selectedOrder.total)}</p>
                    <small style={{ color: "#64748b" }}>
                      Tam tinh {formatVnd(selectedOrder.subtotal)} · Ship {formatVnd(selectedOrder.shippingFee)}
                    </small>
                  </div>
                </div>

                {selectedOrder.paymentMethod === "sepay" && selectedOrder.paymentStatus !== "paid" ? (
                  <section
                    style={{
                      padding: "18px",
                      borderRadius: "18px",
                      border: "1px solid rgba(29, 78, 216, 0.16)",
                      background: "#eff6ff",
                      display: "grid",
                      gap: "10px",
                    }}
                  >
                    <strong style={{ color: "#1d4ed8" }}>Thanh toan SePay</strong>
                    <span style={{ color: "#1e3a8a", lineHeight: 1.7 }}>
                      Don hang nay dang cho thanh toan. Ban co the mo lai cong thanh toan SePay de hoan tat giao dich.
                    </span>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleRetrySePay(selectedOrder)}
                        disabled={isPayingOrderId === selectedOrder.id}
                        style={{
                          minHeight: "44px",
                          borderRadius: "999px",
                          border: "none",
                          padding: "0 20px",
                          background: "#1d4ed8",
                          color: "#ffffff",
                          fontWeight: 800,
                          cursor: isPayingOrderId === selectedOrder.id ? "wait" : "pointer",
                        }}
                      >
                        {isPayingOrderId === selectedOrder.id ? "Dang mo SePay..." : "Thanh toan voi SePay"}
                      </button>
                      {selectedOrder.sepay?.orderInvoiceNumber ? (
                        <small style={{ color: "#1e3a8a" }}>
                          Ma thanh toan: {selectedOrder.sepay.orderInvoiceNumber}
                        </small>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                <section style={{ display: "grid", gap: "12px" }}>
                  <h3 style={{ margin: 0, color: "#063823" }}>San pham</h3>
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
                          <strong style={{ color: "#063823" }}>{item.name || item.slug || "San pham"}</strong>
                          <span style={{ color: "#64748b", fontSize: "13px" }}>So luong: {Number(item.quantity || 1)}</span>
                        </div>
                        <strong style={{ color: "#0f172a" }}>{formatVnd(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
                      </article>
                    ))}
                  </div>
                </section>

                <section style={{ display: "grid", gap: "12px" }}>
                  <h3 style={{ margin: 0, color: "#063823" }}>Timeline</h3>
                  {orderEvents.length === 0 ? (
                    <EmptyCard title="Chua co event timeline" description="He thong se hien cac moc tao don, thanh toan, giao hang va hoan thanh tai day." />
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
                            <strong style={{ color: "#063823" }}>{item.message || item.type || "Event"}</strong>
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
          initialName={fullName || profile?.fullName || user?.displayName || "Lu khach di san"}
        />
      ) : null}
    </>
  );
}

function LocalCertificateModal({ certificate, onClose, initialName }) {
  const [customName, setCustomName] = useState(initialName || "Lu khach hieu ky");
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
        <button type="button" className="cert-modal-close" onClick={onClose} aria-label="Dong">
          ×
        </button>

        <div className="cert-modal-left">
          <h3>Chung nhan di san</h3>
          <p className="cert-modal-hint font-baloo">Ho ten in tren chung chi:</p>

          <div className="cert-input-group">
            <input type="text" value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Nhap ho ten nhan chung chi..." maxLength={40} />
          </div>

          <div className="cert-modal-actions">
            <button type="button" className="cert-download-btn font-baloo" onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? "Dang tao..." : "Tai xuong certificate (PNG)"}
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
