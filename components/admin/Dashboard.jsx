"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import AdminLayout from "./AdminLayout";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";

function toDateValue(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function addDays(value, amount) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function addMonths(value, amount) {
  const date = new Date(value);
  const originalDay = date.getDate();
  date.setMonth(date.getMonth() + amount);
  if (date.getDate() !== originalDay) {
    date.setDate(0);
  }
  return date;
}

function formatDateInput(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value, fallback) {
  if (!value) return fallback;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function formatVnd(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function formatShorthand(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1).replace(".0", "")}B`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1).replace(".0", "")}M`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}k`;
  return `${amount}`;
}

function listDaysBetween(start, end) {
  const days = [];
  let cursor = startOfDay(start);
  const last = startOfDay(end);

  while (cursor.getTime() <= last.getTime()) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }

  return days;
}

function isRevenueOrder(order) {
  return order?.paymentStatus === "paid" || order?.orderStatus === "paid" || order?.orderStatus === "completed";
}

function getRevenueDate(order) {
  return (
    toDateValue(order?.paidAt) ||
    toDateValue(order?.sepay?.paidAt) ||
    toDateValue(order?.updatedAt) ||
    toDateValue(order?.createdAt)
  );
}

function getOrderDate(order) {
  return toDateValue(order?.createdAt) || toDateValue(order?.updatedAt) || getRevenueDate(order);
}

function isInRange(value, start, end) {
  if (!value || !start || !end) return false;
  const time = value.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function emptyStatusData() {
  return {
    total: 0,
    completed: 0,
    shipping: 0,
    pending: 0,
    cancelled: 0,
    percentages: {
      completed: 0,
      shipping: 0,
      pending: 0,
      cancelled: 0,
    },
  };
}

export default function Dashboard() {
  const { db } = useFirebaseAuth();
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePoint, setActivePoint] = useState(null);
  const [chartZoom, setChartZoom] = useState(1);
  const [fromDate, setFromDate] = useState(() => formatDateInput(addMonths(new Date(), -1)));
  const [toDate, setToDate] = useState(() => formatDateInput(new Date()));

  useEffect(() => {
    if (!db) return;

    let mounted = true;

    async function loadStats() {
      setLoading(true);
      const names = ["stations", "products", "arCharacters", "activationCodes"];
      const result = {};

      try {
        await Promise.all(
          names.map(async (name) => {
            const snapshot = await getDocs(collection(db, name));
            result[name] = snapshot.size;
          })
        );

        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const ordersList = ordersSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
        result.orders = ordersSnapshot.size;
        result.users = 0;

        try {
          const usersSnapshot = await getDocs(collection(db, "users"));
          result.users = usersSnapshot.size;
        } catch (usersError) {
          console.error("Dashboard users load failed:", usersError);
        }

        if (mounted) {
          setOrders(ordersList);
          setStats(result);
        }
      } catch (error) {
        console.error("Dashboard stats load failed:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStats();

    return () => {
      mounted = false;
    };
  }, [db]);

  const normalizedRange = useMemo(() => {
    const parsedStart = parseDateInput(fromDate, addMonths(new Date(), -1));
    const parsedEnd = parseDateInput(toDate, new Date());

    if (parsedStart.getTime() <= parsedEnd.getTime()) {
      return { start: startOfDay(parsedStart), end: endOfDay(parsedEnd) };
    }

    return { start: startOfDay(parsedEnd), end: endOfDay(parsedStart) };
  }, [fromDate, toDate]);

  useEffect(() => {
    setActivePoint(null);
  }, [fromDate, toDate, orders, chartZoom]);

  const earliestOrderDate = useMemo(() => {
    let earliest = null;
    orders.forEach((order) => {
      const date = getOrderDate(order);
      if (!date) return;
      if (!earliest || date.getTime() < earliest.getTime()) {
        earliest = date;
      }
    });
    return earliest;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => isInRange(getOrderDate(order), normalizedRange.start, normalizedRange.end));
  }, [orders, normalizedRange]);

  const filteredRevenueOrders = useMemo(() => {
    return orders.filter((order) => isRevenueOrder(order) && isInRange(getRevenueDate(order), normalizedRange.start, normalizedRange.end));
  }, [orders, normalizedRange]);

  const revenueSeries = useMemo(() => {
    const buckets = listDaysBetween(normalizedRange.start, normalizedRange.end).map((date) => ({
      date,
      label: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      timestamp: startOfDay(date).getTime(),
      revenue: 0,
      count: 0,
    }));

    const bucketMap = new Map(buckets.map((item) => [item.timestamp, item]));

    filteredRevenueOrders.forEach((order) => {
      const revenueDate = getRevenueDate(order);
      if (!revenueDate) return;
      const bucket = bucketMap.get(startOfDay(revenueDate).getTime());
      if (!bucket) return;
      bucket.revenue += Number(order.total || 0);
      bucket.count += 1;
    });

    return buckets;
  }, [filteredRevenueOrders, normalizedRange]);

  const revenueSummary = useMemo(() => {
    const revenue = filteredRevenueOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const paidOrders = filteredRevenueOrders.length;
    const itemsSold = filteredRevenueOrders.reduce((sum, order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      return sum + items.reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0);
    }, 0);
    const averageOrderValue = paidOrders > 0 ? Math.round(revenue / paidOrders) : 0;

    return {
      revenue,
      paidOrders,
      itemsSold,
      averageOrderValue,
    };
  }, [filteredRevenueOrders]);

  const orderStatusData = useMemo(() => {
    if (!filteredOrders.length) return emptyStatusData();

    const counts = {
      completed: 0,
      shipping: 0,
      pending: 0,
      cancelled: 0,
    };

    filteredOrders.forEach((order) => {
      const status = order.orderStatus || "pending";
      if (status === "completed" || status === "paid") counts.completed += 1;
      else if (status === "shipping") counts.shipping += 1;
      else if (status === "cancelled" || status === "failed") counts.cancelled += 1;
      else counts.pending += 1;
    });

    const total = filteredOrders.length;
    const pct = (value) => (total > 0 ? Math.round((value / total) * 100) : 0);

    return {
      total,
      completed: counts.completed,
      shipping: counts.shipping,
      pending: counts.pending,
      cancelled: counts.cancelled,
      percentages: {
        completed: pct(counts.completed),
        shipping: pct(counts.shipping),
        pending: pct(counts.pending),
        cancelled: pct(counts.cancelled),
      },
    };
  }, [filteredOrders]);

  const topProductsData = useMemo(() => {
    const productSales = {};

    filteredRevenueOrders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item) => {
        const id = item.productId || item.slug || item.name || "unknown";
        const quantity = Number(item.quantity || 1);
        const revenue = Number(item.price || 0) * quantity;

        if (!productSales[id]) {
          productSales[id] = {
            name: item.name || item.slug || "Sản phẩm",
            quantity: 0,
            revenue: 0,
            image: item.image || "",
          };
        }

        productSales[id].quantity += quantity;
        productSales[id].revenue += revenue;
      });
    });

    const topList = Object.values(productSales)
      .sort((a, b) => {
        if (b.quantity !== a.quantity) return b.quantity - a.quantity;
        return b.revenue - a.revenue;
      })
      .slice(0, 5);

    const maxQty = Math.max(...topList.map((item) => item.quantity), 1);
    return topList.map((item) => ({
      ...item,
      percent: Math.round((item.quantity / maxQty) * 100),
    }));
  }, [filteredRevenueOrders]);

  const chartConfig = useMemo(() => {
    const actualMaxRevenue = Math.max(...revenueSeries.map((item) => item.revenue), 0);
    const scaleMaxRevenue = actualMaxRevenue || 1;
    const chartHeight = 300;
    const paddingLeft = 58;
    const paddingRight = 36;
    const paddingTop = 28;
    const paddingBottom = 54;
    const segmentCount = Math.max(revenueSeries.length - 1, 1);
    const pointSpacing = Math.max(42, Math.round(54 * chartZoom));
    const chartWidth = Math.max(920, paddingLeft + paddingRight + segmentCount * pointSpacing);

    const points = revenueSeries.map((item, index) => {
      const x = paddingLeft + index * ((chartWidth - paddingLeft - paddingRight) / segmentCount);
      const y = chartHeight + paddingTop - (item.revenue / scaleMaxRevenue) * chartHeight;
      return { x, y, ...item, index };
    });

    const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const areaPath =
      points.length > 0
        ? `${linePath} L ${points[points.length - 1].x} ${chartHeight + paddingTop} L ${points[0].x} ${chartHeight + paddingTop} Z`
        : "";

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const y = chartHeight + paddingTop - ratio * chartHeight;
      const labelValue = actualMaxRevenue === 0 ? 0 : Math.round(actualMaxRevenue * ratio);
      return { y, label: formatShorthand(labelValue) };
    });

    const maxVisibleLabels =
      chartZoom >= 1.75 ? 31 :
      chartZoom >= 1.35 ? 18 :
      chartZoom >= 1 ? 12 : 9;
    const labelStep = Math.max(1, Math.ceil(revenueSeries.length / maxVisibleLabels));

    return {
      points,
      linePath,
      areaPath,
      gridLines,
      chartHeight,
      chartWidth,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      labelStep,
    };
  }, [revenueSeries, chartZoom]);

  const donutCircumference = 2 * Math.PI * 50;
  const donutSegments = useMemo(() => {
    const { completed, shipping, pending, cancelled, percentages } = orderStatusData;
    const data = [
      { key: "completed", value: completed, percent: percentages.completed, color: "#10b981", label: "Hoàn thành" },
      { key: "shipping", value: shipping, percent: percentages.shipping, color: "#06b6d4", label: "Đang giao" },
      { key: "pending", value: pending, percent: percentages.pending, color: "#f59e0b", label: "Chờ xử lý" },
      { key: "cancelled", value: cancelled, percent: percentages.cancelled, color: "#ef4444", label: "Đã hủy" },
    ];

    let accumulatedPercent = 0;

    return data.map((item) => {
      const strokeLength = (item.percent / 100) * donutCircumference;
      const strokeOffset = donutCircumference - (accumulatedPercent / 100) * donutCircumference;
      accumulatedPercent += item.percent;

      return {
        ...item,
        strokeLength,
        strokeOffset,
      };
    });
  }, [orderStatusData, donutCircumference]);

  const dashboardStats = [
    { label: "Địa danh", value: stats.stations ?? "-", badge: "ĐỊA ĐIỂM", icon: "/assets/admin/dashboard/ic-dia-danh-dashboard-da-co-bg.svg" },
    { label: "Sản phẩm", value: stats.products ?? "-", badge: "CỬA HÀNG", icon: "/assets/admin/dashboard/ic-san-pham-dashboard-da-co-bg.svg" },
    { label: "Đơn hàng", value: stats.orders ?? "-", badge: "GIAO DỊCH", icon: "/assets/admin/dashboard/ic-san-pham-dashboard-da-co-bg.svg" },
    { label: "Người dùng", value: stats.users ?? "-", badge: "TÀI KHOẢN", icon: "/assets/admin/dashboard/ic-san-pham-dashboard-da-co-bg.svg" },
  ];

  const quickStats = [
    { label: "Doanh thu thực nhận", value: formatVnd(revenueSummary.revenue) },
    { label: "Đơn ghi nhận", value: `${revenueSummary.paidOrders}` },
    { label: "Giá trị trung bình", value: formatVnd(revenueSummary.averageOrderValue) },
    { label: "Sản phẩm đã bán", value: `${revenueSummary.itemsSold}` },
  ];

  function applyRangePreset(type) {
    const today = new Date();

    if (type === "7d") {
      setFromDate(formatDateInput(addDays(today, -6)));
      setToDate(formatDateInput(today));
      return;
    }

    if (type === "1m") {
      setFromDate(formatDateInput(addMonths(today, -1)));
      setToDate(formatDateInput(today));
      return;
    }

    if (type === "3m") {
      setFromDate(formatDateInput(addMonths(today, -3)));
      setToDate(formatDateInput(today));
      return;
    }

    if (type === "1y") {
      setFromDate(formatDateInput(addMonths(today, -12)));
      setToDate(formatDateInput(today));
      return;
    }

    if (type === "all") {
      setFromDate(formatDateInput(earliestOrderDate || addMonths(today, -1)));
      setToDate(formatDateInput(today));
    }
  }

  function zoomIn() {
    setChartZoom((value) => Math.min(2.4, Number((value + 0.25).toFixed(2))));
  }

  function zoomOut() {
    setChartZoom((value) => Math.max(0.75, Number((value - 0.25).toFixed(2))));
  }

  function resetZoom() {
    setChartZoom(1);
  }

  return (
    <AdminLayout resource="dashboard">
      <div className="admin-dashboard-page">
        <header className="admin-dashboard-heading">
          <h1>Bảng điều khiển</h1>
          <p>Hệ thống giám sát hành trình check-in du lịch, điều phối đơn hàng và quản trị mô hình AR Sắc Cố Đô.</p>
        </header>

        <section className="admin-dashboard-stat-grid" aria-label="Tổng quan số liệu">
          {dashboardStats.map((item) => (
            <article className="admin-dashboard-stat-card" key={item.label}>
              <div className="admin-dashboard-stat-top">
                <img src={item.icon} alt="" />
                <span>{item.badge}</span>
              </div>
              <div>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
              </div>
            </article>
          ))}
        </section>

        <section className="admin-dashboard-top-panel admin-dashboard-chart-card" aria-label="Doanh thu">
          <div className="admin-dashboard-topbar">
            <div className="admin-dashboard-topbar-copy">
              <h2>Doanh thu thực nhận</h2>
              <p className="chart-subtitle">Mặc định biểu đồ lấy 1 tháng gần nhất và chỉ tính các đơn đã thanh toán hoặc hoàn thành.</p>
            </div>

            <div className="admin-dashboard-range-picker">
              <label className="admin-dashboard-range-field">
                <span>Từ ngày</span>
                <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              </label>
              <label className="admin-dashboard-range-field">
                <span>Đến ngày</span>
                <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
              </label>
            </div>
          </div>

          <div className="admin-dashboard-chart-tools">
            <div className="admin-dashboard-presets">
              <button type="button" className={`admin-dashboard-chip${fromDate === formatDateInput(addDays(new Date(), -6)) ? " is-active" : ""}`} onClick={() => applyRangePreset("7d")}>7 ngày</button>
              <button type="button" className={`admin-dashboard-chip${fromDate === formatDateInput(addMonths(new Date(), -1)) ? " is-active" : ""}`} onClick={() => applyRangePreset("1m")}>1 tháng</button>
              <button type="button" className="admin-dashboard-chip" onClick={() => applyRangePreset("3m")}>3 tháng</button>
              <button type="button" className="admin-dashboard-chip" onClick={() => applyRangePreset("1y")}>1 năm</button>
              <button type="button" className="admin-dashboard-chip" onClick={() => applyRangePreset("all")}>Toàn bộ</button>
            </div>

            <div className="admin-dashboard-zoom-tools">
              <span className="admin-dashboard-zoom-label">Zoom biểu đồ</span>
              <button type="button" className="admin-dashboard-icon-button" onClick={zoomOut} disabled={chartZoom <= 0.75}>-</button>
              <button type="button" className="admin-dashboard-icon-button" onClick={resetZoom}>100%</button>
              <button type="button" className="admin-dashboard-icon-button" onClick={zoomIn} disabled={chartZoom >= 2.4}>+</button>
            </div>
          </div>

          <div className="admin-dashboard-quick-stats">
            {quickStats.map((item) => (
              <article className="admin-dashboard-quick-stat" key={item.label}>
                <span>{item.label}</span>
                <strong>{loading ? "..." : item.value}</strong>
              </article>
            ))}
          </div>

          <div className="admin-chart-container">
            <div className="admin-chart-scroll">
              <svg className="admin-chart-svg" viewBox={`0 0 ${chartConfig.chartWidth} ${chartConfig.chartHeight + chartConfig.paddingTop + chartConfig.paddingBottom}`}>
                <defs>
                  <linearGradient id="adminRevenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#052c24" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#052c24" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {chartConfig.gridLines.map((line, index) => (
                  <g key={index}>
                    <line
                      x1={chartConfig.paddingLeft}
                      y1={line.y}
                      x2={chartConfig.chartWidth - chartConfig.paddingRight}
                      y2={line.y}
                      stroke="#e8f0ec"
                      strokeWidth={1}
                    />
                    <text
                      x={chartConfig.paddingLeft - 12}
                      y={line.y + 4}
                      textAnchor="end"
                      fontSize={11}
                      fill="#94a3b8"
                      fontWeight="700"
                    >
                      {line.label}
                    </text>
                  </g>
                ))}

                {chartConfig.areaPath ? <path d={chartConfig.areaPath} fill="url(#adminRevenueAreaGradient)" /> : null}

                {chartConfig.linePath ? (
                  <path
                    d={chartConfig.linePath}
                    fill="none"
                    stroke="#052c24"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}

                {chartConfig.points.map((point) => (
                  <circle
                    key={point.timestamp}
                    cx={point.x}
                    cy={point.y}
                    r={activePoint?.timestamp === point.timestamp ? 6 : 4}
                    fill={activePoint?.timestamp === point.timestamp ? "#10b981" : "#052c24"}
                    stroke="#ffffff"
                    strokeWidth={2}
                    style={{ transition: "all 0.15s ease", pointerEvents: "none" }}
                  />
                ))}

                {chartConfig.points.map((point, index) => {
                  const showLabel = index % chartConfig.labelStep === 0 || index === chartConfig.points.length - 1;
                  if (!showLabel) return null;

                  return (
                    <text
                      key={`label-${point.timestamp}`}
                      x={point.x}
                      y={chartConfig.chartHeight + chartConfig.paddingTop + 22}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#64748b"
                      fontWeight="700"
                    >
                      {point.label}
                    </text>
                  );
                })}

                {chartConfig.points.map((point) => (
                  <circle
                    key={`hit-${point.timestamp}`}
                    cx={point.x}
                    cy={point.y}
                    r={20}
                    fill="transparent"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setActivePoint(point)}
                    onMouseLeave={() => setActivePoint(null)}
                  />
                ))}
              </svg>
            </div>

            {!loading && revenueSummary.paidOrders === 0 ? (
              <div className="admin-chart-empty">
                <strong>Chưa có doanh thu trong khoảng này</strong>
                <span>Thử đổi mốc thời gian hoặc kiểm tra lại trạng thái thanh toán của đơn hàng.</span>
              </div>
            ) : null}

            {activePoint ? (
              <div
                className="admin-chart-tooltip"
                style={{
                  left: `${activePoint.x - 78}px`,
                  top: `${activePoint.y - 54}px`,
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: "2px" }}>{activePoint.label}</div>
                <div>
                  Doanh thu: <span style={{ color: "#34d399", fontWeight: 800 }}>{formatVnd(activePoint.revenue)}</span>
                </div>
                <div style={{ fontSize: "10px", opacity: 0.82 }}>Đơn ghi nhận: {activePoint.count}</div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="admin-dashboard-bottom-grid" aria-label="Báo cáo nhanh">
          <article className="admin-dashboard-chart-card">
            <h2>Trạng thái đơn hàng</h2>
            <p className="chart-subtitle">Tỷ lệ đơn trong khoảng ngày tạo anh đang lọc.</p>

            <div className="admin-donut-container">
              <div className="admin-donut-svg-wrapper">
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <g transform="rotate(-90 80 80)">
                    <circle cx="80" cy="80" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="15" />
                    {donutSegments.map((segment) => (
                      <circle
                        key={segment.key}
                        cx="80"
                        cy="80"
                        r="50"
                        fill="transparent"
                        stroke={segment.color}
                        strokeWidth={15}
                        strokeDasharray={`${segment.strokeLength} ${donutCircumference}`}
                        strokeDashoffset={segment.strokeOffset}
                        style={{ transition: "stroke-dashoffset 0.35s ease" }}
                      />
                    ))}
                  </g>
                </svg>

                <div className="admin-donut-label-center">
                  <span>Tổng đơn</span>
                  <strong>{orderStatusData.total}</strong>
                </div>
              </div>

              <div className="admin-donut-legends">
                {donutSegments.map((segment) => (
                  <div className="admin-donut-legend-item" key={segment.key}>
                    <div className="admin-donut-legend-left">
                      <span className="admin-donut-legend-dot" style={{ background: segment.color }} />
                      <span>{segment.label}</span>
                    </div>
                    <div className="admin-donut-legend-right">
                      {segment.value} <span>({segment.percent}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="admin-dashboard-chart-card">
            <h2>Sản phẩm bán chạy</h2>
            <p className="chart-subtitle">Top 5 sản phẩm theo số lượng từ các đơn đã ghi nhận doanh thu.</p>

            {topProductsData.length > 0 ? (
              <div className="admin-products-ranking-list">
                {topProductsData.map((product) => (
                  <div className="admin-product-rank-item" key={`${product.name}-${product.quantity}`}>
                    {product.image ? (
                      <img src={product.image} className="admin-product-rank-thumb" alt="" />
                    ) : (
                      <div className="admin-product-rank-placeholder">SP</div>
                    )}

                    <div className="admin-product-rank-info">
                      <div className="admin-product-rank-meta">
                        <span className="admin-product-rank-name">{product.name}</span>
                        <span className="admin-product-rank-value">{formatVnd(product.revenue)}</span>
                      </div>

                      <div className="admin-product-rank-bar-bg">
                        <div className="admin-product-rank-bar-fill" style={{ width: `${product.percent}%` }} />
                      </div>

                      <span className="admin-product-rank-sales-count">Đã bán: {product.quantity} chiếc</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-chart-empty is-inline">
                <strong>Chưa có dữ liệu sản phẩm</strong>
                <span>Hiện chưa có đơn đã ghi nhận doanh thu trong khoảng này để xếp hạng.</span>
              </div>
            )}
          </article>
        </section>
      </div>
    </AdminLayout>
  );
}
