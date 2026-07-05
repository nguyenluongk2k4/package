"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import AdminLayout from "./AdminLayout";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";

const CODES_PER_PAGE = 10;

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

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

function isValidCodeFormat(value) {
  return /^[A-Z0-9]{2,12}(?:-[A-Z0-9]{2,12}){1,3}$/.test(normalizeCode(value));
}

function isValidPrefix(value) {
  return /^[A-Z0-9]{2,12}$/.test(normalizeCode(value));
}

function randomSegment(length = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function buildGeneratedCode(prefix = "SCD") {
  return `${normalizeCode(prefix) || "SCD"}-${randomSegment()}-${randomSegment()}`;
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
    status === "used"
      ? { background: "#dbeafe", color: "#1d4ed8" }
      : status === "inactive"
        ? { background: "#fee2e2", color: "#b91c1c" }
        : { background: "#dcfce7", color: "#166534" };

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
      {status || "active"}
    </span>
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
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

export default function ActivationCodesManager() {
  const { db } = useFirebaseAuth();
  const [requestedCode, setRequestedCode] = useState("");
  const [codes, setCodes] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCodeId, setSelectedCodeId] = useState("");
  const [selectedCodeIds, setSelectedCodeIds] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState("single");
  const [draft, setDraft] = useState({
    code: "",
    notes: "",
    expiresAt: "",
    status: "active",
  });
  const [bulkDraft, setBulkDraft] = useState({
    prefix: "SCD",
    count: 10,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setRequestedCode(normalizeCode(params.get("code")));
  }, []);

  useEffect(() => {
    if (!db) return;

    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const [codesSnapshot, usersSnapshot] = await Promise.all([
          getDocs(query(collection(db, "activationCodes"), orderBy("createdAt", "desc"))).catch(() => getDocs(collection(db, "activationCodes"))),
          getDocs(collection(db, "users")).catch(() => null),
        ]);

        const rows = codesSnapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() }));
        rows.sort((a, b) => {
          const aDate = toDateValue(a.usedAt || a.createdAt);
          const bDate = toDateValue(b.usedAt || b.createdAt);
          return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
        });

        const nextUsersById = {};
        if (usersSnapshot) {
          usersSnapshot.docs.forEach((userDoc) => {
            nextUsersById[userDoc.id] = { id: userDoc.id, ...userDoc.data() };
          });
        }

        if (!mounted) return;
        setCodes(rows);
        setUsersById(nextUsersById);

        if (requestedCode && rows.some((item) => item.id === requestedCode || item.code === requestedCode)) {
          setSelectedCodeId(requestedCode);
        } else if (!selectedCodeId && rows[0]?.id) {
          setSelectedCodeId(rows[0].id);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [db, requestedCode]);

  const filteredCodes = useMemo(() => {
    return codes.filter((item) => {
      const linkedUser = item.usedBy ? usersById[item.usedBy] : null;
      const haystack = [
        item.id,
        item.code,
        item.usedEmail,
        item.usedBy,
        item.notes,
        linkedUser?.fullName,
        linkedUser?.displayName,
        linkedUser?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || (item.status || "active") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [codes, search, statusFilter, usersById]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCodes.length / CODES_PER_PAGE));
  const paginatedCodes = useMemo(() => {
    const start = (page - 1) * CODES_PER_PAGE;
    return filteredCodes.slice(start, start + CODES_PER_PAGE);
  }, [filteredCodes, page]);

  const selectedCode = useMemo(() => {
    return codes.find((item) => item.id === selectedCodeId || item.code === selectedCodeId) || null;
  }, [codes, selectedCodeId]);

  const selectedUser = useMemo(() => {
    if (!selectedCode?.usedBy) return null;
    return usersById[selectedCode.usedBy] || null;
  }, [selectedCode, usersById]);

  const selectedCodes = useMemo(() => {
    return codes.filter((item) => selectedCodeIds.includes(item.id));
  }, [codes, selectedCodeIds]);

  const stats = useMemo(() => {
    return {
      total: codes.length,
      active: codes.filter((item) => (item.status || "active") === "active").length,
      used: codes.filter((item) => item.status === "used").length,
      inactive: codes.filter((item) => item.status === "inactive").length,
    };
  }, [codes]);

  function patchCode(codeId, partial) {
    setCodes((current) => current.map((item) => (item.id === codeId ? { ...item, ...partial } : item)));
  }

  function patchMany(codeIds, partial) {
    setCodes((current) => current.map((item) => (codeIds.includes(item.id) ? { ...item, ...partial } : item)));
  }

  useEffect(() => {
    if (!db || !selectedCode?.id) {
      setSelectedEvents([]);
      return;
    }

    let mounted = true;

    async function loadEvents() {
      setLoadingEvents(true);
      try {
        let snapshot;
        try {
          snapshot = await getDocs(query(collection(db, "activationCodes", selectedCode.id, "events"), orderBy("createdAt", "desc")));
        } catch {
          try {
            snapshot = await getDocs(collection(db, "activationCodes", selectedCode.id, "events"));
          } catch {
            snapshot = { docs: [] };
          }
        }

        const rows = snapshot.docs
          .map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() }))
          .sort((a, b) => (toDateValue(b.createdAt)?.getTime() || 0) - (toDateValue(a.createdAt)?.getTime() || 0));

        if (!mounted) return;
        setSelectedEvents(rows);
      } finally {
        if (mounted) {
          setLoadingEvents(false);
        }
      }
    }

    loadEvents();

    return () => {
      mounted = false;
    };
  }, [db, selectedCode]);

  function resetDraft() {
    setDraft({
      code: "",
      notes: "",
      expiresAt: "",
      status: "active",
    });
    setBulkDraft({
      prefix: "SCD",
      count: 10,
    });
  }

  function toggleSelectedCode(codeId) {
    setSelectedCodeIds((current) => (current.includes(codeId) ? current.filter((item) => item !== codeId) : [...current, codeId]));
  }

  function toggleSelectAllVisible() {
    const visibleIds = paginatedCodes.map((item) => item.id);
    const allSelected = visibleIds.every((id) => selectedCodeIds.includes(id));
    setSelectedCodeIds((current) => {
      if (allSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }
      return [...new Set([...current, ...visibleIds])];
    });
  }

  async function appendCodeEvent(codeId, action, messageText, metadata = {}) {
    if (!db || !codeId) return;

    const payload = {
      type: "admin_event",
      action,
      message: messageText,
      actorRole: "admin",
      metadata,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "activationCodes", codeId, "events"), payload);

    if (selectedCode?.id === codeId) {
      setSelectedEvents((current) => [
        {
          ...payload,
          id: `local-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
    }
  }

  async function createSingleCode() {
    if (!db) return;
    const code = normalizeCode(draft.code);
    if (!code) {
      setMessage("Can nhap ma kich hoat hop le.");
      return;
    }

    if (!isValidCodeFormat(code)) {
      setMessage("Code phai theo dinh dang nhu SCD-ABCD-1234.");
      return;
    }

    if (codes.some((item) => item.id === code)) {
      setMessage(`Code ${code} da ton tai.`);
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const payload = {
        code,
        status: draft.status || "active",
        notes: draft.notes || "",
        expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : null,
        usedBy: null,
        usedEmail: null,
        usedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "activationCodes", code), payload, { merge: true });
      await appendCodeEvent(code, "code_created", "Admin tao ma kich hoat", {
        status: payload.status,
      });
      setCodes((current) => [{ id: code, ...payload }, ...current.filter((item) => item.id !== code)]);
      setSelectedCodeId(code);
      setIsCreateModalOpen(false);
      resetDraft();
      setMessage(`Da tao/cap nhat ma ${code}.`);
    } catch (error) {
      setMessage(error.message || "Khong the tao ma kich hoat.");
    } finally {
      setSaving(false);
    }
  }

  async function createBulkCodes() {
    if (!db) return;
    const prefix = normalizeCode(bulkDraft.prefix) || "SCD";
    const count = Math.max(1, Math.min(200, Number(bulkDraft.count || 0)));

    if (!isValidPrefix(prefix)) {
      setMessage("Prefix bulk chi duoc gom chu hoa va so, dai 2-12 ky tu.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const generated = [];
      for (let index = 0; index < count; index += 1) {
        let code = buildGeneratedCode(prefix);
        while (generated.some((item) => item.id === code) || codes.some((item) => item.id === code)) {
          code = buildGeneratedCode(prefix);
        }

        const payload = {
          code,
          status: "active",
          notes: "Generated from admin",
          expiresAt: null,
          usedBy: null,
          usedEmail: null,
          usedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, "activationCodes", code), payload, { merge: true });
        await appendCodeEvent(code, "code_created_bulk", "Admin tao ma kich hoat tu lo bulk", {
          prefix,
        });
        generated.push({ id: code, ...payload });
      }

      setCodes((current) => [...generated, ...current.filter((item) => !generated.some((code) => code.id === item.id))]);
      setSelectedCodeId(generated[0]?.id || "");
      setIsCreateModalOpen(false);
      setSelectedCodeIds([]);
      resetDraft();
      setMessage(`Da tao ${generated.length} ma moi voi prefix ${prefix}.`);
    } catch (error) {
      setMessage(error.message || "Khong the tao lo ma kich hoat.");
    } finally {
      setSaving(false);
    }
  }

  async function resetCode(item) {
    if (!db || !item?.id) return;
    const linkedUser = item.usedBy ? usersById[item.usedBy] : null;
    const isRiskyReset = Boolean(item.usedBy || linkedUser?.passportCode === item.id);

    if (typeof window !== "undefined" && isRiskyReset) {
      const confirmed = window.confirm(`Code ${item.id} dang gan voi user. Van reset ma nay?`);
      if (!confirmed) {
        return;
      }
    }

    setSaving(true);
    setMessage("");
    try {
      const payload = {
        status: "active",
        usedBy: null,
        usedEmail: null,
        usedAt: null,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, "activationCodes", item.id), payload);
      await appendCodeEvent(item.id, "code_reset", "Admin reset ma kich hoat ve active", {
        previousStatus: item.status || "active",
        previousUsedBy: item.usedBy || "",
      });
      patchCode(item.id, payload);
      setMessage(`Da reset ma ${item.id}.`);
    } catch (error) {
      setMessage(error.message || "Khong the reset ma.");
    } finally {
      setSaving(false);
    }
  }

  async function updateCodeStatus(item, nextStatus) {
    if (!db || !item?.id) return;
    if (typeof window !== "undefined" && nextStatus === "inactive") {
      const confirmed = window.confirm(`Xac nhan vo hieu hoa code ${item.id}?`);
      if (!confirmed) {
        return;
      }
    }

    setSaving(true);
    setMessage("");
    try {
      const payload = {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, "activationCodes", item.id), payload);
      await appendCodeEvent(item.id, "status_updated", `Admin cap nhat code sang ${nextStatus}`, {
        from: item.status || "active",
        to: nextStatus,
      });
      patchCode(item.id, payload);
      setMessage(`Da cap nhat ${item.id} sang ${nextStatus}.`);
    } catch (error) {
      setMessage(error.message || "Khong the cap nhat trang thai ma.");
    } finally {
      setSaving(false);
    }
  }

  async function bulkResetSelected() {
    if (!db || selectedCodes.length === 0) return;
    const riskyCodes = selectedCodes.filter((item) => item.usedBy);
    if (typeof window !== "undefined" && riskyCodes.length > 0) {
      const confirmed = window.confirm(`Co ${riskyCodes.length} code dang gan voi user. Van bulk reset?`);
      if (!confirmed) {
        return;
      }
    }

    setSaving(true);
    setMessage("");
    try {
      await Promise.all(
        selectedCodes.map((item) =>
          updateDoc(doc(db, "activationCodes", item.id), {
            status: "active",
            usedBy: null,
            usedEmail: null,
            usedAt: null,
            updatedAt: serverTimestamp(),
          })
        )
      );

      await Promise.all(
        selectedCodes.map((item) =>
          appendCodeEvent(item.id, "bulk_reset", "Admin bulk reset ma kich hoat", {
            previousStatus: item.status || "active",
            previousUsedBy: item.usedBy || "",
          })
        )
      );

      patchMany(selectedCodes.map((item) => item.id), {
        status: "active",
        usedBy: null,
        usedEmail: null,
        usedAt: null,
      });
      setMessage(`Da reset ${selectedCodes.length} ma.`);
    } catch (error) {
      setMessage(error.message || "Khong the bulk reset.");
    } finally {
      setSaving(false);
    }
  }

  async function bulkUpdateStatus(nextStatus) {
    if (!db || selectedCodes.length === 0) return;
    if (typeof window !== "undefined" && nextStatus === "inactive") {
      const confirmed = window.confirm(`Xac nhan bulk doi ${selectedCodes.length} code sang inactive?`);
      if (!confirmed) {
        return;
      }
    }

    setSaving(true);
    setMessage("");
    try {
      await Promise.all(
        selectedCodes.map((item) =>
          updateDoc(doc(db, "activationCodes", item.id), {
            status: nextStatus,
            updatedAt: serverTimestamp(),
          })
        )
      );

      await Promise.all(
        selectedCodes.map((item) =>
          appendCodeEvent(item.id, "bulk_status_updated", `Admin bulk doi code sang ${nextStatus}`, {
            from: item.status || "active",
            to: nextStatus,
          })
        )
      );

      patchMany(selectedCodes.map((item) => item.id), { status: nextStatus });
      setMessage(`Da cap nhat ${selectedCodes.length} ma sang ${nextStatus}.`);
    } catch (error) {
      setMessage(error.message || "Khong the cap nhat bulk status.");
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const rows = (selectedCodeIds.length ? selectedCodes : filteredCodes).map((item) => {
      const linkedUser = item.usedBy ? usersById[item.usedBy] : null;
      return [
        item.id,
        item.code || item.id,
        item.status || "active",
        item.usedEmail || "",
        item.usedBy || "",
        linkedUser?.fullName || linkedUser?.displayName || "",
        linkedUser?.email || "",
        formatDate(item.usedAt),
        formatDate(item.expiresAt),
        item.notes || "",
      ];
    });

    const csv = [
      ["id", "code", "status", "usedEmail", "usedBy", "linkedUserName", "linkedUserEmail", "usedAt", "expiresAt", "notes"],
      ...rows,
    ]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `activation-codes-${Date.now()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setMessage(`Da export ${selectedCodeIds.length ? selectedCodeIds.length : filteredCodes.length} dong CSV.`);
  }

  const allVisibleSelected = paginatedCodes.length > 0 && paginatedCodes.every((item) => selectedCodeIds.includes(item.id));

  return (
    <AdminLayout resource="activationCodes">
      <header className="admin-heading">
        <h1>Quan ly ma kich hoat</h1>
        <p>Hien thi du lieu activationCodes tu Firebase, ho tro them ma, tao loat ma, bulk thao tac, export CSV va doi chieu ma voi user da su dung.</p>
      </header>

      <div className="admin-toolbar" style={{ flexWrap: "wrap" }}>
        <div className="admin-search-wrapper">
          <img src="/assets/ic-search.svg" className="admin-search-icon" alt="" />
          <input placeholder="Tim theo code, email, uid, ten user..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tat ca trang thai</option>
          <option value="active">Active</option>
          <option value="used">Used</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="button" onClick={() => { resetDraft(); setCreateMode("single"); setIsCreateModalOpen(true); }} disabled={saving}>
          Tao ma moi
        </button>
      </div>

      <div className="admin-user-stats" style={{ marginBottom: "24px" }}>
        <div className="admin-user-stat-card">
          <span>Total</span>
          <strong>{stats.total}</strong>
          <small>Tat ca ma</small>
        </div>
        <div className="admin-user-stat-card">
          <span>Active</span>
          <strong>{stats.active}</strong>
          <small>San sang kich hoat</small>
        </div>
        <div className="admin-user-stat-card">
          <span>Used</span>
          <strong>{stats.used}</strong>
          <small>Da duoc su dung</small>
        </div>
        <div className="admin-user-stat-card">
          <span>Inactive</span>
          <strong>{stats.inactive}</strong>
          <small>Da vo hieu hoa</small>
        </div>
      </div>

      <div
        style={{
          marginBottom: "24px",
          padding: "16px 18px",
          borderRadius: "16px",
          background: "#f8fafc",
          border: "1px solid rgba(5, 52, 44, 0.08)",
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <button type="button" className="admin-secondary-button" onClick={toggleSelectAllVisible}>
          {allVisibleSelected ? "Bo chon trang hien tai" : "Chon tat ca trang hien tai"}
        </button>
        <button type="button" className="admin-secondary-button" onClick={bulkResetSelected} disabled={saving || selectedCodeIds.length === 0}>
          Bulk reset
        </button>
        <button type="button" className="admin-secondary-button" onClick={() => bulkUpdateStatus("inactive")} disabled={saving || selectedCodeIds.length === 0}>
          Bulk disable
        </button>
        <button type="button" className="admin-secondary-button" onClick={() => bulkUpdateStatus("active")} disabled={saving || selectedCodeIds.length === 0}>
          Bulk active
        </button>
        <button type="button" className="admin-secondary-button" onClick={exportCsv} disabled={filteredCodes.length === 0}>
          Export CSV
        </button>
        <span style={{ color: "#64748b", fontSize: "13px", fontWeight: 700 }}>
          Dang chon {selectedCodeIds.length} ma
        </span>
      </div>

      <div className="admin-manager-grid">
        <div className="admin-table">
          {loading ? <EmptyState message="Dang tai danh sach activation code..." /> : null}
          {!loading && filteredCodes.length === 0 ? <EmptyState message="Khong tim thay ma kich hoat phu hop." /> : null}
          {paginatedCodes.map((item) => {
            const linkedUser = item.usedBy ? usersById[item.usedBy] : null;
            const linkedLabel = linkedUser?.fullName || linkedUser?.displayName || linkedUser?.email || item.usedEmail || item.usedBy || "Chua gan cho user";

            return (
              <article
                className={`admin-table-item-card ${selectedCodeId === item.id ? "active" : ""}`}
                key={item.id}
                style={{ gridTemplateColumns: "auto auto 1fr" }}
              >
                <label style={{ display: "grid", placeItems: "center", paddingLeft: "12px" }}>
                  <input type="checkbox" checked={selectedCodeIds.includes(item.id)} onChange={() => toggleSelectedCode(item.id)} />
                </label>
                <div className="admin-table-item-thumb-placeholder">#</div>
                <div className="admin-table-item-info">
                  <button type="button" onClick={() => setSelectedCodeId(item.id)}>
                    <strong>{item.code || item.id}</strong>
                    <span>{linkedLabel}</span>
                  </button>
                  <small>{`${(item.status || "active").toUpperCase()} · ${formatDate(item.usedAt || item.createdAt)}`}</small>
                </div>
              </article>
            );
          })}
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        <section className="admin-editor">
          <div className="admin-editor-head">
            <h2>{selectedCode ? selectedCode.code || selectedCode.id : "Tao / quan ly ma"}</h2>
            {selectedCode ? <StatusBadge status={selectedCode.status || "active"} /> : null}
          </div>

          {message ? <p className="admin-editor-message">{message}</p> : null}

          <section className="admin-user-section">
            <div className="admin-user-section-head">
              <h3>Thong tin ma</h3>
            </div>
            {!selectedCode ? (
              <EmptyState message="Chon mot code de xem chi tiet va thao tac." />
            ) : (
              <>
                <div className="admin-user-meta">
                  <div><strong>Code</strong><span>{selectedCode.code || selectedCode.id}</span></div>
                  <div><strong>Status</strong><span>{selectedCode.status || "active"}</span></div>
                  <div><strong>Used email</strong><span>{selectedCode.usedEmail || "Chua co"}</span></div>
                  <div><strong>Used by</strong><span>{selectedCode.usedBy || "Chua co"}</span></div>
                  <div><strong>Used at</strong><span>{formatDate(selectedCode.usedAt)}</span></div>
                  <div><strong>Created at</strong><span>{formatDate(selectedCode.createdAt)}</span></div>
                  <div><strong>Expires at</strong><span>{formatDate(selectedCode.expiresAt)}</span></div>
                  <div><strong>Notes</strong><span>{selectedCode.notes || "Khong co"}</span></div>
                </div>

                {selectedUser ? (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px",
                      borderRadius: "14px",
                      background: "#f8fafc",
                      border: "1px solid rgba(5, 52, 44, 0.08)",
                      display: "grid",
                      gap: "8px",
                    }}
                  >
                    <strong style={{ color: "#0f172a" }}>User lien ket</strong>
                    <span>{selectedUser.fullName || selectedUser.displayName || selectedUser.email || selectedUser.id}</span>
                    <span style={{ color: "#64748b", fontSize: "13px" }}>{selectedUser.email || selectedUser.id}</span>
                    <a href={`/admin/users?uid=${selectedUser.id}`} className="admin-user-link">
                      Mo user detail
                    </a>
                  </div>
                ) : null}

                <div className="admin-form-actions" style={{ margin: "16px 0 0" }}>
                  <button type="button" onClick={() => resetCode(selectedCode)} disabled={saving}>
                    Reset code
                  </button>
                  <button type="button" onClick={() => updateCodeStatus(selectedCode, "inactive")} className="admin-secondary-button" disabled={saving || selectedCode.status === "inactive"}>
                    Disable
                  </button>
                  <button type="button" onClick={() => updateCodeStatus(selectedCode, "active")} className="admin-secondary-button" disabled={saving || (selectedCode.status || "active") === "active"}>
                    Active lai
                  </button>
                </div>
              </>
            )}
          </section>
        </section>
      </div>

      {isCreateModalOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.42)",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            zIndex: 60,
          }}
          onClick={() => !saving && setIsCreateModalOpen(false)}
        >
          <div
            style={{
              width: "min(720px, 100%)",
              maxHeight: "min(88vh, 920px)",
              overflow: "auto",
              background: "#ffffff",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 30px 90px rgba(15, 23, 42, 0.18)",
              display: "grid",
              gap: "18px",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-editor-head">
              <div>
                <h2>{createMode === "single" ? "Tao ma kich hoat moi" : "Tao lo ma kich hoat"}</h2>
                <p>{createMode === "single" ? "Nhap thong tin cho 1 ma kich hoat." : "Sinh hang loat ma theo prefix va so luong."}</p>
              </div>
              <div className="admin-form-actions" style={{ margin: 0 }}>
                <button type="button" onClick={() => setCreateMode("single")} disabled={createMode === "single"}>
                  Single
                </button>
                <button type="button" className="admin-secondary-button" onClick={() => setCreateMode("bulk")} disabled={createMode === "bulk"}>
                  Bulk
                </button>
              </div>
            </div>

            {createMode === "single" ? (
              <div className="admin-user-form-grid">
                <label>
                  Code
                  <input value={draft.code} onChange={(event) => setDraft((current) => ({ ...current, code: normalizeCode(event.target.value) }))} placeholder="SCD-ABCD-1234" />
                </label>
                <label>
                  Status
                  <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                  Notes
                  <textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                  Expires at
                  <input type="datetime-local" value={draft.expiresAt} onChange={(event) => setDraft((current) => ({ ...current, expiresAt: event.target.value }))} />
                </label>
              </div>
            ) : (
              <div className="admin-user-form-grid">
                <label>
                  Prefix
                  <input value={bulkDraft.prefix} onChange={(event) => setBulkDraft((current) => ({ ...current, prefix: normalizeCode(event.target.value) }))} />
                </label>
                <label>
                  Count
                  <input type="number" min="1" max="200" value={bulkDraft.count} onChange={(event) => setBulkDraft((current) => ({ ...current, count: event.target.value }))} />
                </label>
              </div>
            )}

            <div className="admin-form-actions" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="admin-secondary-button" onClick={() => setIsCreateModalOpen(false)} disabled={saving}>
                Huy
              </button>
              <button type="button" onClick={() => (createMode === "single" ? createSingleCode() : createBulkCodes())} disabled={saving}>
                {saving ? "Dang xu ly..." : createMode === "single" ? "Tao code" : "Tao lo ma"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
