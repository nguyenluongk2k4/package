"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import AdminLayout from "./AdminLayout";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";

const ORDER_STATUS_OPTIONS = ["pending", "paid", "shipping", "completed", "cancelled", "failed"];
const PAYMENT_STATUS_OPTIONS = ["pending", "paid", "failed", "refunded"];
const PAYMENT_METHOD_OPTIONS = ["cod", "sepay"];

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

  const label = kind === "payment" ? (PAYMENT_STATUS_LABEL[status] || status) : (ORDER_STATUS_LABEL[status] || status);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        ...palette,
      }}
    >
      {label}
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

  // ---- Sorting state ----
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

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
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Order list load failed:", error);
        setOrders([]);
        setSelectedOrderId("");
        setMessage("Không thể tải danh sách đơn hàng. Kiểm tra quyền Firestore admin cho collection orders.");
      } finally {
        if (mounted) setLoadingOrders(false);
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, [db, isAdmin, requestedOrderId]);

  useEffect(() => {
    if (selectedOrderId) return;
    setDraft(null);
    setEvents([]);
    setLoadingEvents(false);
    setMessage("");
  }, [selectedOrderId]);

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
        setMessage("Không thể tải timeline đơn hàng này. Có thể subcollection events chưa được cấp quyền đọc.");
      } finally {
        if (mounted) setLoadingEvents(false);
      }
    }

    loadEvents();

    return () => {
      mounted = false;
    };
  }, [db, isAdmin, selectedOrderId]);

  // ---- Filter + Sort ----
  const filteredOrders = useMemo(() => {
    const filtered = orders.filter((item) => {
      const haystack = [
        item.orderCode,
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

    // Sort
    filtered.sort((a, b) => {
      let va, vb;
      if (sortField === "total") {
        va = Number(a.total || 0);
        vb = Number(b.total || 0);
      } else if (sortField === "createdAt") {
        va = toDateValue(a.createdAt)?.getTime() || 0;
        vb = toDateValue(b.createdAt)?.getTime() || 0;
      } else if (sortField === "customer") {
        va = (a.customer?.name || a.customer?.email || "").toLowerCase();
        vb = (b.customer?.name || b.customer?.email || "").toLowerCase();
      } else if (sortField === "orderStatus") {
        va = a.orderStatus || "";
        vb = b.orderStatus || "";
      } else if (sortField === "paymentStatus") {
        va = a.paymentStatus || "";
        vb = b.paymentStatus || "";
      } else if (sortField === "orderCode") {
        va = (a.orderCode || "").toLowerCase();
        vb = (b.orderCode || "").toLowerCase();
      } else {
        va = 0;
        vb = 0;
      }

      if (typeof va === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? va - vb : vb - va;
    });

    return filtered;
  }, [orders, paymentMethodFilter, paymentStatusFilter, search, statusFilter, sortField, sortDir]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }) {
    if (sortField !== field) {
      return <span style={{ opacity: 0.25, fontSize: "11px", marginLeft: "2px" }}>⇅</span>;
    }
    return <span style={{ fontSize: "11px", marginLeft: "2px", color: "#052c24" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

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

  function openOrderDetail(orderId) {
    setSelectedOrderId(orderId);
  }

  function closeOrderDetail() {
    setSelectedOrderId("");
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

    setMessage(`Đã export ${filteredOrders.length} đơn hàng.`);
  }

  function validateOrderDraft(currentDraft) {
    if (!currentDraft) return "Không có dữ liệu đơn hàng để lưu.";

    const movingToShipping = currentDraft.orderStatus === "shipping";
    const movingToCompleted = currentDraft.orderStatus === "completed";
    const hasShippingMeta = Boolean(String(currentDraft.shippingProvider || "").trim() || String(currentDraft.trackingCode || "").trim());

    if ((movingToShipping || movingToCompleted) && !hasShippingMeta) {
      return "Cần có shipping provider hoặc tracking code trước khi chuyển sang shipping/completed.";
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
      setMessage("Đã lưu metadata đơn hàng.");

      await appendEvent(
        selectedOrder.id,
        {
          type: "admin_updated",
          message: "Admin cập nhật thông tin đơn hàng",
          actorRole: "admin",
          createdAt: serverTimestamp(),
        },
        {
          id: `local-${Date.now()}`,
          type: "admin_updated",
          message: "Admin cập nhật thông tin đơn hàng",
          actorRole: "admin",
          createdAt: nowIso,
        }
      );
    } catch (error) {
      setMessage(error.message || "Không thể lưu thông tin đơn hàng.");
    } finally {
      setSaving(false);
    }
  }

  async function applyStatusUpdate(nextOrderStatus, options = {}) {
    if (!db || !selectedOrder || !draft) return;
    const nextLabel = ORDER_STATUS_LABEL[nextOrderStatus] || nextOrderStatus;

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Xác nhận chuyển sang "${nextLabel}" cho đơn ${selectedOrder.orderCode || selectedOrder.id}?`);
      if (!confirmed) return;
    }

    if ((nextOrderStatus === "shipping" || nextOrderStatus === "completed")
      && !String(draft.shippingProvider || "").trim()
      && !String(draft.trackingCode || "").trim()) {
      setMessage("Cần nhập shipping provider hoặc tracking code trước khi chuyển trạng thái giao hàng.");
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
          message: options.message || `Admin đổi trạng thái sang ${nextOrderStatus}`,
          actorRole: "admin",
          createdAt: serverTimestamp(),
        },
        {
          id: `local-${Date.now()}`,
          type: "status_changed",
          from: selectedOrder.orderStatus || "pending",
          to: nextOrderStatus,
          message: options.message || `Admin đổi trạng thái sang ${ORDER_STATUS_LABEL[nextOrderStatus] || nextOrderStatus}`,
          actorRole: "admin",
          createdAt: nowIso,
        }
      );

      setMessage(`Đã cập nhật đơn hàng sang "${nextLabel}".`);
    } catch (error) {
      setMessage(error.message || "Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setSaving(false);
    }
  }

  // ---- Computed for detail ----
  const customerDisplayName = selectedOrder
    ? (selectedOrder.customer?.name || selectedOrder.customer?.email || "Khách lẻ")
    : "";

  // ================================================================
  //  RENDER
  // ================================================================
  return (
    <AdminLayout resource="orders">
      <header className="admin-heading">
        <h1>Quản lý đơn hàng</h1>
      </header>

      {/* ---- Toolbar ---- */}
      <div className="admin-toolbar" style={{ flexWrap: "wrap" }}>
        <div className="admin-search-wrapper">
          <img src="/assets/ic-search.svg" className="admin-search-icon" alt="" />
          <input
            placeholder="Tìm theo mã đơn, tên khách, email, SĐT..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          {ORDER_STATUS_OPTIONS.map((item) => (
            <option key={item} value={item}>{ORDER_STATUS_LABEL[item]}</option>
          ))}
        </select>
        <select value={paymentMethodFilter} onChange={(event) => setPaymentMethodFilter(event.target.value)}>
          <option value="all">Tất cả phương thức</option>
          {PAYMENT_METHOD_OPTIONS.map((item) => (
            <option key={item} value={item}>{item.toUpperCase()}</option>
          ))}
        </select>
        <select value={paymentStatusFilter} onChange={(event) => setPaymentStatusFilter(event.target.value)}>
          <option value="all">Tất cả TT thanh toán</option>
          {PAYMENT_STATUS_OPTIONS.map((item) => (
            <option key={item} value={item}>{PAYMENT_STATUS_LABEL[item]}</option>
          ))}
        </select>
        <button type="button" className="admin-secondary-button" onClick={exportOrdersCsv} disabled={filteredOrders.length === 0}>
          Xuất CSV
        </button>
        {selectedOrder && (
          <button type="button" onClick={saveOrderMeta} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        )}
      </div>

      {/* ---- Stats ---- */}
      <div className="admin-user-stats" style={{ marginBottom: "24px" }}>
        <div className="admin-user-stat-card">
          <span>Tổng đơn</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="admin-user-stat-card">
          <span>Chờ xử lý</span>
          <strong>{stats.pending}</strong>
        </div>
        <div className="admin-user-stat-card">
          <span>Đã thanh toán</span>
          <strong>{stats.paid}</strong>
        </div>
        <div className="admin-user-stat-card">
          <span>Đang giao</span>
          <strong>{stats.shipping}</strong>
        </div>
        <div className="admin-user-stat-card">
          <span>Hoàn thành</span>
          <strong>{stats.completed}</strong>
        </div>
        <div className="admin-user-stat-card">
          <span>Doanh thu (đã TT)</span>
          <strong>{formatVnd(stats.paidRevenue)}</strong>
        </div>
        <div className="admin-user-stat-card">
          <span>TB / đơn</span>
          <strong>{formatVnd(stats.averageOrderValue)}</strong>
        </div>
      </div>

      {/* ---- Main grid: table + detail panel ---- */}
      <div className="admin-manager-grid">
        {/* ---- LEFT: Table ---- */}
        <div className="admin-table">
          {loadingOrders ? <EmptyState message="Đang tải danh sách đơn hàng..." /> : null}
          {!loadingOrders && filteredOrders.length === 0 ? (
            <EmptyState message="Chưa có đơn hàng nào hoặc không tìm thấy kết quả phù hợp." />
          ) : null}
          {!loadingOrders && filteredOrders.length > 0 ? (
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("orderCode")} style={{ cursor: "pointer", userSelect: "none" }}>
                      Mã đơn <SortIcon field="orderCode" />
                    </th>
                    <th onClick={() => handleSort("customer")} style={{ cursor: "pointer", userSelect: "none" }}>
                      Khách hàng <SortIcon field="customer" />
                    </th>
                    <th onClick={() => handleSort("paymentStatus")} style={{ cursor: "pointer", userSelect: "none" }}>
                      Thanh toán <SortIcon field="paymentStatus" />
                    </th>
                    <th onClick={() => handleSort("orderStatus")} style={{ cursor: "pointer", userSelect: "none" }}>
                      Trạng thái <SortIcon field="orderStatus" />
                    </th>
                    <th onClick={() => handleSort("total")} style={{ cursor: "pointer", userSelect: "none", textAlign: "right" }}>
                      Tổng tiền <SortIcon field="total" />
                    </th>
                    <th onClick={() => handleSort("createdAt")} style={{ cursor: "pointer", userSelect: "none" }}>
                      Ngày tạo <SortIcon field="createdAt" />
                    </th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((item) => {
                    const isActiveRow = selectedOrderId === item.id;
                    return (
                      <tr className={isActiveRow ? "is-active" : ""} key={item.id}>
                        <td>
                          <strong style={{ color: "#052c24", fontSize: "14px" }}>{item.orderCode || "—"}</strong>
                        </td>
                        <td>
                          <div style={{ display: "grid", gap: "2px" }}>
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>
                              {item.customer?.name || "Khách lẻ"}
                            </span>
                            {item.customer?.phone ? (
                              <span style={{ fontSize: "12px", color: "#64748b" }}>{item.customer.phone}</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#052c24" }}>
                              {(item.paymentMethod || "cod").toUpperCase()}
                            </span>
                            <StatusBadge status={item.paymentStatus} kind="payment" />
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={item.orderStatus} />
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                          {formatVnd(item.total)}
                        </td>
                        <td style={{ fontSize: "13px", color: "#475569", whiteSpace: "nowrap" }}>
                          {formatDate(item.createdAt)}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => openOrderDetail(item.id)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "8px",
                              border: isActiveRow ? "1px solid #052c24" : "1px solid #d1d5db",
                              background: isActiveRow ? "#052c24" : "#ffffff",
                              color: isActiveRow ? "#ffffff" : "#374151",
                              fontWeight: 600,
                              fontSize: "13px",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isActiveRow ? "Đang xem" : "Xem chi tiết →"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: "8px 0", textAlign: "right", fontSize: "12px", color: "#94a3b8" }}>
                {filteredOrders.length} / {orders.length} đơn hàng
              </div>
            </div>
          ) : null}
        </div>

        {/* ---- RIGHT: Detail panel ---- */}
        <section className="admin-editor">
          {!selectedOrder ? (
            loadingOrders ? (
              <EmptyState message="Đang tải chi tiết đơn hàng..." />
            ) : (
              <EmptyState message="👈 Chọn một đơn hàng bên trái để xem chi tiết và xử lý." />
            )
          ) : (
            <div style={{ display: "grid", gap: "20px" }}>
              {/* Header */}
              <div className="admin-editor-head">
                <div>
                  <h2>{selectedOrder.orderCode || "Đơn hàng"}</h2>
                  <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "14px" }}>
                    {customerDisplayName} · {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
                  <StatusBadge status={selectedOrder.orderStatus} />
                  <StatusBadge status={selectedOrder.paymentStatus} kind="payment" />
                  <button type="button" className="admin-secondary-button" onClick={closeOrderDetail}>
                    ✕ Đóng
                  </button>
                </div>
              </div>

              {message ? (
                <p style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "#f0fdf4",
                  color: "#166534",
                  fontSize: "13px",
                  fontWeight: 600,
                  margin: 0,
                }}>
                  {message}
                </p>
              ) : null}

              {/* Info cards */}
              <div className="admin-user-stats">
                <div className="admin-user-stat-card">
                  <span>Thanh toán</span>
                  <strong>{(selectedOrder.paymentMethod || "COD").toUpperCase()}</strong>
                  <small>{PAYMENT_STATUS_LABEL[selectedOrder.paymentStatus] || selectedOrder.paymentStatus}</small>
                </div>
                <div className="admin-user-stat-card">
                  <span>Sản phẩm</span>
                  <strong>{selectedOrder.items.length}</strong>
                  <small>món</small>
                </div>
                <div className="admin-user-stat-card">
                  <span>Tổng tiền</span>
                  <strong>{formatVnd(selectedOrder.total)}</strong>
                  <small>Tổng thanh toán</small>
                </div>
              </div>

              {/* Customer & Shipping */}
              <div className="admin-user-section-grid">
                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3>👤 Khách hàng</h3>
                  </div>
                  <div className="admin-user-profile-grid">
                    <div><strong>Tên</strong><span>{selectedOrder.customer?.name || "Chưa có"}</span></div>
                    <div><strong>Email</strong><span>{selectedOrder.customer?.email || "Chưa có"}</span></div>
                    <div><strong>SĐT</strong><span>{selectedOrder.customer?.phone || "Chưa có"}</span></div>
                  </div>
                </section>

                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3>📦 Giao hàng</h3>
                    <span>{selectedOrder.shippingProvider || "Chưa chọn đơn vị"}</span>
                  </div>
                  <div className="admin-user-profile-grid">
                    <div><strong>Địa chỉ</strong><span>{selectedOrder.shippingAddress?.addressLine || "Chưa có"}</span></div>
                    <div><strong>Tỉnh / TP</strong><span>{selectedOrder.shippingAddress?.province || "Chưa có"}</span></div>
                    <div><strong>Quận / Huyện</strong><span>{selectedOrder.shippingAddress?.district || "Chưa có"}</span></div>
                    <div><strong>Phường / Xã</strong><span>{selectedOrder.shippingAddress?.ward || "Chưa có"}</span></div>
                  </div>
                </section>
              </div>

              {/* Products */}
              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>🛒 Sản phẩm ({selectedOrder.items.length})</h3>
                </div>
                {selectedOrder.items.length === 0 ? (
                  <EmptyState message="Đơn hàng này chưa có sản phẩm nào." />
                ) : (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {selectedOrder.items.map((item, index) => (
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
                          <div
                            style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "10px",
                              background: "#e2e8f0",
                              display: "grid",
                              placeItems: "center",
                              color: "#64748b",
                              fontWeight: 800,
                              fontSize: "12px",
                            }}
                          >
                            SP
                          </div>
                        )}
                        <div style={{ display: "grid", gap: "3px" }}>
                          <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                            {item.name || item.slug || "Sản phẩm"}
                          </strong>
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

              {/* Admin status controls */}
              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>⚙️ Cập nhật trạng thái</h3>
                </div>
                <div className="admin-user-form-grid">
                  <label>
                    Trạng thái đơn
                    <select value={draft?.orderStatus || "pending"} onChange={(event) => setDraftField("orderStatus", event.target.value)}>
                      {ORDER_STATUS_OPTIONS.map((item) => (
                        <option key={item} value={item}>{ORDER_STATUS_LABEL[item]}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Trạng thái TT
                    <select value={draft?.paymentStatus || "pending"} onChange={(event) => setDraftField("paymentStatus", event.target.value)}>
                      {PAYMENT_STATUS_OPTIONS.map((item) => (
                        <option key={item} value={item}>{PAYMENT_STATUS_LABEL[item]}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Phương thức TT
                    <select value={draft?.paymentMethod || "cod"} onChange={(event) => setDraftField("paymentMethod", event.target.value)}>
                      {PAYMENT_METHOD_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item.toUpperCase()}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Đơn vị vận chuyển
                    <input
                      value={draft?.shippingProvider || ""}
                      onChange={(event) => setDraftField("shippingProvider", event.target.value)}
                      placeholder="GHTK / GHN / Viettel Post..."
                    />
                  </label>
                  <label>
                    Mã vận đơn
                    <input
                      value={draft?.trackingCode || ""}
                      onChange={(event) => setDraftField("trackingCode", event.target.value)}
                      placeholder="Nhập mã vận đơn"
                    />
                  </label>
                  <label style={{ gridColumn: "1 / -1" }}>
                    Ghi chú
                    <textarea
                      value={draft?.notes || ""}
                      onChange={(event) => setDraftField("notes", event.target.value)}
                      placeholder="Ghi chú nội bộ..."
                      rows={2}
                    />
                  </label>
                </div>

                <div className="admin-form-actions" style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => applyStatusUpdate("paid", { paymentStatus: "paid", message: "Admin xác nhận đã thanh toán" })} disabled={saving}>
                    ✓ Đã thanh toán
                  </button>
                  <button type="button" className="admin-secondary-button" onClick={() => applyStatusUpdate("shipping", { message: "Admin chuyển đơn sang giao hàng" })} disabled={saving}>
                    🚚 Đang giao
                  </button>
                  <button type="button" className="admin-secondary-button" onClick={() => applyStatusUpdate("completed", { message: "Admin hoàn tất đơn hàng" })} disabled={saving}>
                    ✅ Hoàn thành
                  </button>
                  <button type="button" className="admin-secondary-button" onClick={() => applyStatusUpdate("cancelled", { message: "Admin hủy đơn hàng" })} disabled={saving}>
                    ✕ Hủy đơn
                  </button>
                </div>
              </section>

              {/* Revenue */}
              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>💰 Thanh toán & doanh thu</h3>
                </div>
                <div className="admin-user-profile-grid">
                  <div><strong>Tạm tính</strong><span>{formatVnd(selectedOrder.subtotal)}</span></div>
                  <div><strong>Phí ship</strong><span>{formatVnd(selectedOrder.shippingFee)}</span></div>
                  <div><strong>Giảm giá</strong><span>{formatVnd(selectedOrder.discount)}</span></div>
                  <div><strong>Tổng</strong><span style={{ fontWeight: 800, color: "#052c24" }}>{formatVnd(selectedOrder.total)}</span></div>
                  <div><strong>Thanh toán lúc</strong><span>{formatDate(selectedOrder.paidAt)}</span></div>
                  <div><strong>Giao lúc</strong><span>{formatDate(selectedOrder.shippingStartedAt)}</span></div>
                  <div><strong>Hoàn thành lúc</strong><span>{formatDate(selectedOrder.completedAt)}</span></div>
                  <div><strong>Hủy lúc</strong><span>{formatDate(selectedOrder.cancelledAt)}</span></div>
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
                    <strong>SePay</strong>
                    <span>Invoice: {selectedOrder.sepay?.orderInvoiceNumber || selectedOrder.orderCode || "Chưa có"}</span>
                    <span>Checkout: {selectedOrder.sepay?.checkoutStatus || "pending"}</span>
                    <span>Đã trả: {formatVnd(selectedOrder.sepay?.paidAmount || 0)}</span>
                    <span>Thanh toán lúc: {formatDate(selectedOrder.sepay?.paidAt)}</span>
                  </div>
                ) : null}
              </section>

              {/* Timeline */}
              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>📋 Lịch sử ({events.length})</h3>
                </div>
                {loadingEvents ? <EmptyState message="Đang tải timeline..." /> : null}
                {!loadingEvents && events.length === 0 ? (
                  <EmptyState message="Đơn hàng này chưa có sự kiện nào." />
                ) : null}
                {!loadingEvents && events.length > 0 ? (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {events.map((item) => (
                      <article
                        key={item.id}
                        style={{
                          paddingBottom: "10px",
                          borderBottom: "1px solid #edf1ef",
                          display: "grid",
                          gap: "4px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                          <strong style={{ fontSize: "13px" }}>{item.type || "event"}</strong>
                          <small style={{ color: "#64748b", fontSize: "12px" }}>{formatDate(item.createdAt)}</small>
                        </div>
                        <span style={{ color: "#334155", fontSize: "13px" }}>{item.message || "Không có mô tả"}</span>
                        {item.from || item.to ? (
                          <small style={{ color: "#64748b", fontSize: "12px" }}>
                            {`${ORDER_STATUS_LABEL[item.from] || item.from || "?"} → ${ORDER_STATUS_LABEL[item.to] || item.to || "?"}`}
                          </small>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
