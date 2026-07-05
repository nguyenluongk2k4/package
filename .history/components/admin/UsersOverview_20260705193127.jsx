"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import AdminLayout from "./AdminLayout";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";

const DETAIL_GROUPS = ["journeyProgress", "photoboothPhotos", "arExperiences", "cart", "adminEvents"];
const USERS_PER_PAGE = 10;

const CERTIFICATES = [
  {
    id: "beginner",
    title: "Ke lu hanh to mo",
    required: 2,
    svgUrl: "/certificate/begin.svg",
  },
  {
    id: "photographer",
    title: "Nhiep anh gia Co do",
    required: 4,
    svgUrl: "/certificate/HERITAGE-PHOTOGRAPHER.svg",
  },
  {
    id: "champion",
    title: "Nha chinh phuc Co do",
    required: 6,
    svgUrl: "/certificate/HERITAGE-CHAMPION.svg",
  },
];

function deriveUserStatus(user) {
  if (user?.status) return user.status;
  if (user?.bannedAt) return "banned";
  if (user?.isActivated) return "active";
  return "inactive";
}

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

function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function isValidHttpUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(String(value).trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function sortByNewest(rows = [], fieldNames = ["updatedAt", "createdAt", "checkedInAt"]) {
  return [...rows].sort((a, b) => {
    const aDate = fieldNames.map((field) => toDateValue(a?.[field])).find(Boolean);
    const bDate = fieldNames.map((field) => toDateValue(b?.[field])).find(Boolean);
    return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
  });
}

function getUserTitle(user) {
  return user?.fullName || user?.displayName || user?.email || user?.id || "Nguoi dung";
}

function summarizeUser(user, details) {
  const journeyProgress = details?.journeyProgress || [];
  const photoboothPhotos = details?.photoboothPhotos || [];
  const arExperiences = details?.arExperiences || [];
  const cart = details?.cart || [];
  const orders = details?.orders || [];
  const completedStops = journeyProgress.length;
  const unlockedCertificates = CERTIFICATES.filter((item) => completedStops >= item.required);

  return {
    completedStops,
    photoboothCount: photoboothPhotos.length,
    arCount: arExperiences.length,
    cartCount: cart.length,
    orderCount: orders.length,
    unlockedCertificates,
    highestCertificate: unlockedCertificates[unlockedCertificates.length - 1] || null,
    hasPassport: Boolean(user?.passportCode),
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

function StatusBadge({ status }) {
  const palette =
    status === "active"
      ? { background: "#dcfce7", color: "#166534" }
      : status === "banned"
        ? { background: "#fee2e2", color: "#b91c1c" }
        : { background: "#fef3c7", color: "#92400e" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        ...palette,
      }}
    >
      {status}
    </span>
  );
}

function PaginationControls({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        marginTop: "16px",
        paddingTop: "12px",
        borderTop: "1px solid #edf1ef",
      }}
    >
      <small style={{ color: "#64748b" }}>
        Trang {page} / {totalPages}
      </small>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button type="button" className="admin-secondary-button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Trang truoc
        </button>
        <button type="button" className="admin-secondary-button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Trang sau
        </button>
      </div>
    </div>
  );
}

export default function UsersOverview() {
  const { db } = useFirebaseAuth();
  const [requestedUid, setRequestedUid] = useState("");
  const [users, setUsers] = useState([]);
  const [orderCountsByUser, setOrderCountsByUser] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [draft, setDraft] = useState(null);
  const [details, setDetails] = useState({});
  const [activationCodeData, setActivationCodeData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supportStatusFilter, setSupportStatusFilter] = useState("all");
  const [activationFilter, setActivationFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setRequestedUid(params.get("uid") || "");
  }, []);

  useEffect(() => {
    if (!db) return;

    let mounted = true;

    async function loadUsers() {
      setLoadingUsers(true);
      try {
        const [snapshot, ordersSnapshot] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "orders")).catch(() => null),
        ]);
        const rows = snapshot.docs.map((userDoc) => ({ id: userDoc.id, ...userDoc.data() }));
        const nextOrderCounts = {};

        if (ordersSnapshot) {
          ordersSnapshot.docs.forEach((orderDoc) => {
            const userId = orderDoc.data()?.userId;
            if (!userId) return;
            nextOrderCounts[userId] = (nextOrderCounts[userId] || 0) + 1;
          });
        }

        rows.sort((a, b) => {
          const aDate = toDateValue(a.lastLoginAt || a.createdAt);
          const bDate = toDateValue(b.lastLoginAt || b.createdAt);
          return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
        });
        if (!mounted) return;
        setUsers(rows);
        setOrderCountsByUser(nextOrderCounts);
        if (requestedUid && rows.some((item) => item.id === requestedUid)) {
          setSelectedUserId(requestedUid);
        }
      } finally {
        if (mounted) {
          setLoadingUsers(false);
        }
      }
    }

    loadUsers();

    return () => {
      mounted = false;
    };
  }, [db, requestedUid]);

  useEffect(() => {
    if (selectedUserId) return;
    setSelectedUser(null);
    setDraft(null);
    setDetails({});
    setActivationCodeData(null);
    setLoadingDetails(false);
    setMessage("");
  }, [selectedUserId]);

  useEffect(() => {
    if (!db || !selectedUserId) return;

    let mounted = true;

    async function inspectUser() {
      setLoadingDetails(true);
      setMessage("");
      setSelectedUser(null);
      setDraft(null);
      setDetails({});
      setActivationCodeData(null);

      try {
        const userSnapshot = await getDoc(doc(db, "users", selectedUserId));
        if (!userSnapshot.exists()) {
          if (!mounted) return;
          setSelectedUser(null);
          setDraft(null);
          setDetails({});
          setActivationCodeData(null);
          return;
        }

        const userRow = { id: userSnapshot.id, ...userSnapshot.data() };
        const nextDetails = {};
        let codeData = null;

        if (!mounted) return;
        setSelectedUser(userRow);
        setDraft({
          displayName: userRow.displayName || "",
          fullName: userRow.fullName || "",
          email: userRow.email || "",
          phone: userRow.phone || "",
          photoURL: userRow.photoURL || "",
          status: deriveUserStatus(userRow),
          bannedReason: userRow.bannedReason || "",
          supportStatus: userRow.supportStatus || "none",
          adminNotes: userRow.adminNotes || "",
        });

        await Promise.all(
          DETAIL_GROUPS.map(async (group) => {
            try {
              const snapshot = await getDocs(collection(db, "users", userRow.id, group));
              nextDetails[group] = sortByNewest(snapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() })));
            } catch {
              nextDetails[group] = [];
            }
          })
        );

        try {
          const ordersSnapshot = await getDocs(query(collection(db, "orders"), where("userId", "==", userRow.id)));
          nextDetails.orders = sortByNewest(
            ordersSnapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() })),
            ["updatedAt", "createdAt", "paidAt"]
          );
        } catch {
          nextDetails.orders = [];
        }

        if (userRow.passportCode) {
          try {
            const codeSnapshot = await getDoc(doc(db, "activationCodes", userRow.passportCode));
            if (codeSnapshot.exists()) {
              codeData = { id: codeSnapshot.id, ...codeSnapshot.data() };
            }
          } catch {
            codeData = null;
          }
        }

        if (!mounted) return;
        setDetails(nextDetails);
        setActivationCodeData(codeData);
      } catch (error) {
        if (!mounted) return;
        console.error("User detail load failed:", error);
        setMessage("Khong the tai day du detail cua user. He thong da hien thi phan du lieu co the doc duoc.");
      } finally {
        if (mounted) {
          setLoadingDetails(false);
        }
      }
    }

    inspectUser();

    return () => {
      mounted = false;
    };
  }, [db, selectedUserId]);

  const filteredUsers = useMemo(() => {
    return users.filter((userRow) => {
      const status = deriveUserStatus(userRow);
      const supportStatus = userRow.supportStatus || "none";
      const hasActivation = Boolean(userRow.isActivated || userRow.passportCode);
      const orderCount = orderCountsByUser[userRow.id] || 0;
      const haystack = [
        userRow.id,
        userRow.displayName,
        userRow.fullName,
        userRow.email,
        userRow.phone,
        userRow.passportCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSupport = supportStatusFilter === "all" || supportStatus === supportStatusFilter;
      const matchesActivation =
        activationFilter === "all"
          || (activationFilter === "activated" && hasActivation)
          || (activationFilter === "notActivated" && !hasActivation);
      const matchesOrders =
        orderFilter === "all"
          || (orderFilter === "hasOrders" && orderCount > 0)
          || (orderFilter === "noOrders" && orderCount === 0);
      return matchesSearch && matchesStatus && matchesSupport && matchesActivation && matchesOrders;
    });
  }, [activationFilter, orderCountsByUser, orderFilter, search, statusFilter, supportStatusFilter, users]);

  useEffect(() => {
    setPage(1);
  }, [activationFilter, orderFilter, search, statusFilter, supportStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, page]);

  const summary = useMemo(() => summarizeUser(selectedUser, details), [details, selectedUser]);
  const activityTimeline = useMemo(() => {
    const timeline = [];

    (details.adminEvents || []).forEach((item) => {
      timeline.push({
        id: `admin-${item.id}`,
        type: "admin",
        title: item.message || "Admin update",
        subtitle: item.action || "admin_event",
        createdAt: item.createdAt,
      });
    });

    (details.journeyProgress || []).forEach((item) => {
      timeline.push({
        id: `checkin-${item.id}`,
        type: "checkin",
        title: item.stationName || item.stationId || item.id,
        subtitle: "Check-in",
        createdAt: item.checkedInAt || item.updatedAt,
      });
    });

    (details.photoboothPhotos || []).forEach((item) => {
      timeline.push({
        id: `photo-${item.id}`,
        type: "photobooth",
        title: item.caption || item.stationId || item.id,
        subtitle: "Photobooth",
        createdAt: item.createdAt,
      });
    });

    (details.arExperiences || []).forEach((item) => {
      timeline.push({
        id: `ar-${item.id}`,
        type: "ar",
        title: item.stationName || item.stationId || item.id,
        subtitle: `AR ${item.modelId || ""}`.trim(),
        createdAt: item.createdAt,
      });
    });

    (details.orders || []).forEach((item) => {
      timeline.push({
        id: `order-${item.id}`,
        type: "order",
        title: item.orderCode || item.id,
        subtitle: `${(item.paymentMethod || "cod").toUpperCase()} · ${item.orderStatus || "pending"}`,
        createdAt: item.updatedAt || item.createdAt,
      });
    });

    return sortByNewest(timeline, ["createdAt"]);
  }, [details.adminEvents, details.arExperiences, details.journeyProgress, details.orders, details.photoboothPhotos]);

  function patchSelectedUser(partial) {
    setSelectedUser((current) => (current ? { ...current, ...partial } : current));
    setUsers((current) => current.map((item) => (item.id === selectedUserId ? { ...item, ...partial } : item)));
  }

  function setDraftField(name, value) {
    setDraft((current) => ({ ...(current || {}), [name]: value }));
  }

  async function appendAdminEvent(action, messageText, metadata = {}) {
    if (!db || !selectedUserId) return;

    const payload = {
      type: "admin_event",
      action,
      message: messageText,
      actorRole: "admin",
      metadata,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "users", selectedUserId, "adminEvents"), payload);
    setDetails((current) => ({
      ...current,
      adminEvents: [
        {
          id: `local-${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString(),
        },
        ...(current.adminEvents || []),
      ],
    }));
  }

  async function saveProfile() {
    if (!db || !selectedUserId || !draft) return;

    if (!draft.displayName.trim() && !draft.fullName.trim()) {
      setMessage("Can co it nhat display name hoac full name.");
      return;
    }

    if (!isValidEmail(draft.email)) {
      setMessage("Email khong hop le.");
      return;
    }

    if (!isValidHttpUrl(draft.photoURL)) {
      setMessage("Avatar URL phai la link http hoac https hop le.");
      return;
    }

    if (draft.phone && String(draft.phone).replace(/\D/g, "").length < 8) {
      setMessage("So dien thoai chua hop le.");
      return;
    }

    if (draft.status === "banned" && !draft.bannedReason.trim()) {
      setMessage("Can nhap ly do ban tai khoan.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const nowIso = new Date().toISOString();
      const payload = {
        displayName: draft.displayName || "",
        fullName: draft.fullName || "",
        email: draft.email || "",
        phone: draft.phone || "",
        photoURL: draft.photoURL || "",
        status: draft.status || "inactive",
        bannedReason: draft.status === "banned" ? draft.bannedReason || "" : "",
        supportStatus: draft.supportStatus || "none",
        adminNotes: draft.adminNotes || "",
        adminNotesUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "users", selectedUserId), payload);
      patchSelectedUser({
        ...payload,
        updatedAt: nowIso,
        adminNotesUpdatedAt: nowIso,
      });
      await appendAdminEvent("profile_updated", "Admin cap nhat ho so nguoi dung", {
        status: payload.status,
        supportStatus: payload.supportStatus,
      });
      setMessage("Da luu thong tin tai khoan.");
    } catch (error) {
      setMessage(error.message || "Khong the luu thong tin tai khoan.");
    } finally {
      setSaving(false);
    }
  }

  async function updateAccountStatus(nextStatus) {
    if (!db || !selectedUserId) return;
    const currentStatus = draft?.status || deriveUserStatus(selectedUser);
    const nextLabel = nextStatus === "banned" ? "khoa" : "kich hoat";

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Xac nhan ${nextLabel} tai khoan ${getUserTitle(selectedUser)}?`);
      if (!confirmed) {
        return;
      }
    }

    if (nextStatus === "banned" && !String(draft?.bannedReason || "").trim()) {
      setMessage("Can nhap ly do ban truoc khi khoa tai khoan.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const nowIso = new Date().toISOString();
      const payload = {
        status: nextStatus,
        bannedReason: nextStatus === "banned" ? draft?.bannedReason || "Admin update" : "",
        updatedAt: serverTimestamp(),
      };

      if (nextStatus === "banned") {
        payload.bannedAt = serverTimestamp();
      } else {
        payload.bannedAt = null;
      }

      await updateDoc(doc(db, "users", selectedUserId), payload);
      patchSelectedUser({
        ...payload,
        updatedAt: nowIso,
        bannedAt: nextStatus === "banned" ? nowIso : null,
      });
      await appendAdminEvent(
        "status_changed",
        nextStatus === "banned" ? "Admin khoa tai khoan" : "Admin kich hoat lai tai khoan",
        {
          from: currentStatus,
          to: nextStatus,
          bannedReason: payload.bannedReason || "",
        }
      );
      setDraft((current) => ({
        ...(current || {}),
        status: nextStatus,
        bannedReason: payload.bannedReason,
      }));
      setMessage(nextStatus === "banned" ? "Da khoa tai khoan." : "Da kich hoat tai khoan.");
    } catch (error) {
      setMessage(error.message || "Khong the cap nhat trang thai tai khoan.");
    } finally {
      setSaving(false);
    }
  }

  const checkinPhotos = useMemo(() => {
    return (details.journeyProgress || []).filter((item) => item.photoUrl);
  }, [details.journeyProgress]);

  function exportUsersCsv() {
    const rows = filteredUsers.map((userRow) => {
      const status = deriveUserStatus(userRow);
      return [
        userRow.id,
        userRow.displayName || "",
        userRow.fullName || "",
        userRow.email || "",
        userRow.phone || "",
        status,
        userRow.supportStatus || "none",
        userRow.passportCode || "",
        userRow.isActivated ? "yes" : "no",
        orderCountsByUser[userRow.id] || 0,
        formatDate(userRow.createdAt),
        formatDate(userRow.lastLoginAt),
      ];
    });

    const csv = [
      ["uid", "displayName", "fullName", "email", "phone", "status", "supportStatus", "passportCode", "activated", "orderCount", "createdAt", "lastLoginAt"],
      ...rows,
    ]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `admin-users-${Date.now()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setMessage(`Da export ${filteredUsers.length} user.`);
  }

  function openUserDetail(userId) {
    setSelectedUserId(userId);
  }

  function closeUserDetail() {
    setSelectedUserId("");
  }

  return (
    <AdminLayout resource="users">
      {!selectedUserId ? (
        <>
          <header className="admin-heading">
            <h1>Quản lý người dùng</h1>
            <p>Xem hồ sơ tài khoản, hành trình check-in, passport, certificate, photobooth, AR sessions và cập nhật trạng thái người dùng.</p>
          </header>

          <div className="admin-toolbar">
            <div className="admin-search-wrapper">
              <img src="/assets/ic-search.svg" className="admin-search-icon" alt="" />
              <input placeholder="Tìm theo tên, email, uid, passport code..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
            <select value={supportStatusFilter} onChange={(event) => setSupportStatusFilter(event.target.value)}>
              <option value="all">Tất cả hỗ trợ</option>
              <option value="none">None</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
            <select value={activationFilter} onChange={(event) => setActivationFilter(event.target.value)}>
              <option value="all">Tất cả passport</option>
              <option value="activated">Đã kích hoạt</option>
              <option value="notActivated">Chưa kích hoạt</option>
            </select>
            <select value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)}>
              <option value="all">Tất cả đơn hàng</option>
              <option value="hasOrders">Có đơn hàng</option>
              <option value="noOrders">Chưa có đơn hàng</option>
            </select>
            <button type="button" className="admin-secondary-button" onClick={exportUsersCsv} disabled={filteredUsers.length === 0}>
              Export CSV
            </button>
          </div>

          <div className="admin-table" style={{ maxHeight: "none" }}>
            {loadingUsers ? <EmptyState message="Đang tải danh sách người dùng..." /> : null}
            {!loadingUsers && filteredUsers.length === 0 ? <EmptyState message="Không tìm thấy người dùng phù hợp." /> : null}
            {!loadingUsers && filteredUsers.length > 0 ? (
              <div className="admin-users-table-wrap">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>Người dùng</th>
                      <th>Trạng thái</th>
                      <th>Mã Passport</th>
                      <th>Đơn hàng</th>
                      <th>Đăng nhập cuối</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((userRow) => {
                      const status = deriveUserStatus(userRow);
                      return (
                        <tr key={userRow.id}>
                          <td>
                            <div className="admin-users-table-user">
                              {userRow.photoURL ? (
                                <img src={userRow.photoURL} className="admin-table-item-thumb" alt="" />
                              ) : (
                                <div className="admin-table-item-thumb-placeholder">
                                  {(userRow.displayName || userRow.email || "U").slice(0, 1).toUpperCase()}
                                </div>
                              )}
                              <div className="admin-users-table-user-copy">
                                <strong>{getUserTitle(userRow)}</strong>
                                <span>{userRow.email || userRow.id}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={status} />
                          </td>
                          <td>{userRow.passportCode || "Chưa kích hoạt"}</td>
                          <td>{orderCountsByUser[userRow.id] || 0}</td>
                          <td>{formatDate(userRow.lastLoginAt || userRow.createdAt)}</td>
                          <td>
                            <button type="button" className="admin-secondary-button" onClick={() => openUserDetail(userRow.id)}>
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
            <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <>
          <header className="admin-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                <h1 style={{ margin: 0, fontSize: "28px" }}>Chi tiết tài khoản</h1>
              </div>
              <p style={{ margin: 0 }}>Xem hồ sơ cá nhân, tiến trình check-in địa danh, lịch sử giao dịch và cập nhật thông tin hỗ trợ.</p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" onClick={saveProfile} disabled={saving} style={{ background: "#052c24", color: "#ffffff", border: 0, borderRadius: "6px", padding: "8px 16px", fontWeight: "700", cursor: "pointer" }}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button type="button" className="admin-secondary-button" onClick={closeUserDetail}>
                Quay lại
              </button>
            </div>
          </header>

          <section className="admin-editor" style={{ width: "100%" }}>
            {!selectedUser ? (
              loadingDetails ? <EmptyState message="Đang tải chi tiết người dùng..." /> : <EmptyState message="Không tìm thấy người dùng." />
            ) : (
              <div style={{ display: "grid", gap: "24px" }}>
                <div className="admin-editor-head" style={{ borderBottom: "1px solid rgba(5, 52, 44, 0.08)", paddingBottom: "16px", marginBottom: 0 }}>
                  <div>
                    <h2 style={{ fontSize: "22px", margin: 0, color: "#052c24", fontWeight: "800" }}>{getUserTitle(selectedUser)}</h2>
                    <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>{selectedUser.email || selectedUser.id}</p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <StatusBadge status={deriveUserStatus(selectedUser)} />
                  </div>
                </div>

                {message ? <p className="admin-editor-message">{message}</p> : null}

                <div className="admin-user-stats" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
                  <div className="admin-user-stat-card">
                    <span>Check-in</span>
                    <strong>{summary.completedStops}/6</strong>
                    <small>Trạm đã đóng dấu</small>
                  </div>
                  <div className="admin-user-stat-card">
                    <span>Photobooth</span>
                    <strong>{summary.photoboothCount}</strong>
                    <small>Ảnh đã lưu</small>
                  </div>
                  <div className="admin-user-stat-card">
                    <span>AR Sessions</span>
                    <strong>{summary.arCount}</strong>
                    <small>Lượt trải nghiệm</small>
                  </div>
                  <div className="admin-user-stat-card">
                    <span>Giỏ hàng</span>
                    <strong>{summary.cartCount}</strong>
                    <small>Sản phẩm chờ</small>
                  </div>
                  <div className="admin-user-stat-card">
                    <span>Đơn hàng</span>
                    <strong>{summary.orderCount}</strong>
                    <small>Đơn đã tạo</small>
                  </div>
                </div>

                <div className="admin-user-section-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <section className="admin-user-section">
                    <div className="admin-user-section-head" style={{ marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>Thông tin tài khoản</h3>
                    </div>

                    <div className="admin-user-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <label>
                        Tên hiển thị (Display Name)
                        <input value={draft?.displayName || ""} onChange={(event) => setDraftField("displayName", event.target.value)} />
                      </label>
                      <label>
                        Họ và tên (Full Name)
                        <input value={draft?.fullName || ""} onChange={(event) => setDraftField("fullName", event.target.value)} />
                      </label>
                      <label>
                        Email liên hệ
                        <input value={draft?.email || ""} onChange={(event) => setDraftField("email", event.target.value)} />
                      </label>
                      <label>
                        Số điện thoại
                        <input value={draft?.phone || ""} onChange={(event) => setDraftField("phone", event.target.value)} />
                      </label>
                      <label>
                        Ảnh đại diện (Avatar URL)
                        <input value={draft?.photoURL || ""} onChange={(event) => setDraftField("photoURL", event.target.value)} />
                      </label>
                      <label>
                        Trạng thái tài khoản
                        <select value={draft?.status || "inactive"} onChange={(event) => setDraftField("status", event.target.value)}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="banned">Banned</option>
                        </select>
                      </label>
                      <label style={{ gridColumn: "1 / -1" }}>
                        Trạng thái hỗ trợ (Support Status)
                        <select value={draft?.supportStatus || "none"} onChange={(event) => setDraftField("supportStatus", event.target.value)}>
                          <option value="none">none</option>
                          <option value="open">open</option>
                          <option value="pending">pending</option>
                          <option value="resolved">resolved</option>
                        </select>
                      </label>
                      <label style={{ gridColumn: "1 / -1" }}>
                        Lý do khoá tài khoản (nếu bị Ban)
                        <textarea value={draft?.bannedReason || ""} onChange={(event) => setDraftField("bannedReason", event.target.value)} placeholder="Nhập lý do khoá..." />
                      </label>
                     
                    </div>

                    <div className="admin-user-meta" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "24px" }}>
                      <div><strong>UID người dùng</strong><span>{selectedUser.id}</span></div>
                      <div><strong>Thời gian đăng ký</strong><span>{formatDate(selectedUser.createdAt)}</span></div>
                      <div><strong>Đăng nhập cuối</strong><span>{formatDate(selectedUser.lastLoginAt)}</span></div>
                      <div><strong>Cập nhật ghi chú lúc</strong><span>{formatDate(selectedUser.adminNotesUpdatedAt)}</span></div>
                    </div>
                  </section>

                  <section className="admin-user-section">
                    <div className="admin-user-section-head" style={{ marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>Hộ chiếu & Chứng nhận</h3>
                    </div>

                    <div className="admin-user-meta" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div><strong>Trạng thái Passport</strong><span>{selectedUser.isActivated ? "Đã kích hoạt" : "Chưa kích hoạt"}</span></div>
                      <div><strong>Mã Hộ chiếu (Passport Code)</strong><span>{selectedUser.passportCode || "Không có"}</span></div>
                      <div><strong>Ngày kích hoạt mã</strong><span>{formatDate(activationCodeData?.usedAt)}</span></div>
                      <div><strong>Link Certificate</strong><span>{selectedUser.certificateUrl || "Chưa lưu"}</span></div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                      {selectedUser.certificateUrl ? (
                        <a href={selectedUser.certificateUrl} target="_blank" rel="noreferrer" className="admin-user-link" style={{ background: "#052c24", color: "#ffffff", padding: "8px 16px", borderRadius: "6px", textDecoration: "none", fontSize: "13px", fontWeight: "700" }}>
                          Mở Link Certificate
                        </a>
                      ) : null}

                      {selectedUser.passportCode ? (
                        <a href={`/admin/activation-codes?code=${selectedUser.passportCode}`} className="admin-user-link" style={{ border: "1px solid rgba(5, 52, 44, 0.16)", color: "#052c24", padding: "8px 16px", borderRadius: "6px", textDecoration: "none", fontSize: "13px", fontWeight: "700" }}>
                          Kiểm tra mã Passport liên kết
                        </a>
                      ) : null}
                    </div>

                    <div className="admin-user-cert-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                      {CERTIFICATES.map((certificate) => {
                        const unlocked = summary.completedStops >= certificate.required;
                        return (
                          <article className={`admin-user-cert-card ${unlocked ? "is-unlocked" : ""}`} key={certificate.id}>
                            <strong>{certificate.title}</strong>
                            <span>{certificate.required}/6 trạm</span>
                            <small>{unlocked ? "Đã mở khoá" : "Chưa mở khoá"}</small>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                </div>

                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Timeline hoạt động tổng hợp</h3>
                  </div>
                  {activityTimeline.length === 0 ? (
                    <EmptyState message="Chưa có lịch sử hoạt động." />
                  ) : (
                    <div className="admin-user-list-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                      {activityTimeline.map((item) => (
                        <article className="admin-user-list-card" key={item.id}>
                          <strong>{item.title}</strong>
                          <span>{item.subtitle || item.type}</span>
                          <small>{formatDate(item.createdAt)}</small>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Địa điểm đã Check-in</h3>
                  </div>
                  {(details.journeyProgress || []).length === 0 ? (
                    <EmptyState message="Người dùng chưa thực hiện check-in trạm nào." />
                  ) : (
                    <div className="admin-user-list-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                      {details.journeyProgress.map((item) => (
                        <article className="admin-user-list-card" key={item.id}>
                          <strong>{item.stationName || item.stationId || item.id}</strong>
                          <span>{item.stationId || item.id}</span>
                          <small>Đã check-in: {formatDate(item.checkedInAt || item.updatedAt)}</small>
                          <small>Thiết bị: {item.source || "app"}</small>
                          {item.photoUrl ? <img src={item.photoUrl} alt="" className="admin-user-inline-image" /> : null}
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Hình ảnh Check-in & Photobooth</h3>
                  </div>
                  {checkinPhotos.length === 0 && (details.photoboothPhotos || []).length === 0 ? (
                    <EmptyState message="Người dùng chưa có hình ảnh lưu trữ nào." />
                  ) : (
                    <div className="admin-user-gallery-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
                      {checkinPhotos.map((item) => (
                        <article className="admin-user-gallery-card" key={`checkin-${item.id}`}>
                          <img src={item.photoUrl} alt="" style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px" }} />
                          <strong>{item.stationName || item.stationId || item.id}</strong>
                          <small>Ảnh trạm · {formatDate(item.checkedInAt || item.updatedAt)}</small>
                        </article>
                      ))}
                      {(details.photoboothPhotos || []).map((item) => (
                        <article className="admin-user-gallery-card" key={`photo-${item.id}`}>
                          <img src={item.url} alt="" style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px" }} />
                          <strong>{item.caption || item.stationId || item.id}</strong>
                          <small>Photobooth · {formatDate(item.createdAt)}</small>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <div className="admin-user-section-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
                  <section className="admin-user-section">
                    <div className="admin-user-section-head">
                      <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Đơn hàng mua sắm</h3>
                    </div>
                    {(details.orders || []).length === 0 ? (
                      <EmptyState message="Người dùng chưa có đơn hàng nào." />
                    ) : (
                      <div className="admin-user-list-grid" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {details.orders.map((item) => (
                          <article className="admin-user-list-card" key={item.id}>
                            <strong>{item.orderCode || item.id}</strong>
                            <span>{(item.paymentMethod || "cod").toUpperCase()} · {item.orderStatus || "pending"}</span>
                            <small>Thanh toán: {item.paymentStatus || "pending"}</small>
                            <small>{formatDate(item.createdAt)}</small>
                            <small>Tổng cộng: {formatVnd(item.total || 0)}</small>
                            <a href={`/admin/orders?order=${item.id}`} className="admin-user-link">
                              Xem chi tiết đơn hàng
                            </a>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="admin-user-section">
                    <div className="admin-user-section-head">
                      <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Lịch sử quét AR</h3>
                    </div>
                    {(details.arExperiences || []).length === 0 ? (
                      <EmptyState message="Chưa thực hiện quét mô hình AR nào." />
                    ) : (
                      <div className="admin-user-list-grid" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {details.arExperiences.map((item) => (
                          <article className="admin-user-list-card" key={item.id}>
                            <strong>{item.stationName || item.stationId || item.id}</strong>
                            <span>{item.modelId || "Không rõ nhân vật"}</span>
                            <small>Trạng thái: {item.status || "completed"}</small>
                            <small>{formatDate(item.createdAt)}</small>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="admin-user-section">
                    <div className="admin-user-section-head">
                      <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Giỏ hàng hiện tại</h3>
                    </div>
                    {(details.cart || []).length === 0 ? (
                      <EmptyState message="Giỏ hàng hiện đang trống." />
                    ) : (
                      <div className="admin-user-list-grid" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {details.cart.map((item) => (
                          <article className="admin-user-list-card" key={item.id}>
                            <strong>{item.snapshot?.name || item.slug || item.productId || item.id}</strong>
                            <span>Số lượng: {item.quantity || 0}</span>
                            <small>Đơn giá: {formatVnd(item.snapshot?.price || 0)}</small>
                            <small>{formatDate(item.updatedAt)}</small>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                <details className="admin-json-block">
                  <summary style={{ cursor: "pointer", fontWeight: 700, color: "#0f172a" }}>Xem dữ liệu JSON gốc</summary>
                  <pre>{JSON.stringify({ user: selectedUser, details, activationCodeData }, null, 2)}</pre>
                </details>
              </div>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  );
}
