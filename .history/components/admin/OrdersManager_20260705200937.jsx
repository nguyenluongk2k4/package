"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import AdminLayout from "./AdminLayout";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";

const ORDER_STATUS_OPTIONS = ["pending", "paid", "shipping", "completed", "cancelled", "failed"];
const PAYMENT_STATUS_OPTIONS = ["pending", "paid", "failed", "refunded"];
const PAYMENT_METHOD_OPTIONS = ["cod", "sepay"];

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

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function normalizeOrder(item) {
  const customer = item.customer || {};
  const shippingAddress = item.shippingAddress || {};
  const items = Array.isArray(item.items) ? item.items : [];
  const subtotal = Number(item.subtotal ?? items.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.quantity || 0), 0));
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

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        ...palette,
      }}
    >
      {status || "pending"}
    </span>
  );
}

export default function OrdersManager() {
  const { db, isAdmin } = useFirebaseAuth();
  const [requestedOrderId, setRequestedOrderId] = useState("");
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setRequestedOrderId(params.get("order") || "");
  }, []);

  useEffect(() => {
    if (!db || !isAdmin) return;

    let mounted = true;

    async function loadOrders() {
      setLoadingOrders(true);
      setMessage("");
      try {
        let snapshot;
        try {
          snapshot = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
        } catch {
          snapshot = await getDocs(collection(db, "orders"));
        }

        const rows = snapshot.docs
          .map((orderDoc) => normalizeOrder({ id: orderDoc.id, ...orderDoc.data() }))
          .sort((a, b) => {
            const aDate = toDateValue(a.updatedAt || a.createdAt);
            const bDate = toDateValue(b.updatedAt || b.createdAt);
            return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
          });

        if (!mounted) return;
        setOrders(rows);
        const requestedOrder = requestedOrderId
          ? rows.find((item) => item.id === requestedOrderId || item.orderCode === requestedOrderId)
          : null;

        if (requestedOrder?.id) {
          setSelectedOrderId(requestedOrder.id);
        } else if (!selectedOrderId && rows[0]?.id) {
          setSelectedOrderId(rows[0].id);
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Order list load failed:", error);
        setOrders([]);
        setSelectedOrderId("");
        setMessage("Khong the tai danh sach don hang. Kiem tra quyen Firestore admin cho collection orders.");
      } finally {
        if (mounted) setLoadingOrders(false);
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, [db, isAdmin, requestedOrderId]);

  const selectedOrder = useMemo(() => {
    return orders.find((item) => item.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  useEffect(() => {
    if (!selectedOrder) {
      setDraft(null);
      return;
    }

    setDraft({
      orderStatus: selectedOrder.orderStatus || "pending",
      paymentStatus: selectedOrder.paymentStatus || "pending",
      paymentMethod: selectedOrder.paymentMethod || "cod",
      shippingProvider: selectedOrder.shippingProvider || "",
      trackingCode: selectedOrder.trackingCode || "",
      notes: selectedOrder.notes || "",
    });
  }, [selectedOrder]);

  useEffect(() => {
    if (!db || !isAdmin || !selectedOrderId) {
      setEvents([]);
      return;
    }

    let mounted = true;

    async function loadEvents() {
      setLoadingEvents(true);
      try {
        let snapshot;
        try {
          snapshot = await getDocs(query(collection(db, "orders", selectedOrderId, "events"), orderBy("createdAt", "desc")));
        } catch {
          snapshot = await getDocs(collection(db, "orders", selectedOrderId, "events"));
        }

        const rows = snapshot.docs
          .map((eventDoc) => ({ id: eventDoc.id, ...eventDoc.data() }))
          .sort((a, b) => (toDateValue(b.createdAt)?.getTime() || 0) - (toDateValue(a.createdAt)?.getTime() || 0));

        if (!mounted) return;
        setEvents(rows);
      } catch (error) {
        if (!mounted) return;
        console.error("Order events load failed:", error);
        setEvents([]);
        setMessage("Khong the tai timeline don hang nay. Co the subcollection events chua duoc cap quyen doc.");
      } finally {
        if (mounted) setLoadingEvents(false);
      }
    }

    loadEvents();

    return () => {
      mounted = false;
    };
  }, [db, isAdmin, selectedOrderId]);

  const filteredOrders = useMemo(() => {
    return orders.filter((item) => {
      const haystack = [
        item.id,
        item.orderCode,
        item.userId,
        item.customer?.name,
        item.customer?.email,
        item.customer?.phone,
        item.shippingProvider,
        item.trackingCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.orderStatus === statusFilter;
      const matchesMethod = paymentMethodFilter === "all" || item.paymentMethod === paymentMethodFilter;
      const matchesPayment = paymentStatusFilter === "all" || item.paymentStatus === paymentStatusFilter;
      return matchesSearch && matchesStatus && matchesMethod && matchesPayment;
    });
  }, [orders, paymentMethodFilter, paymentStatusFilter, search, statusFilter]);

  const stats = useMemo(() => {
    const paidOrders = orders.filter((item) => item.paymentStatus === "paid");
    const totalRevenue = orders.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const paidRevenue = paidOrders.reduce((sum, item) => sum + Number(item.total || 0), 0);

    return {
      total: orders.length,
      pending: orders.filter((item) => item.orderStatus === "pending").length,
      paid: orders.filter((item) => item.paymentStatus === "paid").length,
      shipping: orders.filter((item) => item.orderStatus === "shipping").length,
      completed: orders.filter((item) => item.orderStatus === "completed").length,
      pendingSePay: orders.filter((item) => item.paymentMethod === "sepay" && item.paymentStatus === "pending").length,
      codQueue: orders.filter((item) => item.paymentMethod === "cod" && item.orderStatus === "pending").length,
      totalRevenue,
      paidRevenue,
      averageOrderValue: orders.length ? Math.round(totalRevenue / orders.length) : 0,
    };
  }, [orders]);

  function patchOrder(orderId, partial) {
    setOrders((current) => current.map((item) => (item.id === orderId ? normalizeOrder({ ...item, ...partial }) : item)));
  }

  function setDraftField(name, value) {
    setDraft((current) => ({ ...(current || {}), [name]: value }));
  }

  function exportOrdersCsv() {
    const rows = filteredOrders.map((item) => [
      item.id,
      item.orderCode || item.id,
      item.userId || "",
      item.customer?.name || "",
      item.customer?.email || "",
      item.customer?.phone || "",
      item.paymentMethod || "cod",
      item.paymentStatus || "pending",
      item.orderStatus || "pending",
      item.shippingProvider || "",
      item.trackingCode || "",
      item.total || 0,
      formatDate(item.createdAt),
      formatDate(item.updatedAt || item.createdAt),
    ]);

    const csv = [
      ["id", "orderCode", "userId", "customerName", "customerEmail", "customerPhone", "paymentMethod", "paymentStatus", "orderStatus", "shippingProvider", "trackingCode", "total", "createdAt", "updatedAt"],
      ...rows,
    ]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `orders-${Date.now()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setMessage(`Da export ${filteredOrders.length} don hang.`);
  }

  function validateOrderDraft(currentDraft) {
    if (!currentDraft) return "Khong co du lieu don hang de luu.";

    const movingToShipping = currentDraft.orderStatus === "shipping";
    const movingToCompleted = currentDraft.orderStatus === "completed";
    const hasShippingMeta = Boolean(String(currentDraft.shippingProvider || "").trim() || String(currentDraft.trackingCode || "").trim());

    if ((movingToShipping || movingToCompleted) && !hasShippingMeta) {
      return "Can co shipping provider hoac tracking code truoc khi chuyen sang shipping/completed.";
    }

    return "";
  }

  async function appendEvent(orderId, payload, localEvent) {
    if (!db || !orderId) return;
    await addDoc(collection(db, "orders", orderId, "events"), payload);
    setEvents((current) => [localEvent, ...current]);
  }

  async function saveOrderMeta() {
    if (!db || !selectedOrder || !draft) return;
    const validationMessage = validateOrderDraft(draft);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const nowIso = new Date().toISOString();
      const payload = {
        paymentMethod: draft.paymentMethod || "cod",
        paymentStatus: draft.paymentStatus || "pending",
        orderStatus: draft.orderStatus || "pending",
        shippingProvider: draft.shippingProvider || "",
        trackingCode: draft.trackingCode || "",
        notes: draft.notes || "",
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "orders", selectedOrder.id), payload);
      patchOrder(selectedOrder.id, { ...payload, updatedAt: nowIso });
      setMessage("Da luu metadata don hang.");

      await appendEvent(
        selectedOrder.id,
        {
          type: "admin_updated",
          message: "Admin cap nhat thong tin don hang",
          actorRole: "admin",
          createdAt: serverTimestamp(),
        },
        {
          id: `local-${Date.now()}`,
          type: "admin_updated",
          message: "Admin cap nhat thong tin don hang",
          actorRole: "admin",
          createdAt: nowIso,
        }
      );
    } catch (error) {
      setMessage(error.message || "Khong the luu thong tin don hang.");
    } finally {
      setSaving(false);
    }
  }

  async function applyStatusUpdate(nextOrderStatus, options = {}) {
    if (!db || !selectedOrder || !draft) return;
    const nextLabel =
      nextOrderStatus === "cancelled"
        ? "huy"
        : nextOrderStatus === "failed"
          ? "danh dau that bai"
          : `doi sang ${nextOrderStatus}`;

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Xac nhan ${nextLabel} cho don ${selectedOrder.orderCode || selectedOrder.id}?`);
      if (!confirmed) {
        return;
      }
    }

    if ((nextOrderStatus === "shipping" || nextOrderStatus === "completed")
      && !String(draft.shippingProvider || "").trim()
      && !String(draft.trackingCode || "").trim()) {
      setMessage("Can nhap shipping provider hoac tracking code truoc khi chuyen trang thai giao hang.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const nowIso = new Date().toISOString();
      const payload = {
        orderStatus: nextOrderStatus,
        paymentStatus: options.paymentStatus || draft.paymentStatus || selectedOrder.paymentStatus || "pending",
        updatedAt: serverTimestamp(),
      };

      if (nextOrderStatus === "paid" || payload.paymentStatus === "paid") {
        payload.paidAt = serverTimestamp();
      }
      if (nextOrderStatus === "completed") {
        payload.completedAt = serverTimestamp();
      }
      if (nextOrderStatus === "shipping") {
        payload.shippingStartedAt = serverTimestamp();
      }
      if (nextOrderStatus === "cancelled") {
        payload.cancelledAt = serverTimestamp();
      }
      if (nextOrderStatus === "failed" || payload.paymentStatus === "failed") {
        payload.failedAt = serverTimestamp();
      }

      await updateDoc(doc(db, "orders", selectedOrder.id), payload);

      const localPatch = {
        orderStatus: nextOrderStatus,
        paymentStatus: payload.paymentStatus,
        updatedAt: nowIso,
      };
      if (payload.paidAt) localPatch.paidAt = nowIso;
      if (payload.completedAt) localPatch.completedAt = nowIso;
      if (payload.shippingStartedAt) localPatch.shippingStartedAt = nowIso;
      if (payload.cancelledAt) localPatch.cancelledAt = nowIso;
      if (payload.failedAt) localPatch.failedAt = nowIso;

      patchOrder(selectedOrder.id, localPatch);
      setDraft((current) => ({
        ...(current || {}),
        orderStatus: nextOrderStatus,
        paymentStatus: payload.paymentStatus,
      }));

      await appendEvent(
        selectedOrder.id,
        {
          type: "status_changed",
          from: selectedOrder.orderStatus || "pending",
          to: nextOrderStatus,
          message: options.message || `Admin doi trang thai sang ${nextOrderStatus}`,
          actorRole: "admin",
          createdAt: serverTimestamp(),
        },
        {
          id: `local-${Date.now()}`,
          type: "status_changed",
          from: selectedOrder.orderStatus || "pending",
          to: nextOrderStatus,
          message: options.message || `Admin doi trang thai sang ${nextOrderStatus}`,
          actorRole: "admin",
          createdAt: nowIso,
        }
      );

      setMessage(`Da cap nhat don hang sang ${nextOrderStatus}.`);
    } catch (error) {
      setMessage(error.message || "Khong the cap nhat trang thai don hang.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout resource="orders">
      <header className="admin-heading">
        <span>Module 2</span>
        <h1>Quan ly don hang</h1>
      </header>

      <div className="admin-toolbar" style={{ flexWrap: "wrap" }}>
        <div className="admin-search-wrapper">
          <img src="/assets/ic-search.svg" className="admin-search-icon" alt="" />
          <input placeholder="Tim theo ma don, ten khach, email, phone..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tat ca order status</option>
          {ORDER_STATUS_OPTIONS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select value={paymentMethodFilter} onChange={(event) => setPaymentMethodFilter(event.target.value)}>
          <option value="all">Tat ca payment method</option>
          {PAYMENT_METHOD_OPTIONS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select value={paymentStatusFilter} onChange={(event) => setPaymentStatusFilter(event.target.value)}>
          <option value="all">Tat ca payment status</option>
          {PAYMENT_STATUS_OPTIONS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <button type="button" className="admin-secondary-button" onClick={exportOrdersCsv} disabled={filteredOrders.length === 0}>
          Export CSV
        </button>
        <button type="button" onClick={saveOrderMeta} disabled={!selectedOrder || !draft || saving}>
          {saving ? "Dang luu..." : "Luu order"}
        </button>
      </div>

      <div className="admin-user-stats" style={{ marginBottom: "24px" }}>
        <div className="admin-user-stat-card">
          <span>Total orders</span>
          <strong>{stats.total}</strong>
          <small>Tat ca don hang</small>
        </div>
        <div className="admin-user-stat-card">
          <span>Pending</span>
          <strong>{stats.pending}</strong>
          <small>Dang cho xu ly</small>
        </div>
        <div className="admin-user-stat-card">
          <span>Paid</span>
          <strong>{stats.paid}</strong>
          <small>Da thanh toan</small>
        </div>
        <div className="admin-user-stat-card">
          <span>Shipping</span>
          <strong>{stats.shipping}</strong>
          <small>Dang giao hang</small>
        </div>
        <div className="admin-user-stat-card">
          <span>Completed</span>
          <strong>{stats.completed}</strong>
          <small>Da hoan thanh</small>
        </div>
        <div className="admin-user-stat-card">
          <span>SePay pending</span>
          <strong>{stats.pendingSePay}</strong>
          <small>Can doi soat thanh toan</small>
        </div>
        <div className="admin-user-stat-card">
          <span>COD queue</span>
          <strong>{stats.codQueue}</strong>
          <small>Cho xu ly giao hang</small>
        </div>
        <div className="admin-user-stat-card">
          <span>Paid revenue</span>
          <strong>{formatVnd(stats.paidRevenue)}</strong>
          <small>Don da thanh toan</small>
        </div>
        <div className="admin-user-stat-card">
          <span>AOV</span>
          <strong>{formatVnd(stats.averageOrderValue)}</strong>
          <small>Gia tri don trung binh</small>
        </div>
      </div>

      <div className="admin-manager-grid">
        <div className="admin-table">
          {loadingOrders ? <EmptyState message="Dang tai danh sach don hang..." /> : null}
          {!loadingOrders && filteredOrders.length === 0 ? <EmptyState message="Chua co order nao hoac khong tim thay ket qua phu hop." /> : null}
          {filteredOrders.map((item) => (
            <article className={`admin-table-item-card ${selectedOrderId === item.id ? "active" : ""}`} key={item.id}>
              <div className="admin-table-item-thumb-placeholder">DH</div>
              <div className="admin-table-item-info">
                <button type="button" onClick={() => setSelectedOrderId(item.id)}>
                  <strong>{item.orderCode || item.id}</strong>
                  <span>{item.customer?.name || item.customer?.email || item.userId || "Khach le"}</span>
                </button>
                <small>
                  {item.paymentMethod?.toUpperCase() || "COD"} · {formatVnd(item.total)} · {formatDate(item.createdAt)}
                </small>
              </div>
            </article>
          ))}
        </div>

        <section className="admin-editor">
          {!selectedOrder ? (
            loadingOrders ? <EmptyState message="Dang tai chi tiet order..." /> : <EmptyState message="Chon mot order de xem chi tiet va xu ly." />
          ) : (
            <div style={{ display: "grid", gap: "20px" }}>
              <div className="admin-editor-head">
                <div>
                  <h2>{selectedOrder.orderCode || selectedOrder.id}</h2>
                  <p>{selectedOrder.customer?.name || selectedOrder.customer?.email || selectedOrder.userId || "Khach hang"}</p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <StatusBadge status={selectedOrder.orderStatus} />
                  <StatusBadge status={selectedOrder.paymentStatus} kind="payment" />
                </div>
              </div>

              {message ? <p className="admin-editor-message">{message}</p> : null}

              <div className="admin-user-stats">
                <div className="admin-user-stat-card">
                  <span>Payment</span>
                  <strong>{selectedOrder.paymentMethod?.toUpperCase() || "COD"}</strong>
                  <small>{selectedOrder.paymentStatus || "pending"}</small>
                </div>
                <div className="admin-user-stat-card">
                  <span>Items</span>
                  <strong>{selectedOrder.items.length}</strong>
                  <small>San pham trong don</small>
                </div>
                <div className="admin-user-stat-card">
                  <span>Total</span>
                  <strong>{formatVnd(selectedOrder.total)}</strong>
                  <small>Tong thanh toan</small>
                </div>
                <div className="admin-user-stat-card">
                  <span>Created</span>
                  <strong style={{ fontSize: "18px" }}>{formatDate(selectedOrder.createdAt)}</strong>
                  <small>Ngay tao don</small>
                </div>
              </div>

              <div className="admin-user-section-grid">
                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3>Khach hang</h3>
                    <span>{selectedOrder.userId || "Guest order"}</span>
                  </div>
                  <div className="admin-user-profile-grid">
                    <div><strong>Ten</strong><span>{selectedOrder.customer?.name || "Chua co"}</span></div>
                    <div><strong>Email</strong><span>{selectedOrder.customer?.email || "Chua co"}</span></div>
                    <div><strong>Phone</strong><span>{selectedOrder.customer?.phone || "Chua co"}</span></div>
                    <div><strong>Payment method</strong><span>{selectedOrder.paymentMethod || "cod"}</span></div>
                  </div>
                </section>

                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3>Giao hang</h3>
                    <span>{selectedOrder.shippingProvider || "Chua chon don vi"}</span>
                  </div>
                  <div className="admin-user-profile-grid">
                    <div><strong>Dia chi</strong><span>{selectedOrder.shippingAddress?.addressLine || "Chua co"}</span></div>
                    <div><strong>Ward</strong><span>{selectedOrder.shippingAddress?.ward || "Chua co"}</span></div>
                    <div><strong>District</strong><span>{selectedOrder.shippingAddress?.district || "Chua co"}</span></div>
                    <div><strong>Province</strong><span>{selectedOrder.shippingAddress?.province || "Chua co"}</span></div>
                  </div>
                </section>
              </div>

              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>San pham trong don</h3>
                  <span>{selectedOrder.items.length} item</span>
                </div>
                {selectedOrder.items.length === 0 ? (
                  <EmptyState message="Order nay chua co item nao trong field items." />
                ) : (
                  <div style={{ display: "grid", gap: "12px" }}>
                    {selectedOrder.items.map((item, index) => (
                      <article
                        key={`${item.productId || item.slug || item.name || "item"}-${index}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "64px 1fr auto",
                          gap: "12px",
                          alignItems: "center",
                          padding: "12px 0",
                          borderBottom: "1px solid #edf1ef",
                        }}
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.name || "Item"} style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "10px" }} />
                        ) : (
                          <div className="admin-table-item-thumb-placeholder" style={{ width: "64px", height: "64px" }}>SP</div>
                        )}
                        <div style={{ display: "grid", gap: "4px" }}>
                          <strong>{item.name || item.slug || item.productId || "San pham"}</strong>
                          <span style={{ color: "#64748b", fontSize: "13px" }}>
                            {item.slug || item.productId || "Chua co slug"} · SL {Number(item.quantity || 1)}
                          </span>
                        </div>
                        <strong>{formatVnd(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <div className="admin-user-section-grid">
                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3>Thanh toan va shipping</h3>
                  </div>
                  <div className="admin-user-form-grid">
                    <label>
                      Order status
                      <select value={draft?.orderStatus || "pending"} onChange={(event) => setDraftField("orderStatus", event.target.value)}>
                        {ORDER_STATUS_OPTIONS.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Payment status
                      <select value={draft?.paymentStatus || "pending"} onChange={(event) => setDraftField("paymentStatus", event.target.value)}>
                        {PAYMENT_STATUS_OPTIONS.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Payment method
                      <select value={draft?.paymentMethod || "cod"} onChange={(event) => setDraftField("paymentMethod", event.target.value)}>
                        {PAYMENT_METHOD_OPTIONS.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Shipping provider
                      <input value={draft?.shippingProvider || ""} onChange={(event) => setDraftField("shippingProvider", event.target.value)} placeholder="GHTK / GHN / shipper..." />
                    </label>
                    <label style={{ gridColumn: "1 / -1" }}>
                      Tracking code
                      <input value={draft?.trackingCode || ""} onChange={(event) => setDraftField("trackingCode", event.target.value)} placeholder="Ma van don" />
                    </label>
                    <label style={{ gridColumn: "1 / -1" }}>
                      Notes
                      <textarea value={draft?.notes || ""} onChange={(event) => setDraftField("notes", event.target.value)} placeholder="Ghi chu noi bo cho don hang..." />
                    </label>
                  </div>

                  <div className="admin-form-actions" style={{ marginTop: "16px" }}>
                    <button type="button" onClick={() => applyStatusUpdate("paid", { paymentStatus: "paid", message: "Admin xac nhan da thanh toan" })} disabled={saving}>
                      Mark paid
                    </button>
                    <button type="button" className="admin-secondary-button" onClick={() => applyStatusUpdate("shipping", { message: "Admin chuyen don sang giao hang" })} disabled={saving}>
                      Mark shipping
                    </button>
                    <button type="button" className="admin-secondary-button" onClick={() => applyStatusUpdate("completed", { message: "Admin hoan tat don hang" })} disabled={saving}>
                      Mark completed
                    </button>
                    <button type="button" className="admin-secondary-button" onClick={() => applyStatusUpdate("failed", { paymentStatus: "failed", message: "Admin danh dau thanh toan that bai" })} disabled={saving}>
                      Mark failed
                    </button>
                    <button type="button" className="admin-secondary-button" onClick={() => applyStatusUpdate("cancelled", { message: "Admin huy don hang" })} disabled={saving}>
                      Cancel order
                    </button>
                  </div>
                </section>

                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3>Price breakdown</h3>
                    <span>{selectedOrder.paymentMethod?.toUpperCase() || "COD"}</span>
                  </div>
                  <div className="admin-user-profile-grid">
                    <div><strong>Subtotal</strong><span>{formatVnd(selectedOrder.subtotal)}</span></div>
                    <div><strong>Shipping fee</strong><span>{formatVnd(selectedOrder.shippingFee)}</span></div>
                    <div><strong>Discount</strong><span>{formatVnd(selectedOrder.discount)}</span></div>
                    <div><strong>Total</strong><span>{formatVnd(selectedOrder.total)}</span></div>
                    <div><strong>Paid at</strong><span>{formatDate(selectedOrder.paidAt)}</span></div>
                    <div><strong>Shipping at</strong><span>{formatDate(selectedOrder.shippingStartedAt)}</span></div>
                    <div><strong>Completed at</strong><span>{formatDate(selectedOrder.completedAt)}</span></div>
                    <div><strong>Cancelled at</strong><span>{formatDate(selectedOrder.cancelledAt)}</span></div>
                  </div>

                  {selectedOrder.paymentMethod === "sepay" ? (
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
                      <strong>SePay info</strong>
                      <span>Invoice: {selectedOrder.sepay?.orderInvoiceNumber || selectedOrder.orderCode || "Chua co"}</span>
                      <span>Checkout status: {selectedOrder.sepay?.checkoutStatus || "pending"}</span>
                      <span>Transaction ID: {selectedOrder.sepay?.transactionId || "Chua co"}</span>
                      <span>Bank code: {selectedOrder.sepay?.bankCode || "Chua co"}</span>
                      <span>Transaction status: {selectedOrder.sepay?.transactionStatus || "Chua co"}</span>
                      <span>Last notification: {selectedOrder.sepay?.lastNotificationType || "Chua co"}</span>
                      <span>Paid amount: {formatVnd(selectedOrder.sepay?.paidAmount || 0)}</span>
                      <span>Paid at: {formatDate(selectedOrder.sepay?.paidAt)}</span>
                    </div>
                  ) : null}
                </section>
              </div>

              <div className="admin-user-section-grid">
                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3>Timeline</h3>
                    <span>{events.length} event</span>
                  </div>
                  {loadingEvents ? <EmptyState message="Dang tai event timeline..." /> : null}
                  {!loadingEvents && events.length === 0 ? <EmptyState message="Order nay chua co event nao. Sau khi admin cap nhat trang thai, timeline se hien o day." /> : null}
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
                          <span style={{ color: "#334155" }}>{item.message || "Khong co mo ta"}</span>
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

                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3>Raw JSON</h3>
                  </div>
                  <pre>{JSON.stringify({ order: selectedOrder, events }, null, 2)}</pre>
                </section>
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
