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
        } else if (!selectedUserId && rows[0]?.id) {
          setSelectedUserId(rows[0].id);
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

  return (
    <AdminLayout resource="users">
      <header className="admin-heading">
        <span>Module 1</span>
        <h1>Quan ly nguoi dung</h1>
        <p>Xem ho so tai khoan, hanh trinh checkin, passport, certificate, photobooth, AR sessions va cap nhat trang thai user.</p>
      </header>

      <div className="admin-toolbar">
        <div className="admin-search-wrapper">
          <img src="/assets/ic-search.svg" className="admin-search-icon" alt="" />
          <input placeholder="Tim theo ten, email, uid, passport code..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tat ca trang thai</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </select>
        <select value={supportStatusFilter} onChange={(event) => setSupportStatusFilter(event.target.value)}>
          <option value="all">Tat ca support</option>
          <option value="none">none</option>
          <option value="open">open</option>
          <option value="pending">pending</option>
          <option value="resolved">resolved</option>
        </select>
        <select value={activationFilter} onChange={(event) => setActivationFilter(event.target.value)}>
          <option value="all">Tat ca passport</option>
          <option value="activated">Da kich hoat</option>
          <option value="notActivated">Chua kich hoat</option>
        </select>
        <select value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)}>
          <option value="all">Tat ca orders</option>
          <option value="hasOrders">Co order</option>
          <option value="noOrders">Chua co order</option>
        </select>
        <button type="button" className="admin-secondary-button" onClick={exportUsersCsv} disabled={filteredUsers.length === 0}>
          Export CSV
        </button>
        <button type="button" onClick={() => selectedUserId && saveProfile()} disabled={!selectedUserId || saving}>
          {saving ? "Dang luu..." : "Luu user"}
        </button>
      </div>

      <div className="admin-manager-grid">
        <div className="admin-table">
          {loadingUsers ? <EmptyState message="Dang tai danh sach user..." /> : null}
          {!loadingUsers && filteredUsers.length === 0 ? <EmptyState message="Khong tim thay user phu hop." /> : null}
          {paginatedUsers.map((userRow) => {
            const status = deriveUserStatus(userRow);
            return (
              <article className={`${selectedUserId === userRow.id ? "active" : ""} admin-table-item-card`} key={userRow.id}>
                {userRow.photoURL ? (
                  <img src={userRow.photoURL} className="admin-table-item-thumb" alt="" />
                ) : (
                  <div className="admin-table-item-thumb-placeholder">
                    {(userRow.displayName || userRow.email || "U").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="admin-table-item-info">
                  <button type="button" onClick={() => setSelectedUserId(userRow.id)}>
                    <strong>{getUserTitle(userRow)}</strong>
                    <span>{userRow.email || userRow.id}</span>
                  </button>
                  <small>
                    {status.toUpperCase()} · {userRow.passportCode ? `Passport ${userRow.passportCode}` : "Chua kich hoat"} · {orderCountsByUser[userRow.id] || 0} order
                  </small>
                </div>
              </article>
            );
          })}
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        <section className="admin-editor">
          {!selectedUser ? (
            loadingDetails ? <EmptyState message="Dang tai chi tiet nguoi dung..." /> : <EmptyState message="Chon mot user de xem chi tiet." />
          ) : (
            <div style={{ display: "grid", gap: "20px" }}>
              <div className="admin-editor-head">
                <div>
                  <h2>{getUserTitle(selectedUser)}</h2>
                  <p>{selectedUser.email || selectedUser.id}</p>
                </div>
                <StatusBadge status={deriveUserStatus(selectedUser)} />
              </div>

              {message ? <p className="admin-editor-message">{message}</p> : null}

              <div className="admin-user-stats">
                <div className="admin-user-stat-card">
                  <span>Check-in</span>
                  <strong>{summary.completedStops}/6</strong>
                  <small>Tram da dong dau</small>
                </div>
                <div className="admin-user-stat-card">
                  <span>Photobooth</span>
                  <strong>{summary.photoboothCount}</strong>
                  <small>Anh da luu</small>
                </div>
                <div className="admin-user-stat-card">
                  <span>AR sessions</span>
                  <strong>{summary.arCount}</strong>
                  <small>Luot AR</small>
                </div>
                <div className="admin-user-stat-card">
                  <span>Cart items</span>
                  <strong>{summary.cartCount}</strong>
                  <small>Dong du lieu gio hang</small>
                </div>
                <div className="admin-user-stat-card">
                  <span>Orders</span>
                  <strong>{summary.orderCount}</strong>
                  <small>Don hang da tao</small>
                </div>
              </div>

              <div className="admin-user-section-grid">
                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3>Thong tin tai khoan</h3>
                    <div className="admin-form-actions" style={{ margin: 0 }}>
                      <button type="button" onClick={saveProfile} disabled={saving}>
                        {saving ? "Dang luu..." : "Luu thay doi"}
                      </button>
                      <button type="button" onClick={() => updateAccountStatus("active")} className="admin-secondary-button" disabled={saving}>
                        Active
                      </button>
                      <button type="button" onClick={() => updateAccountStatus("banned")} className="admin-secondary-button" disabled={saving}>
                        Ban
                      </button>
                    </div>
                  </div>

                  <div className="admin-user-form-grid">
                    <label>
                      Display name
                      <input value={draft?.displayName || ""} onChange={(event) => setDraftField("displayName", event.target.value)} />
                    </label>
                    <label>
                      Full name
                      <input value={draft?.fullName || ""} onChange={(event) => setDraftField("fullName", event.target.value)} />
                    </label>
                    <label>
                      Email
                      <input value={draft?.email || ""} onChange={(event) => setDraftField("email", event.target.value)} />
                    </label>
                    <label>
                      Phone
                      <input value={draft?.phone || ""} onChange={(event) => setDraftField("phone", event.target.value)} />
                    </label>
                    <label>
                      Avatar URL
                      <input value={draft?.photoURL || ""} onChange={(event) => setDraftField("photoURL", event.target.value)} />
                    </label>
                    <label>
                      Status
                      <select value={draft?.status || "inactive"} onChange={(event) => setDraftField("status", event.target.value)}>
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                        <option value="banned">banned</option>
                      </select>
                    </label>
                    <label>
                      Support status
                      <select value={draft?.supportStatus || "none"} onChange={(event) => setDraftField("supportStatus", event.target.value)}>
                        <option value="none">none</option>
                        <option value="open">open</option>
                        <option value="pending">pending</option>
                        <option value="resolved">resolved</option>
                      </select>
                    </label>
                    <label style={{ gridColumn: "1 / -1" }}>
                      Ban reason
                      <textarea value={draft?.bannedReason || ""} onChange={(event) => setDraftField("bannedReason", event.target.value)} />
                    </label>
                    <label style={{ gridColumn: "1 / -1" }}>
                      Admin notes
                      <textarea value={draft?.adminNotes || ""} onChange={(event) => setDraftField("adminNotes", event.target.value)} placeholder="Ghi chu noi bo, yeu cau ho tro, tinh trang xu ly..." />
                    </label>
                  </div>

                  <div className="admin-user-meta">
                    <div><strong>UID</strong><span>{selectedUser.id}</span></div>
                    <div><strong>Created</strong><span>{formatDate(selectedUser.createdAt)}</span></div>
                    <div><strong>Last login</strong><span>{formatDate(selectedUser.lastLoginAt)}</span></div>
                    <div><strong>Activated</strong><span>{selectedUser.isActivated ? formatDate(selectedUser.activatedAt) : "Chua kich hoat"}</span></div>
                    <div><strong>Support status</strong><span>{draft?.supportStatus || "none"}</span></div>
                    <div><strong>Notes updated</strong><span>{formatDate(selectedUser.adminNotesUpdatedAt)}</span></div>
                  </div>
                </section>

                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3>Passport va certificate</h3>
                  </div>

                  <div className="admin-user-meta">
                    <div><strong>Passport status</strong><span>{selectedUser.isActivated ? "Da kich hoat" : "Chua kich hoat"}</span></div>
                    <div><strong>Passport code</strong><span>{selectedUser.passportCode || "Khong co"}</span></div>
                    <div><strong>Code used at</strong><span>{formatDate(activationCodeData?.usedAt)}</span></div>
                    <div><strong>Certificate field</strong><span>{selectedUser.certificateUrl || "Chua luu URL rieng"}</span></div>
                  </div>

                  {selectedUser.certificateUrl ? (
                    <a href={selectedUser.certificateUrl} target="_blank" rel="noreferrer" className="admin-user-link">
                      Mo certificate URL
                    </a>
                  ) : null}

                  {selectedUser.passportCode ? (
                    <a href={`/admin/activation-codes?code=${selectedUser.passportCode}`} className="admin-user-link">
                      Mo activation code lien ket
                    </a>
                  ) : null}

                  <div className="admin-user-cert-grid">
                    {CERTIFICATES.map((certificate) => {
                      const unlocked = summary.completedStops >= certificate.required;
                      return (
                        <article className={`admin-user-cert-card ${unlocked ? "is-unlocked" : ""}`} key={certificate.id}>
                          <strong>{certificate.title}</strong>
                          <span>{certificate.required}/6 tram</span>
                          <small>{unlocked ? "Da mo khoa" : "Chua mo khoa"}</small>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>

              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>Timeline tong hop</h3>
                </div>
                {activityTimeline.length === 0 ? (
                  <EmptyState message="Chua co timeline tong hop." />
                ) : (
                  <div className="admin-user-list-grid">
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
                  <h3>Dia diem da checkin</h3>
                </div>
                {(details.journeyProgress || []).length === 0 ? (
                  <EmptyState message="User nay chua co du lieu checkin." />
                ) : (
                  <div className="admin-user-list-grid">
                    {details.journeyProgress.map((item) => (
                      <article className="admin-user-list-card" key={item.id}>
                        <strong>{item.stationName || item.stationId || item.id}</strong>
                        <span>{item.stationId || item.id}</span>
                        <small>Check-in: {formatDate(item.checkedInAt || item.updatedAt)}</small>
                        <small>Source: {item.source || "app"}</small>
                        {item.photoUrl ? <img src={item.photoUrl} alt="" className="admin-user-inline-image" /> : null}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>Anh checkin va photobooth</h3>
                </div>
                {checkinPhotos.length === 0 && (details.photoboothPhotos || []).length === 0 ? (
                  <EmptyState message="User nay chua co anh checkin hoac photobooth." />
                ) : (
                  <div className="admin-user-gallery-grid">
                    {checkinPhotos.map((item) => (
                      <article className="admin-user-gallery-card" key={`checkin-${item.id}`}>
                        <img src={item.photoUrl} alt="" />
                        <strong>{item.stationName || item.stationId || item.id}</strong>
                        <small>Anh checkin · {formatDate(item.checkedInAt || item.updatedAt)}</small>
                      </article>
                    ))}
                    {(details.photoboothPhotos || []).map((item) => (
                      <article className="admin-user-gallery-card" key={`photo-${item.id}`}>
                        <img src={item.url} alt="" />
                        <strong>{item.caption || item.stationId || item.id}</strong>
                        <small>Photobooth · {formatDate(item.createdAt)}</small>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <div className="admin-user-section-grid">
                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3>Don hang lien quan</h3>
                  </div>
                  {(details.orders || []).length === 0 ? (
                    <EmptyState message="User nay chua co don hang nao." />
                  ) : (
                    <div className="admin-user-list-grid">
                      {details.orders.map((item) => (
                        <article className="admin-user-list-card" key={item.id}>
                          <strong>{item.orderCode || item.id}</strong>
                          <span>{(item.paymentMethod || "cod").toUpperCase()} · {item.orderStatus || "pending"}</span>
                          <small>Thanh toan: {item.paymentStatus || "pending"}</small>
                          <small>{formatDate(item.createdAt)}</small>
                          <small>Tong: {formatVnd(item.total || 0)}</small>
                          <a href={`/admin/orders?order=${item.id}`} className="admin-user-link">
                            Mo order detail
                          </a>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3>AR sessions</h3>
                  </div>
                  {(details.arExperiences || []).length === 0 ? (
                    <EmptyState message="Chua co AR session." />
                  ) : (
                    <div className="admin-user-list-grid">
                      {details.arExperiences.map((item) => (
                        <article className="admin-user-list-card" key={item.id}>
                          <strong>{item.stationName || item.stationId || item.id}</strong>
                          <span>{item.modelId || "Khong ro model"}</span>
                          <small>Status: {item.status || "completed"}</small>
                          <small>{formatDate(item.createdAt)}</small>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="admin-user-section">
                  <div className="admin-user-section-head">
                    <h3>Gio hang hien co</h3>
                  </div>
                  {(details.cart || []).length === 0 ? (
                    <EmptyState message="Chua co du lieu gio hang." />
                  ) : (
                    <div className="admin-user-list-grid">
                      {details.cart.map((item) => (
                        <article className="admin-user-list-card" key={item.id}>
                          <strong>{item.snapshot?.name || item.slug || item.productId || item.id}</strong>
                          <span>So luong: {item.quantity || 0}</span>
                          <small>Gia: {formatVnd(item.snapshot?.price || 0)}</small>
                          <small>{formatDate(item.updatedAt)}</small>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <details className="admin-json-block">
                <summary style={{ cursor: "pointer", fontWeight: 700, color: "#0f172a" }}>View data JSON</summary>
                <pre>{JSON.stringify({ user: selectedUser, details, activationCodeData }, null, 2)}</pre>
              </details>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
