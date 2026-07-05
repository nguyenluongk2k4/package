"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import AdminLayout from "./AdminLayout";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";
import { archiveDocument, uploadAdminFile, upsertDocument } from "../../lib/firebase/catalog";
import { createId } from "./adminData";

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
    status === "published" || status === "active"
      ? { background: "#dcfce7", color: "#166534" }
      : status === "archived"
        ? { background: "#fee2e2", color: "#b91c1c" }
        : { background: "#fef3c7", color: "#92400e" };

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
      {status || "draft"}
    </span>
  );
}

function parseJsonInput(value, fallback = []) {
  if (!String(value || "").trim()) return fallback;
  return JSON.parse(value);
}

function stringifyJson(value) {
  return JSON.stringify(value || [], null, 2);
}

function normalizeAnimations(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildWarnings(item) {
  const warnings = [];
  if (!item.glbUrl) warnings.push("Thieu file GLB");
  if (!item.usdzUrl) warnings.push("Thieu file USDZ");
  if (!item.posterUrl) warnings.push("Thieu poster");
  if (!item.defaultAnimation) warnings.push("Chua chon default animation");
  return warnings;
}

const EMPTY_CHARACTER = {
  name: "",
  slug: "",
  glbUrl: "",
  usdzUrl: "",
  posterUrl: "",
  animations: [],
  defaultAnimation: "",
  voiceText: "",
  subtitles: [],
  isDefault: false,
  status: "draft",
};

export default function ArCharactersManager() {
  const { db } = useFirebaseAuth();
  const [characters, setCharacters] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState(EMPTY_CHARACTER);
  const [jsonDraft, setJsonDraft] = useState({ subtitles: "[]" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!db) return;

    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const [characterSnapshot, stationSnapshot] = await Promise.all([
          getDocs(query(collection(db, "arCharacters"), orderBy("name"))).catch(() => getDocs(collection(db, "arCharacters"))),
          getDocs(query(collection(db, "stations"), orderBy("sortOrder"))).catch(() => getDocs(collection(db, "stations"))),
        ]);

        if (!mounted) return;

        setCharacters(characterSnapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() })));
        setStations(stationSnapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() })));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [db, message]);

  const filteredCharacters = useMemo(() => {
    return characters.filter((item) => {
      const haystack = [
        item.id,
        item.name,
        item.glbUrl,
        item.usdzUrl,
        item.defaultAnimation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || (item.status || "draft") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [characters, search, statusFilter]);

  const selectedCharacter = useMemo(() => {
    return characters.find((item) => item.id === selectedId) || null;
  }, [characters, selectedId]);

  const selectedCharacterUsage = useMemo(() => {
    if (!selectedCharacter) return [];
    return stations.filter((station) => station.arGuide?.modelId === selectedCharacter.id);
  }, [selectedCharacter, stations]);

  const fallbackStations = useMemo(() => {
    return stations.filter((station) => !station.arGuide?.modelId);
  }, [stations]);

  const stats = useMemo(() => {
    return {
      total: characters.length,
      active: characters.filter((item) => (item.status || "draft") === "active" || item.status === "published").length,
      defaultCount: characters.filter((item) => item.isDefault).length,
      missingAssets: characters.filter((item) => buildWarnings(item).length > 0).length,
    };
  }, [characters]);

  function createNew() {
    setSelectedId("");
    setDraft(EMPTY_CHARACTER);
    setJsonDraft({ subtitles: "[]" });
    setMessage("");
  }

  function edit(item) {
    setSelectedId(item.id);
    setDraft({
      ...EMPTY_CHARACTER,
      ...item,
      animations: Array.isArray(item.animations) ? item.animations : [],
      subtitles: Array.isArray(item.subtitles) ? item.subtitles : [],
    });
    setJsonDraft({
      subtitles: stringifyJson(item.subtitles),
    });
    setMessage("");
  }

  function setField(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  async function uploadField(field, file) {
    if (!file) return;
    const baseId = selectedId || createId(draft.slug || draft.name || Date.now());
    const url = await uploadAdminFile(`arCharacters/${baseId}/${field}/${file.name}`, file);
    setField(field, url);
    setMessage(`Da upload ${field}. Bam Luu de ghi vao Firestore.`);
  }

  async function save(event) {
    event.preventDefault();
    if (!db) return;

    setSaving(true);
    setMessage("");

    try {
      const id = selectedId || createId(draft.slug || draft.name);
      if (!id || !draft.name.trim()) {
        throw new Error("Can nhap ten nhan vat hop le.");
      }

      const payload = {
        ...draft,
        slug: draft.slug || id,
        animations: normalizeAnimations(draft.animations),
        subtitles: parseJsonInput(jsonDraft.subtitles, []),
        status: draft.status || "draft",
        updatedAt: serverTimestamp(),
      };

      if (payload.isDefault) {
        const defaults = await getDocs(query(collection(db, "arCharacters"), where("isDefault", "==", true)));
        await Promise.all(
          defaults.docs
            .filter((itemDoc) => itemDoc.id !== id)
            .map((itemDoc) => setDoc(doc(db, "arCharacters", itemDoc.id), { isDefault: false }, { merge: true }))
        );
      }

      await upsertDocument("arCharacters", id, payload);
      setSelectedId(id);
      setMessage("Da luu nhan vat AR.");
    } catch (error) {
      setMessage(error.message || "Khong the luu nhan vat AR.");
    } finally {
      setSaving(false);
    }
  }

  async function archiveCharacter() {
    if (!selectedId) return;
    if (!window.confirm("Ban co chac chan muon luu tru nhan vat nay khong?")) return;

    await archiveDocument("arCharacters", selectedId);
    setMessage("Da luu tru nhan vat AR.");
  }

  return (
    <AdminLayout resource="arCharacters">
      <header className="admin-heading">
        <h1>Quan ly nhan vat AR</h1>
        <p>Quan ly asset GLB/USDZ/poster, danh dau nhan vat mac dinh va xem nguoc station nao dang dung tung nhan vat.</p>
      </header>

      <div className="admin-toolbar" style={{ flexWrap: "wrap" }}>
        <div className="admin-search-wrapper">
          <img src="/assets/ic-search.svg" className="admin-search-icon" alt="" />
          <input placeholder="Tim theo ten, id, asset URL..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tat ca trang thai</option>
          <option value="active">Active</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <button type="button" onClick={createNew}>
          Tao nhan vat moi
        </button>
      </div>

      <div className="admin-user-stats" style={{ marginBottom: "24px" }}>
        <div className="admin-user-stat-card">
          <span>Total</span>
          <strong>{stats.total}</strong>
          <small>Tat ca nhan vat</small>
        </div>
        <div className="admin-user-stat-card">
          <span>Active</span>
          <strong>{stats.active}</strong>
          <small>San sang cho public AR</small>
        </div>
        <div className="admin-user-stat-card">
          <span>Default</span>
          <strong>{stats.defaultCount}</strong>
          <small>Fallback character</small>
        </div>
        <div className="admin-user-stat-card">
          <span>Missing assets</span>
          <strong>{stats.missingAssets}</strong>
          <small>Can bo sung GLB/USDZ/poster</small>
        </div>
      </div>

      <div className="admin-manager-grid">
        <div className="admin-table">
          {loading ? <EmptyState message="Dang tai danh sach nhan vat AR..." /> : null}
          {!loading && filteredCharacters.length === 0 ? <EmptyState message="Chua co nhan vat AR phu hop." /> : null}
          {filteredCharacters.map((item) => {
            const warnings = buildWarnings(item);
            const usageCount = stations.filter((station) => station.arGuide?.modelId === item.id).length;

            return (
              <article className={`admin-table-item-card ${selectedId === item.id ? "active" : ""}`} key={item.id}>
                {item.posterUrl ? (
                  <img src={item.posterUrl} className="admin-table-item-thumb" alt="" />
                ) : (
                  <div className="admin-table-item-thumb-placeholder">AR</div>
                )}
                <div className="admin-table-item-info">
                  <button type="button" onClick={() => edit(item)}>
                    <strong>{item.name || item.id}</strong>
                    <span>{item.defaultAnimation || "Chua co default animation"}</span>
                  </button>
                  <small>
                    {(item.isDefault ? "DEFAULT · " : "") + `${usageCount} station · ${warnings.length} canh bao`}
                  </small>
                </div>
              </article>
            );
          })}
        </div>

        <form className="admin-editor" onSubmit={save}>
          <div className="admin-editor-head">
            <div>
              <h2>{selectedId ? "Chinh sua nhan vat AR" : "Tao moi nhan vat AR"}</h2>
              {message ? <p className="admin-editor-message">{message}</p> : null}
            </div>
            <div className="admin-form-actions" style={{ borderTop: "none", marginTop: 0, paddingTop: 0 }}>
              <button type="submit" disabled={saving}>
                {saving ? "Dang luu..." : "Luu"}
              </button>
              <button type="button" onClick={createNew} className="admin-secondary-button">
                Huy bo
              </button>
              {selectedId ? (
                <button type="button" onClick={archiveCharacter} className="admin-secondary-button">
                  Luu tru
                </button>
              ) : null}
            </div>
          </div>

          <div style={{ display: "grid", gap: "20px" }}>
            <div className="admin-user-section-grid">
              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>Thong tin co ban</h3>
                </div>
                <div className="admin-user-form-grid">
                  <label>
                    Ten nhan vat
                    <input value={draft.name} onChange={(event) => setField("name", event.target.value)} placeholder="Vi du: Nibi Guide" />
                  </label>
                  <label>
                    Slug
                    <input value={draft.slug || ""} onChange={(event) => setField("slug", event.target.value)} placeholder="nibi-guide" />
                  </label>
                  <label>
                    Trang thai
                    <select value={draft.status || "draft"} onChange={(event) => setField("status", event.target.value)}>
                      <option value="draft">draft</option>
                      <option value="active">active</option>
                      <option value="published">published</option>
                      <option value="archived">archived</option>
                    </select>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "28px" }}>
                    <input type="checkbox" checked={Boolean(draft.isDefault)} onChange={(event) => setField("isDefault", event.target.checked)} />
                    <span>Dat lam nhan vat mac dinh</span>
                  </label>
                  <label style={{ gridColumn: "1 / -1" }}>
                    Default animation
                    <input value={draft.defaultAnimation || ""} onChange={(event) => setField("defaultAnimation", event.target.value)} placeholder="Idle / Wave / Greeting..." />
                  </label>
                  <label style={{ gridColumn: "1 / -1" }}>
                    Animations (phan tach bang dau phay)
                    <input value={Array.isArray(draft.animations) ? draft.animations.join(", ") : draft.animations || ""} onChange={(event) => setField("animations", event.target.value)} placeholder="Idle, Wave, Greeting" />
                  </label>
                </div>
              </section>

              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>Asset status</h3>
                  <StatusBadge status={draft.status || "draft"} />
                </div>
                <div style={{ display: "grid", gap: "10px" }}>
                  {buildWarnings(draft).length === 0 ? (
                    <div style={{ padding: "14px", borderRadius: "14px", background: "#ecfdf5", color: "#166534", fontWeight: 700 }}>
                      Asset pack dang day du cho GLB/USDZ/poster.
                    </div>
                  ) : (
                    buildWarnings(draft).map((item) => (
                      <div key={item} style={{ padding: "14px", borderRadius: "14px", background: "#fff7ed", color: "#9a3412", fontWeight: 700 }}>
                        {item}
                      </div>
                    ))
                  )}
                  <div style={{ padding: "14px", borderRadius: "14px", background: "#f8fafc", color: "#475569" }}>
                    Cap nhat lan cuoi: {formatDate(selectedCharacter?.updatedAt)}
                  </div>
                  {draft.isDefault ? (
                    <div style={{ padding: "14px", borderRadius: "14px", background: "#eff6ff", color: "#1d4ed8", fontWeight: 700 }}>
                      Character nay dang la fallback cho {fallbackStations.length} station chua gan modelId rieng.
                    </div>
                  ) : null}
                </div>
              </section>
            </div>

            <div className="admin-user-section-grid">
              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>3D assets</h3>
                </div>
                <div className="admin-user-form-grid">
                  <label>
                    GLB URL
                    <input value={draft.glbUrl || ""} onChange={(event) => setField("glbUrl", event.target.value)} placeholder="/ar/guide.glb" />
                  </label>
                  <label>
                    Upload GLB
                    <input type="file" accept=".glb,model/gltf-binary" onChange={(event) => uploadField("glbUrl", event.target.files?.[0])} />
                  </label>
                  <label>
                    USDZ URL
                    <input value={draft.usdzUrl || ""} onChange={(event) => setField("usdzUrl", event.target.value)} placeholder="/ar/guide.usdz" />
                  </label>
                  <label>
                    Upload USDZ
                    <input type="file" accept=".usdz,model/vnd.usdz+zip" onChange={(event) => uploadField("usdzUrl", event.target.files?.[0])} />
                  </label>
                  <label>
                    Poster URL
                    <input value={draft.posterUrl || ""} onChange={(event) => setField("posterUrl", event.target.value)} placeholder="/ar/poster.jpg" />
                  </label>
                  <label>
                    Upload poster
                    <input type="file" accept="image/*" onChange={(event) => uploadField("posterUrl", event.target.files?.[0])} />
                  </label>
                </div>
              </section>

              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>Preview</h3>
                </div>
                {draft.glbUrl ? (
                  <model-viewer
                    src={draft.glbUrl}
                    poster={draft.posterUrl || undefined}
                    camera-controls
                    auto-rotate
                    style={{ width: "100%", height: "300px", background: "#f1f5f9", borderRadius: "16px" }}
                  />
                ) : draft.posterUrl ? (
                  <img src={draft.posterUrl} alt={draft.name || "Poster"} style={{ width: "100%", height: "300px", objectFit: "cover", borderRadius: "16px" }} />
                ) : (
                  <EmptyState message="Them GLB hoac poster de xem preview." />
                )}
              </section>
            </div>

            <div className="admin-user-section-grid">
              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>Voice va subtitles</h3>
                </div>
                <div className="admin-user-form-grid">
                  <label style={{ gridColumn: "1 / -1" }}>
                    Voice text
                    <textarea value={draft.voiceText || ""} onChange={(event) => setField("voiceText", event.target.value)} placeholder="Noi dung loi thoai cua nhan vat..." />
                  </label>
                  <label style={{ gridColumn: "1 / -1" }}>
                    Subtitles JSON array
                    <textarea value={jsonDraft.subtitles} onChange={(event) => setJsonDraft((current) => ({ ...current, subtitles: event.target.value }))} placeholder='["Xin chao", "Moi ban den ..."]' />
                  </label>
                </div>
              </section>

              <section className="admin-user-section">
                <div className="admin-user-section-head">
                  <h3>Station mapping</h3>
                  <span>{selectedCharacterUsage.length} station</span>
                </div>
                {!selectedId ? (
                  <EmptyState message="Luu nhan vat de xem station mapping." />
                ) : selectedCharacterUsage.length === 0 ? (
                  <EmptyState message="Nhan vat nay chua duoc station nao gan truc tiep." />
                ) : (
                  <div style={{ display: "grid", gap: "12px" }}>
                    {selectedCharacterUsage.map((station) => (
                      <article
                        key={station.id}
                        style={{
                          padding: "14px 16px",
                          borderRadius: "14px",
                          border: "1px solid rgba(5, 52, 44, 0.08)",
                          background: "#fcfffd",
                          display: "grid",
                          gap: "6px",
                        }}
                      >
                        <strong style={{ color: "#052c24" }}>{station.name || station.id}</strong>
                        <span style={{ color: "#64748b", fontSize: "13px" }}>{station.slug || station.id}</span>
                        <a href="/admin/stations" style={{ color: "#104c27", fontWeight: 700, fontSize: "13px" }}>
                          Mo module stations de chinh mapping
                        </a>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
