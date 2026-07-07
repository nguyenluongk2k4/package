"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
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

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function normalizeOrder(item) {
  const customer = item.customer || {};
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
    items,
    subtotal,
    shippingFee,
    discount,
    total,
    orderStatus: item.orderStatus || "pending",
    paymentStatus: item.paymentStatus || "pending",
    paymentMethod: item.paymentMethod || "cod",
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

function SortHint({ active, dir }) {
  return (
    <span style={{ marginLeft: "4px", fontSize: "11px", color: active ? "#052c24" : "#94a3b8" }}>
      {active ? (dir === "asc" ? "asc" : "desc") : "sort"}
    </span>
  );
}

export default function OrdersListManager() {
  const { db, isAdmin } = useFirebaseAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [message, setMessage] = useState("");

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
          .sort(
            (a, b) =>
              (toDateValue(b.updatedAt || b.createdAt)?.getTime() || 0)
              - (toDateValue(a.updatedAt || a.createdAt)?.getTime() || 0)
          );

        if (!mounted) return;
        setOrders(rows);
      } catch (error) {
        if (!mounted) return;
        console.error("Order list load failed:", error);
        setOrders([]);
        setMessage("Không thể tải danh sách đơn hàng. Kiểm tra lại quyền Firestore của admin cho collection orders.");
      } finally {
        if (mounted) setLoadingOrders(false);
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, [db, isAdmin]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
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

      const matchesSearch = haystack.includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || item.orderStatus === statusFilter;
      const matchesMethod = paymentMethodFilter === "all" || item.paymentMethod === paymentMethodFilter;
      const matchesPayment = paymentStatusFilter === "all" || item.paymentStatus === paymentStatusFilter;
      return matchesSearch && matchesStatus && matchesMethod && matchesPayment;
    });

    filtered.sort((a, b) => {
      let va;
      let vb;

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
      } else {
        va = (a.orderCode || "").toLowerCase();
        vb = (b.orderCode || "").toLowerCase();
      }

      if (typeof va === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? va - vb : vb - va;
    });

    return filtered;
  }, [orders, paymentMethodFilter, paymentStatusFilter, search, sortDir, sortField, statusFilter]);

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
      paidRevenue,
      averageOrderValue: orders.length ? Math.round(totalRevenue / orders.length) : 0,
    };
  }, [orders]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDir(field === "createdAt" ? "desc" : "asc");
  }

  function exportOrdersCsv() {
    const rows = filteredOrders.map((item) => [
      item.orderCode || item.id,
      item.customer?.name || "",
      item.customer?.email || "",
      item.customer?.phone || "",
      item.paymentMethod || "cod",
      item.paymentStatus || "pending",
      item.orderStatus || "pending",
      item.total || 0,
      formatDate(item.createdAt),
    ]);

    const csv = [
      ["orderCode", "customerName", "customerEmail", "customerPhone", "paymentMethod", "paymentStatus", "orderStatus", "total", "createdAt"],
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
  }

  function openOrderDetail(orderId) {
    if (typeof window !== "undefined") {
      window.location.href = `/admin/orders/${orderId}`;
    }
  }

  return (
    <AdminLayout resource="orders">
      <header className="admin-heading">
        <h1>Quản lý đơn hàng</h1>
        <p>Xem danh sách đơn hàng theo kiểu bảng, tìm kiếm nhanh, sắp xếp và đi sang trang chi tiết của từng đơn.</p>
      </header>

      <div className="admin-toolbar" style={{ flexWrap: "wrap" }}>
        <div className="admin-search-wrapper">
          <img src="/assets/ic-search.svg" className="admin-search-icon" alt="" />
          <input
            placeholder="Tìm theo mã đơn, tên khách, email, số điện thoại..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          {ORDER_STATUS_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {ORDER_STATUS_LABEL[item]}
            </option>
          ))}
        </select>
        <select value={paymentMethodFilter} onChange={(event) => setPaymentMethodFilter(event.target.value)}>
          <option value="all">Tất cả phương thức</option>
          {PAYMENT_METHOD_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item.toUpperCase()}
            </option>
          ))}
        </select>
        <select value={paymentStatusFilter} onChange={(event) => setPaymentStatusFilter(event.target.value)}>
          <option value="all">Tất cả thanh toán</option>
          {PAYMENT_STATUS_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {PAYMENT_STATUS_LABEL[item]}
            </option>
          ))}
        </select>
        <button type="button" className="admin-btn-secondary" onClick={exportOrdersCsv} disabled={filteredOrders.length === 0}>
          Xuất CSV
        </button>
      </div>

      {message ? <p className="admin-editor-message">{message}</p> : null}

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
          <span>Doanh thu</span>
          <strong>{formatVnd(stats.paidRevenue)}</strong>
        </div>
        <div className="admin-user-stat-card">
          <span>Trung bình / đơn</span>
          <strong>{formatVnd(stats.averageOrderValue)}</strong>
        </div>
      </div>

      <section className="admin-editor" style={{ padding: "24px" }}>
        {loadingOrders ? <EmptyState message="Đang tải danh sách đơn hàng..." /> : null}
        {!loadingOrders && filteredOrders.length === 0 ? <EmptyState message="Chưa có đơn hàng nào hoặc không tìm thấy kết quả phù hợp." /> : null}
        {!loadingOrders && filteredOrders.length > 0 ? (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("orderCode")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Mã đơn<SortHint active={sortField === "orderCode"} dir={sortDir} />
                  </th>
                  <th onClick={() => handleSort("customer")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Khách hàng<SortHint active={sortField === "customer"} dir={sortDir} />
                  </th>
                  <th onClick={() => handleSort("paymentStatus")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Thanh toán<SortHint active={sortField === "paymentStatus"} dir={sortDir} />
                  </th>
                  <th onClick={() => handleSort("orderStatus")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Trạng thái<SortHint active={sortField === "orderStatus"} dir={sortDir} />
                  </th>
                  <th onClick={() => handleSort("total")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Tổng tiền<SortHint active={sortField === "total"} dir={sortDir} />
                  </th>
                  <th onClick={() => handleSort("createdAt")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Ngày tạo<SortHint active={sortField === "createdAt"} dir={sortDir} />
                  </th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="admin-users-table-user">
                        <div className="admin-table-item-thumb-placeholder">DH</div>
                        <div className="admin-users-table-user-copy">
                          <strong>{item.orderCode || item.id}</strong>
                          <span>{item.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "grid", gap: "2px" }}>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{item.customer?.name || "Khách lẻ"}</span>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>{item.customer?.phone || item.customer?.email || "Chưa có liên hệ"}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "grid", gap: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#052c24" }}>{PAYMENT_METHOD_LABEL[item.paymentMethod] || (item.paymentMethod || "cod").toUpperCase()}</span>
                        <StatusBadge status={item.paymentStatus} kind="payment" />
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={item.orderStatus} />
                    </td>
                    <td style={{ fontWeight: 700, color: "#0f172a" }}>{formatVnd(item.total)}</td>
                    <td style={{ color: "#475569", fontSize: "13px", whiteSpace: "nowrap" }}>{formatDate(item.createdAt)}</td>
                    <td>
                      <button type="button" className="admin-btn-secondary" onClick={() => openOrderDetail(item.id)}>
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </AdminLayout>
  );
}
