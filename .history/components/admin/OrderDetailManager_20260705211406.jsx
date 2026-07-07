"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import AdminLayout from "./AdminLayout";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";

const ORDER_STATUS_OPTIONS = ["pending", "paid", "shipping", "completed", "cancelled", "failed"];
const PAYMENT_STATUS_OPTIONS = ["pending", "paid", "failed", "refunded"];
const PAYMENT_METHOD_OPTIONS = ["cod", "sepay"];

const PAYMENT_METHOD_LABEL = {
  cod: "Tiền mặt (COD)",
  sepay: "Chuyển khoản",
};

const ORDER_STATUS_LABEL = {
  pending: "Chờ xử lý",
  paid: "Đã thanh toán",
  shipping: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  failed: "Thất bại",
};

const PAYMENT_STATUS_LABEL = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  refunded: "Đã hoàn tiền",
};

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

function normalizeOrder(item) {
  const customer = item.customer || {};
  const shippingAddress = item.shippingAddress || {};
  const items = Array.isArray(item.items) ? item.items : [];
  const subtotal = Number(
    item.subtotal
      ?? items.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.quantity || 0), 0)
  );
  const shippingFee = Number(item.shippingFee || 0);
  const discount = Number(item.discount || 0);
  const total = Number(item.total ?? subtotal + shippingFee - discount);

  return {
    ...item,
    customer,
    shippingAddress,
    items,
    subtotal,
    shippingFee,
    discount,
    total,
    orderStatus: item.orderStatus || "pending",
    paymentStatus: item.paymentStatus || "pending",
    paymentMethod: item.paymentMethod || "cod",
    shippingProvider: item.shippingProvider || "",
    trackingCode: item.trackingCode || "",
    notes: item.notes || "",
    sepay: item.sepay || {},
  };
}

function EmptyState({ message }) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "14px",
        border: "1px dashed rgba(5, 52, 44, 0.16)",
        background: "#f8fafc",
        color: "#64748b",
        fontSize: "14px",
      }}
    >
      {message}
    </div>
  );
}

function StatusBadge({ status, kind = "order" }) {
  let palette = { background: "#e2e8f0", color: "#334155" };

  if (kind === "payment") {
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

  const label = kind === "payment" ? (PAYMENT_STATUS_LABEL[status] || status) : (ORDER_STATUS_LABEL[status] || status);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        ...palette,
      }}
    >
      {label}
    </span>
  );
}

export default function OrderDetailManager({ orderId }) {
  const { db, isAdmin } = useFirebaseAuth();
  const [order, setOrder] = useState(null);
  const [events, setEvents] = useState([]);
  const [draft, setDraft] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!db || !isAdmin || !orderId) return;

    let mounted = true;

    async function loadOrder() {
      setLoadingOrder(true);
      setMessage("");

      try {
        const snapshot = await getDoc(doc(db, "orders", orderId));
        if (!mounted) return;

        if (!snapshot.exists()) {
          setOrder(null);
          setDraft(null);
          return;
        }

        const normalized = normalizeOrder({ id: snapshot.id, ...snapshot.data() });
        setOrder(normalized);
        setDraft({
          orderStatus: normalized.orderStatus || "pending",
          paymentStatus: normalized.paymentStatus || "pending",
          paymentMethod: normalized.paymentMethod || "cod",
          shippingProvider: normalized.shippingProvider || "",
          trackingCode: normalized.trackingCode || "",
          notes: normalized.notes || "",
        });
      } catch (error) {
        if (!mounted) return;
        console.error("Order detail load failed:", error);
        setOrder(null);
        setMessage("Không thể tải chi tiết đơn hàng này.");
      } finally {
        if (mounted) setLoadingOrder(false);
      }
    }

    loadOrder();

    return () => {
      mounted = false;
    };
  }, [db, isAdmin, orderId]);

  useEffect(() => {
    if (!db || !isAdmin || !orderId) return;

    let mounted = true;

    async function loadEvents() {
      setLoadingEvents(true);
      try {
        let snapshot;
        try {
          snapshot = await getDocs(query(collection(db, "orders", orderId, "events"), orderBy("createdAt", "desc")));
        } catch {
          snapshot = await getDocs(collection(db, "orders", orderId, "events"));
        }

        if (!mounted) return;
        setEvents(
          snapshot.docs
            .map((eventDoc) => ({ id: eventDoc.id, ...eventDoc.data() }))
            .sort((a, b) => (toDateValue(b.createdAt)?.getTime() || 0) - (toDateValue(a.createdAt)?.getTime() || 0))
        );
      } catch (error) {
        if (!mounted) return;
        console.error("Order events load failed:", error);
        setEvents([]);
      } finally {
        if (mounted) setLoadingEvents(false);
      }
    }

    loadEvents();

    return () => {
      mounted = false;
    };
  }, [db, isAdmin, orderId]);

  const customerDisplayName = useMemo(() => {
    if (!order) return "";
    return order.customer?.name || order.customer?.email || "Khách lẻ";
  }, [order]);

  function patchOrder(partial) {
    setOrder((current) => (current ? normalizeOrder({ ...current, ...partial }) : current));
  }

  function setDraftField(name, value) {
    setDraft((current) => ({ ...(current || {}), [name]: value }));
  }

  function validateOrderDraft(currentDraft) {
    if (!currentDraft) return "Không có dữ liệu đơn hàng để lưu.";

    const movingToShipping = currentDraft.orderStatus === "shipping";
    const movingToCompleted = currentDraft.orderStatus === "completed";
    const hasShippingMeta = Boolean(
      String(currentDraft.shippingProvider || "").trim() || String(currentDraft.trackingCode || "").trim()
    );

    if ((movingToShipping || movingToCompleted) && !hasShippingMeta) {
      return "Cần có đơn vị giao hàng hoặc mã vận đơn trước khi chuyển sang giao hàng hoặc hoàn thành.";
    }

    return "";
  }

  async function appendEvent(payload, localEvent) {
    if (!db || !orderId) return;
    await addDoc(collection(db, "orders", orderId, "events"), payload);
    setEvents((current) => [localEvent, ...current]);
  }

  async function saveOrderMeta() {
    if (!db || !order || !draft) return;

    const validationMessage = validateOrderDraft(draft);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        paymentMethod: draft.paymentMethod || "cod",
        paymentStatus: draft.paymentStatus || "pending",
        orderStatus: draft.orderStatus || "pending",
        shippingProvider: draft.shippingProvider || "",
        trackingCode: draft.trackingCode || "",
        notes: draft.notes || "",
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "orders", order.id), payload);

      const nowIso = new Date().toISOString();
      patchOrder({
        ...payload,
        updatedAt: nowIso,
      });

      await appendEvent(
        {
          type: "admin_updated",
          message: "Admin cập nhật thông tin xử lý đơn hàng",
          actorRole: "admin",
          createdAt: serverTimestamp(),
        },
        {
          id: `local-${Date.now()}`,
          type: "admin_updated",
          message: "Admin cập nhật thông tin xử lý đơn hàng",
          actorRole: "admin",
          createdAt: nowIso,
        }
      );

      setMessage("Đã lưu thay đổi đơn hàng.");
    } catch (error) {
      console.error("Order update failed:", error);
      setMessage("Không thể lưu thay đổi đơn hàng.");
    } finally {
      setSaving(false);
    }
  }

  async function applyStatusUpdate(nextOrderStatus, options = {}) {
    if (!db || !order || !draft) return;

    if (
      (nextOrderStatus === "shipping" || nextOrderStatus === "completed")
      && !String(draft.shippingProvider || "").trim()
      && !String(draft.trackingCode || "").trim()
    ) {
      setMessage("Hãy nhập đơn vị giao hàng hoặc mã vận đơn trước khi cập nhật trạng thái này.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        orderStatus: nextOrderStatus,
        paymentStatus: options.paymentStatus || draft.paymentStatus || order.paymentStatus || "pending",
        paymentMethod: draft.paymentMethod || order.paymentMethod || "cod",
        shippingProvider: draft.shippingProvider || "",
        trackingCode: draft.trackingCode || "",
        notes: draft.notes || "",
        updatedAt: serverTimestamp(),
      };

      if (nextOrderStatus === "paid" || payload.paymentStatus === "paid") {
        payload.paidAt = serverTimestamp();
      }
      if (nextOrderStatus === "shipping") payload.shippingStartedAt = serverTimestamp();
      if (nextOrderStatus === "completed") payload.completedAt = serverTimestamp();
      if (nextOrderStatus === "cancelled") payload.cancelledAt = serverTimestamp();
      if (nextOrderStatus === "failed" || payload.paymentStatus === "failed") {
        payload.failedAt = serverTimestamp();
      }

      await updateDoc(doc(db, "orders", order.id), payload);

      const nowIso = new Date().toISOString();
      patchOrder({
        ...payload,
        updatedAt: nowIso,
        paidAt: payload.paidAt ? nowIso : order.paidAt,
        shippingStartedAt: payload.shippingStartedAt ? nowIso : order.shippingStartedAt,
        completedAt: payload.completedAt ? nowIso : order.completedAt,
        cancelledAt: payload.cancelledAt ? nowIso : order.cancelledAt,
        failedAt: payload.failedAt ? nowIso : order.failedAt,
      });

      setDraft((current) => ({
        ...(current || {}),
        orderStatus: nextOrderStatus,
        paymentStatus: payload.paymentStatus,
      }));

      const nextLabel = ORDER_STATUS_LABEL[nextOrderStatus] || nextOrderStatus;
      const eventMessage = options.message || `Admin đổi trạng thái sang ${nextLabel}`;

      await appendEvent(
        {
          type: "status_changed",
          from: order.orderStatus || "pending",
          to: nextOrderStatus,
          message: eventMessage,
          actorRole: "admin",
          createdAt: serverTimestamp(),
        },
        {
          id: `local-${Date.now()}`,
          type: "status_changed",
          from: order.orderStatus || "pending",
          to: nextOrderStatus,
          message: eventMessage,
          actorRole: "admin",
          createdAt: nowIso,
        }
      );

      setMessage("Đã cập nhật trạng thái đơn hàng.");
    } catch (error) {
      console.error("Order status update failed:", error);
      setMessage(error.message || "Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout resource="orders">
      <header className="admin-heading">
        <span>Module 2</span>
        <h1>Chi tiết đơn hàng</h1>
        <p>Xem thông tin đơn theo kiểu dễ đọc cho người vận hành và cập nhật tiến trình xử lý ngay trên trang detail.</p>
      </header>

      <div className="admin-toolbar" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <a
          href="/admin/orders"
          className="admin-btn-secondary"
          style={{ textDecoration: "none" }}
        >
          ← Quay lại danh sách
        </a>
        {order ? (
          <button type="button" className="admin-btn-primary" onClick={saveOrderMeta} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        ) : null}
      </div>

      <section className="admin-editor">
        {loadingOrder ? <EmptyState message="Đang tải chi tiết đơn hàng..." /> : null}
        {!loadingOrder && !order ? <EmptyState message="Không tìm thấy đơn hàng này." /> : null}
        {order ? (
          <div style={{ display: "grid", gap: "20px" }}>
            <div className="admin-editor-head">
              <div>
                <h2>{order.orderCode || order.id}</h2>
                <p>{customerDisplayName}</p>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <StatusBadge status={order.orderStatus} />
                <StatusBadge status={order.paymentStatus} kind="payment" />
              </div>
            </div>

            {message ? <p className="admin-editor-message">{message}</p> : null}

            <div className="admin-user-stats">
              <div className="admin-user-stat-card">
                <span>Thanh toán</span>
                <strong style={{ fontSize: "16px" }}>{PAYMENT_METHOD_LABEL[order.paymentMethod] || (order.paymentMethod || "cod").toUpperCase()}</strong>
                <small>{PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus}</small>
              </div>
              <div className="admin-user-stat-card">
                <span>Sản phẩm</span>
                <strong>{order.items.length}</strong>
                <small>món trong đơn</small>
              </div>
              <div className="admin-user-stat-card">
                <span>Tổng tiền</span>
                <strong>{formatVnd(order.total)}</strong>
                <small>khách cần thanh toán</small>
              </div>
              <div className="admin-user-stat-card">
                <span>Ngày tạo</span>
                <strong style={{ fontSize: "18px" }}>{formatDate(order.createdAt)}</strong>
                <small>thời điểm tạo đơn</small>
              </div>
            </div>

            <div className="admin-user-section-grid">
              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>Khách hàng</h3>
                  {order.userId ? <span>{order.userId}</span> : null}
                </div>
                <div className="admin-user-profile-grid">
                  <div><strong>Tên</strong><span>{order.customer?.name || "Chưa có"}</span></div>
                  <div><strong>Email</strong><span>{order.customer?.email || "Chưa có"}</span></div>
                  <div><strong>Số điện thoại</strong><span>{order.customer?.phone || "Chưa có"}</span></div>
                  <div>
                    <strong>Tài khoản</strong>
                    <span>
                      {order.userId ? (
                        <a href={`/admin/users?uid=${order.userId}`} className="admin-user-link">
                          Mở user
                        </a>
                      ) : (
                        "Khách lẻ"
                      )}
                    </span>
                  </div>
                </div>
              </section>

              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>Giao hàng</h3>
                  <span>{order.shippingProvider || "Chưa chọn đơn vị"}</span>
                </div>
                <div className="admin-user-profile-grid">
                  <div><strong>Địa chỉ</strong><span>{order.shippingAddress?.addressLine || "Chưa có"}</span></div>
                  <div><strong>Tỉnh / TP</strong><span>{order.shippingAddress?.province || "Chưa có"}</span></div>
                  <div><strong>Quận / Huyện</strong><span>{order.shippingAddress?.district || "Chưa có"}</span></div>
                  <div><strong>Phường / Xã</strong><span>{order.shippingAddress?.ward || "Chưa có"}</span></div>
                </div>
              </section>
            </div>

            <section className="admin-user-section">
              <div className="admin-user-section-head">
                <h3>Sản phẩm trong đơn</h3>
                <span>{order.items.length} sản phẩm</span>
              </div>
              {order.items.length === 0 ? (
                <EmptyState message="Đơn hàng này chưa có sản phẩm nào." />
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {order.items.map((item, index) => (
                    <article
                      key={`${item.productId || item.slug || item.name || "item"}-${index}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "56px 1fr auto",
                        gap: "12px",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: "1px solid #edf1ef",
                      }}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name || "Sản phẩm"}
                          style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "10px" }}
                        />
                      ) : (
                        <div className="admin-table-item-thumb-placeholder" style={{ width: "56px", height: "56px" }}>
                          SP
                        </div>
                      )}
                      <div style={{ display: "grid", gap: "3px" }}>
                        <strong style={{ fontSize: "14px", color: "#0f172a" }}>{item.name || item.slug || "Sản phẩm"}</strong>
                        <span style={{ color: "#64748b", fontSize: "12px" }}>
                          SL: {Number(item.quantity || 1)} × {formatVnd(item.price || 0)}
                        </span>
                      </div>
                      <strong style={{ color: "#0f172a", fontSize: "14px" }}>
                        {formatVnd(Number(item.price || 0) * Number(item.quantity || 1))}
                      </strong>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <div className="admin-user-section-grid">
              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>Cập nhật xử lý đơn</h3>
                </div>
                <div className="admin-user-form-grid">
                  <label>
                    Trạng thái đơn
                    <select value={draft?.orderStatus || "pending"} onChange={(event) => setDraftField("orderStatus", event.target.value)}>
                      {ORDER_STATUS_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {ORDER_STATUS_LABEL[item]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Trạng thái thanh toán
                    <select value={draft?.paymentStatus || "pending"} onChange={(event) => setDraftField("paymentStatus", event.target.value)}>
                      {PAYMENT_STATUS_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {PAYMENT_STATUS_LABEL[item]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Phương thức thanh toán
                    <select value={draft?.paymentMethod || "cod"} onChange={(event) => setDraftField("paymentMethod", event.target.value)}>
                      {PAYMENT_METHOD_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {PAYMENT_METHOD_LABEL[item] || item.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Đơn vị giao hàng
                    <input
                      value={draft?.shippingProvider || ""}
                      onChange={(event) => setDraftField("shippingProvider", event.target.value)}
                      placeholder="GHN / GHTK / shipper..."
                    />
                  </label>
                  <label style={{ gridColumn: "1 / -1" }}>
                    Mã vận đơn
                    <input
                      value={draft?.trackingCode || ""}
                      onChange={(event) => setDraftField("trackingCode", event.target.value)}
                      placeholder="Nhập mã vận đơn"
                    />
                  </label>
                  <label style={{ gridColumn: "1 / -1" }}>
                    Ghi chú nội bộ
                    <textarea
                      value={draft?.notes || ""}
                      onChange={(event) => setDraftField("notes", event.target.value)}
                      placeholder="Ghi chú xử lý đơn hàng..."
                    />
                  </label>
                </div>

                <div className="admin-form-actions" style={{ marginTop: "20px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    onClick={() => applyStatusUpdate("paid", { paymentStatus: "paid", message: "Admin xác nhận đã thanh toán" })}
                    disabled={saving}
                  >
                    ✓ Đã thanh toán
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => applyStatusUpdate("shipping", { message: "Admin chuyển đơn sang giao hàng" })}
                    disabled={saving}
                  >
                    → Đang giao hàng
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => applyStatusUpdate("completed", { message: "Admin hoàn tất đơn hàng" })}
                    disabled={saving}
                  >
                    ✓ Hoàn thành
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{ borderColor: "rgba(239,68,68,0.4)", color: "#b91c1c" }}
                    onClick={() => applyStatusUpdate("failed", { paymentStatus: "failed", message: "Admin đánh dấu thanh toán thất bại" })}
                    disabled={saving}
                  >
                    ✕ Thanh toán thất bại
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{ borderColor: "rgba(239,68,68,0.4)", color: "#b91c1c" }}
                    onClick={() => applyStatusUpdate("cancelled", { message: "Admin hủy đơn hàng" })}
                    disabled={saving}
                  >
                    ✕ Hủy đơn
                  </button>
                </div>
              </section>

              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>Tổng hợp thanh toán</h3>
                  <span>{PAYMENT_METHOD_LABEL[order.paymentMethod] || (order.paymentMethod || "cod").toUpperCase()}</span>
                </div>
                <div className="admin-user-profile-grid">
                  <div><strong>Tạm tính</strong><span>{formatVnd(order.subtotal)}</span></div>
                  <div><strong>Phí ship</strong><span>{formatVnd(order.shippingFee)}</span></div>
                  <div><strong>Giảm giá</strong><span>{formatVnd(order.discount)}</span></div>
                  <div><strong>Tổng tiền</strong><span>{formatVnd(order.total)}</span></div>
                  <div><strong>Đã thanh toán lúc</strong><span>{formatDate(order.paidAt)}</span></div>
                  <div><strong>Bắt đầu giao</strong><span>{formatDate(order.shippingStartedAt)}</span></div>
                  <div><strong>Hoàn thành lúc</strong><span>{formatDate(order.completedAt)}</span></div>
                  <div><strong>Hủy lúc</strong><span>{formatDate(order.cancelledAt)}</span></div>
                </div>

                {order.paymentMethod === "sepay" ? (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px",
                      borderRadius: "12px",
                      background: "#f8fafc",
                      border: "1px solid #dbe4ec",
                      display: "grid",
                      gap: "8px",
                    }}
                  >
                    <strong>SePay</strong>
                    <span>Invoice: {order.sepay?.orderInvoiceNumber || order.orderCode || "Chưa có"}</span>
                    <span>Checkout status: {order.sepay?.checkoutStatus || "pending"}</span>
                    <span>Paid amount: {formatVnd(order.sepay?.paidAmount || 0)}</span>
                    <span>Paid at: {formatDate(order.sepay?.paidAt)}</span>
                  </div>
                ) : null}
              </section>
            </div>

            <section className="admin-user-section">
              <div className="admin-user-section-head">
                <h3>Timeline</h3>
                <span>{events.length} event</span>
              </div>
              {loadingEvents ? <EmptyState message="Đang tải timeline..." /> : null}
              {!loadingEvents && events.length === 0 ? <EmptyState message="Đơn hàng này chưa có timeline xử lý." /> : null}
              {!loadingEvents && events.length > 0 ? (
                <div style={{ display: "grid", gap: "12px" }}>
                  {events.map((item) => (
                    <article
                      key={item.id}
                      style={{
                        paddingBottom: "12px",
                        borderBottom: "1px solid #edf1ef",
                        display: "grid",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                        <strong>{item.type || "event"}</strong>
                        <small style={{ color: "#64748b" }}>{formatDate(item.createdAt)}</small>
                      </div>
                      <span style={{ color: "#334155" }}>{item.message || "Không có mô tả"}</span>
                      {item.from || item.to ? (
                        <small style={{ color: "#64748b" }}>
                          {`${item.from || "?"} -> ${item.to || "?"}`}
                        </small>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </section>
    </AdminLayout>
  );
}
