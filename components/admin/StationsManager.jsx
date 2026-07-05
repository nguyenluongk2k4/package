"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import AdminLayout from "./AdminLayout";
import { FileField, JsonField, StatusFields, TextArea, TextField } from "./AdminFormFields";
import { createId, emptyDocs, parseJson, stringifyJson } from "./adminData";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";
import { archiveDocument, uploadAdminFile, upsertDocument } from "../../lib/firebase/catalog";

function getStationImage(station, fallback = "/assets/dia-danh/trang-an/TA1.jpg") {
  return station.heroImage || station.image || station.gallery?.[0] || fallback;
}

function getMapImage(station) {
  return station.mapImage || "/assets/dia-danh/ban-do.png";
}

function normalizeGallery(gallery) {
  return Array.isArray(gallery) ? gallery.map((item) => String(item || "").trim()).filter(Boolean) : [];
}

function chapterValue(item, key, index) {
  if (Array.isArray(item)) return item[index] || "";
  return item?.[key] || "";
}

function toChapterObject(item) {
  return {
    label: chapterValue(item, "label", 0),
    title: chapterValue(item, "title", 1),
    description: chapterValue(item, "description", 2),
  };
}

function StationPreviewImage({ src, alt, uploadLabel, onUpload, children }) {
  return (
    <div className="admin-station-image-preview">
      <img src={src} alt={alt} />
      {onUpload ? (
        <label className="admin-station-preview-upload">
          <input type="file" accept="image/*" onChange={(event) => onUpload(event.target.files?.[0])} />
          <span>{uploadLabel || "Thay đổi ảnh"}</span>
        </label>
      ) : children ? (
        <div>{children}</div>
      ) : null}
    </div>
  );
}

function HistoryEditor({ rows, onChange }) {
  const items = rows?.length ? rows : [""];

  function update(index, value) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function remove(index) {
    const next = items.filter((_, itemIndex) => itemIndex !== index);
    onChange(next.length ? next : [""]);
  }

  return (
    <section className="admin-repeatable-section">
      <header>
        <div>
          <h3>Thông tin lịch sử</h3>
          <p>Mỗi dòng sẽ hiển thị thành một ý trong card lịch sử ngoài app.</p>
        </div>
        <button type="button" onClick={() => onChange([...items, ""])}>
          Thêm ý
        </button>
      </header>
      <div className="admin-repeatable-list">
        {items.map((item, index) => (
          <article className="admin-repeatable-item" key={index}>
            <TextArea label={`Ý lịch sử ${index + 1}`} value={item} onChange={(value) => update(index, value)} />
            <button type="button" onClick={() => remove(index)}>
              Xóa
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ChaptersEditor({ rows, onChange }) {
  const items = rows?.length ? rows : [{ label: "Chặng 1", title: "", description: "" }];

  function update(index, key, value) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...toChapterObject(item), [key]: value } : item)));
  }

  function remove(index) {
    const next = items.filter((_, itemIndex) => itemIndex !== index);
    onChange(next.length ? next : [{ label: "Chặng 1", title: "", description: "" }]);
  }

  return (
    <section className="admin-repeatable-section">
      <header>
        <div>
          <h3>Hành trình khám phá</h3>
          <p>Cấu hình các chặng hiển thị ở cuối trang hành trình.</p>
        </div>
        <button type="button" onClick={() => onChange([...items, { label: `Chặng ${items.length + 1}`, title: "", description: "" }])}>
          Thêm chặng
        </button>
      </header>
      <div className="admin-repeatable-list">
        {items.map((item, index) => (
          <article className="admin-repeatable-item admin-chapter-item" key={index}>
            <TextField label="Nhãn" value={chapterValue(item, "label", 0)} onChange={(value) => update(index, "label", value)} />
            <TextField label="Tiêu đề chặng" value={chapterValue(item, "title", 1)} onChange={(value) => update(index, "title", value)} />
            <TextArea label="Mô tả chặng" value={chapterValue(item, "description", 2)} onChange={(value) => update(index, "description", value)} />
            <button type="button" onClick={() => remove(index)}>
              Xóa chặng
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function GalleryEditor({ rows, onChange, onUpload }) {
  const items = normalizeGallery(rows);

  function update(index, value) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function remove(index) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function move(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }

  return (
    <section className="admin-gallery-editor">
      <header>
        <div>
          <h3>Gallery ảnh</h3>
          <p>Upload ảnh lên Cloudinary hoặc dán URL thủ công. Danh sách này sẽ được lưu vào field gallery.</p>
        </div>
        <label className="admin-gallery-upload-button">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              onUpload(Array.from(event.target.files || []));
              event.target.value = "";
            }}
          />
          <span>Upload ảnh</span>
        </label>
      </header>

      <div className="admin-gallery-grid">
        {items.map((item, index) => (
          <article className="admin-gallery-item" key={`${item}-${index}`}>
            {item ? <img src={item} alt={`Gallery ${index + 1}`} /> : <div className="admin-gallery-placeholder">Chưa có ảnh</div>}
            <div className="admin-gallery-item-fields">
              <TextField label={`Ảnh ${index + 1}`} value={item} onChange={(value) => update(index, value)} />
              <div className="admin-gallery-actions">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0}>
                  Lên
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1}>
                  Xuống
                </button>
                <button type="button" onClick={() => remove(index)}>
                  Xóa
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button className="admin-gallery-add-url" type="button" onClick={() => onChange([...items, ""])}>
        Thêm URL thủ công
      </button>
    </section>
  );
}

export default function StationsManager() {
  const { db } = useFirebaseAuth();
  const [items, setItems] = useState([]);
  const [arCharacters, setArCharacters] = useState([]);
  const [selected, setSelected] = useState(emptyDocs.stations);
  const [docId, setDocId] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [jsonDraft, setJsonDraft] = useState({});

  useEffect(() => {
    if (!db) return;

    async function loadItems() {
      const snapshot = await getDocs(query(collection(db, "stations"), orderBy("sortOrder")));
      const rows = snapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() }));
      setItems(rows);
      if (!docId && rows[0]) edit(rows[0]);
    }

    loadItems().catch(async () => {
      const snapshot = await getDocs(collection(db, "stations"));
      const rows = snapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() }));
      setItems(rows);
      if (!docId && rows[0]) edit(rows[0]);
    });
  }, [db, message]);

  useEffect(() => {
    if (!db) return;

    let mounted = true;

    async function loadArCharacters() {
      try {
        let snapshot;
        try {
          snapshot = await getDocs(query(collection(db, "arCharacters"), orderBy("name")));
        } catch {
          snapshot = await getDocs(collection(db, "arCharacters"));
        }

        if (!mounted) return;
        setArCharacters(snapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() })));
      } catch (error) {
        console.warn("Unable to load AR characters for station mapping:", error);
        if (mounted) {
          setArCharacters([]);
        }
      }
    }

    loadArCharacters();

    return () => {
      mounted = false;
    };
  }, [db]);

  const filteredItems = useMemo(() => {
    const keyword = search.toLowerCase();
    return items.filter((item) => `${item.name || ""} ${item.slug || ""} ${item.tag || ""}`.toLowerCase().includes(keyword));
  }, [items, search]);

  const selectedArCharacter = useMemo(() => {
    return arCharacters.find((item) => item.id === selected.arGuide?.modelId) || null;
  }, [arCharacters, selected.arGuide?.modelId]);

  function edit(item) {
    setDocId(item.id);
    setSelected({
      ...emptyDocs.stations,
      ...item,
      gallery: normalizeGallery(item.gallery),
      detail: { ...emptyDocs.stations.detail, ...(item.detail || {}) },
      arGuide: { ...emptyDocs.stations.arGuide, ...(item.arGuide || {}) },
    });
    setJsonDraft({
      subtitles: stringifyJson(item.arGuide?.subtitles),
    });
    setMessage("");
  }

  function createNew() {
    setDocId("");
    setSelected({ ...emptyDocs.stations, gallery: normalizeGallery(emptyDocs.stations.gallery) });
    setJsonDraft({});
    setActiveTab("basic");
    setMessage("");
  }

  function setField(name, value) {
    setSelected((current) => ({ ...current, [name]: value }));
  }

  function setNested(group, name, value) {
    setSelected((current) => ({ ...current, [group]: { ...(current[group] || {}), [name]: value } }));
  }

  async function uploadToStationFolder(field, file) {
    if (!file) return "";
    setMessage("Đang upload ảnh...");
    const baseId = docId || createId(selected.slug || selected.name || Date.now());
    const url = await uploadAdminFile(`stations/${baseId}/${field}/${file.name}`, file);
    setMessage("Đã upload ảnh. Bấm Lưu thay đổi để ghi vào Firestore.");
    return url;
  }

  async function uploadStationFile(field, file, nestedGroup) {
    const url = await uploadToStationFolder(field, file);
    if (!url) return;
    if (nestedGroup) {
      setNested(nestedGroup, field, url);
    } else {
      setField(field, url);
    }
  }

  async function uploadGalleryFiles(files) {
    if (!files.length) return;
    const uploadedUrls = [];
    for (const file of files) {
      const url = await uploadToStationFolder("gallery", file);
      if (url) uploadedUrls.push(url);
    }
    if (uploadedUrls.length) {
      setField("gallery", [...normalizeGallery(selected.gallery), ...uploadedUrls]);
    }
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const id = docId || createId(selected.slug || selected.name);
      if (!id || !selected.name) {
        throw new Error("Cần nhập tên địa danh và slug hợp lệ.");
      }

      const history = (selected.detail?.history || []).map((item) => String(item || "").trim()).filter(Boolean);
      const chapters = (selected.detail?.chapters || [])
        .map(toChapterObject)
        .map((item) => ({
          label: item.label.trim(),
          title: item.title.trim(),
          description: item.description.trim(),
        }))
        .filter((item) => item.label || item.title || item.description);

      const payload = {
        ...selected,
        slug: selected.slug || id,
        sortOrder: Number(selected.sortOrder || 0),
        gallery: normalizeGallery(selected.gallery),
        detail: {
          ...(selected.detail || {}),
          history,
          chapters,
        },
        arGuide: {
          ...(selected.arGuide || {}),
          subtitles: parseJson(jsonDraft.subtitles || stringifyJson(selected.arGuide?.subtitles), []),
        },
        updatedAt: serverTimestamp(),
      };

      await upsertDocument("stations", id, payload);
      setDocId(id);
      setMessage("Đã lưu thay đổi.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function archiveStation() {
    if (!docId) return;
    if (!window.confirm("Bạn có chắc chắn muốn lưu trữ địa danh này không?")) return;
    await archiveDocument("stations", docId);
    setMessage("Đã lưu trữ địa danh.");
  }

  const tabs = [
    { id: "basic", label: "Cơ bản" },
    { id: "media", label: "Media" },
    { id: "detail", label: "Chi tiết" },
    { id: "ar", label: "AR" },
  ];

  return (
    <AdminLayout resource="stations" contentClassName="admin-content admin-stations-content">
      <div className="admin-stations-workspace">
        <aside className="admin-stations-list-panel">
          <header>
            <div>
              <span>Danh sách ({filteredItems.length})</span>
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm địa danh..." />
            </div>
            <button type="button" aria-label="Sắp xếp danh sách">☰</button>
          </header>

          <div className="admin-stations-list">
            {filteredItems.map((item) => {
              const itemImage = getStationImage(item);
              return (
                <article className={item.id === docId ? "active" : ""} key={item.id}>
                  <button type="button" onClick={() => edit(item)} style={{ width: "100%", textAlign: "left", display: "flex", gap: "12px", alignItems: "center", padding: "16px 20px" }}>
                    {itemImage ? (
                      <img src={itemImage} className="admin-product-thumb" style={{ width: "52px", height: "52px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} alt="" />
                    ) : (
                      <div className="admin-product-thumb-placeholder" style={{ width: "52px", height: "52px", borderRadius: "6px", background: "#f0f4f2", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: "11px", color: "#6d7672", flexShrink: 0 }}>Không ảnh</div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                      <span className={`admin-station-status ${item.status || "draft"}`} style={{ position: "static", alignSelf: "start" }}>
                        {item.status === "published" ? "ACTIVE" : (item.status || "draft").toUpperCase()}
                      </span>
                      <strong style={{ fontSize: "15px", color: "#111b18", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "750" }}>{item.name || item.id}</strong>
                      <small style={{ color: "#6d7672", fontSize: "12px", marginTop: "2px" }}>
                        Thứ tự: {item.sortOrder || 0}
                      </small>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        </aside>

        <form className="admin-editor" onSubmit={save}>
          <div className="admin-editor-head" style={{ padding: "0 0 16px", marginBottom: 0 }}>
            <div>
              <h2>{docId ? "Chỉnh sửa địa danh" : "Tạo mới địa danh"}</h2>
              {message ? <p className="admin-editor-message">{message}</p> : null}
            </div>
            <div className="admin-form-actions" style={{ borderTop: "none", marginTop: 0, paddingTop: 0 }}>
              <button type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
              <button type="button" onClick={createNew} className="admin-secondary-button">
                Huỷ bỏ
              </button>
              {docId ? (
                <button
                  type="button"
                  onClick={archiveStation}
                  className="admin-secondary-button"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <img src="/assets/ic-trash'.svg" style={{ width: "16px", height: "16px", opacity: 0.8 }} alt="" />
                  Lưu trữ
                </button>
              ) : null}
            </div>
          </div>

          <nav className="admin-tabs-nav" aria-label="Nhóm thông tin địa danh">
            {tabs.map((tab) => (
              <button className={activeTab === tab.id ? "active" : ""} type="button" onClick={() => setActiveTab(tab.id)} key={tab.id}>
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="admin-tab-content" style={{ marginTop: "24px" }}>
            {activeTab === "basic" ? (
              <div className="admin-form-section">
                <div className="admin-form-row">
                  <TextField label="Tên địa danh" value={selected.name} onChange={(value) => setField("name", value)} />
                  <label>
                    Slug
                    <div className="admin-station-slug-field">
                      <span>/stations/</span>
                      <input value={selected.slug || ""} onChange={(event) => setField("slug", event.target.value)} />
                    </div>
                  </label>
                </div>
                <div className="admin-form-row">
                  <TextField label="Tag / Phân loại" value={selected.tag} onChange={(value) => setField("tag", value)} />
                  <TextField label="Giờ mở cửa" value={selected.hours} onChange={(value) => setField("hours", value)} />
                </div>
                <div className="admin-form-row">
                  <TextField label="Stamp" value={selected.stamp} onChange={(value) => setField("stamp", value)} />
                  <StatusFields selected={selected} setField={setField} featuredLabel="Hiện ở homepage" />
                </div>
                <TextArea label="Mô tả card" value={selected.description} onChange={(value) => setField("description", value)} />
              </div>
            ) : null}

            {activeTab === "media" ? (
              <div className="admin-form-section">
                <div className="admin-form-row">
                  <TextField label="Hero image URL" value={selected.heroImage} onChange={(value) => setField("heroImage", value)} />
                  <FileField label="Upload hero image" onChange={(file) => uploadStationFile("heroImage", file)} />
                </div>
                <div className="admin-form-row">
                  <TextField label="Ảnh card URL" value={selected.image} onChange={(value) => setField("image", value)} />
                  <TextField label="Map image URL" value={selected.mapImage} onChange={(value) => setField("mapImage", value)} />
                </div>
                <div className="admin-station-preview-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "16px" }}>
                  <section>
                    <h3 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "#052c24" }}>Hero image</h3>
                    <StationPreviewImage
                      src={getStationImage(selected)}
                      alt={selected.name || "Hero image"}
                      uploadLabel="Thay đổi ảnh"
                      onUpload={(file) => uploadStationFile("heroImage", file)}
                    />
                  </section>
                  <section>
                    <h3 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "#052c24" }}>Vị trí map (preview)</h3>
                    <StationPreviewImage src={getMapImage(selected)} alt="Map preview">
                      <span>{selected.mapImage || "Chưa có map image"}</span>
                    </StationPreviewImage>
                  </section>
                </div>
                <GalleryEditor rows={selected.gallery} onChange={(value) => setField("gallery", value)} onUpload={uploadGalleryFiles} />
              </div>
            ) : null}

            {activeTab === "detail" ? (
              <div className="admin-form-section">
                <div className="admin-form-row">
                  <TextField label="Detail badge" value={selected.detail?.badge} onChange={(value) => setNested("detail", "badge", value)} />
                  <TextField label="Detail headline" value={selected.detail?.headline} onChange={(value) => setNested("detail", "headline", value)} />
                </div>
                <div className="admin-form-row">
                  <TextField label="Station code" value={selected.detail?.stationCode} onChange={(value) => setNested("detail", "stationCode", value)} />
                  <TextField label="QR code" value={selected.detail?.qrCode} onChange={(value) => setNested("detail", "qrCode", value)} />
                </div>
                <div className="admin-form-row">
                  <TextField label="Offer" value={selected.detail?.offer} onChange={(value) => setNested("detail", "offer", value)} />
                  <div style={{ flex: 1 }} />
                </div>
                <TextArea label="Intro" value={selected.detail?.intro} onChange={(value) => setNested("detail", "intro", value)} />
                <HistoryEditor rows={selected.detail?.history} onChange={(value) => setNested("detail", "history", value)} />
                <ChaptersEditor rows={selected.detail?.chapters} onChange={(value) => setNested("detail", "chapters", value)} />
              </div>
            ) : null}

            {activeTab === "ar" ? (
              <div className="admin-form-section">
                <div className="admin-form-row">
                  <label>
                    AR modelId
                    <select value={selected.arGuide?.modelId || ""} onChange={(event) => setNested("arGuide", "modelId", event.target.value)}>
                      <option value="">Dùng nhân vật mặc định</option>
                      {arCharacters.map((item) => (
                        <option value={item.id} key={item.id}>
                          {item.name || item.id}
                        </option>
                      ))}
                    </select>
                  </label>
                  <TextField label="Stamp name" value={selected.arGuide?.stampName} onChange={(value) => setNested("arGuide", "stampName", value)} />
                </div>
                {selectedArCharacter ? (
                  <aside
                    className="admin-station-info-box"
                    style={{ background: "#f0f4f2", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #10b981", marginBottom: "16px", display: "grid", gap: "12px" }}
                  >
                    <strong style={{ display: "block", fontSize: "14px", color: "#052c24" }}>Nhân vật đang gán cho địa danh này</strong>
                    <div style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: "16px", alignItems: "start" }}>
                      {selectedArCharacter.posterUrl ? (
                        <img src={selectedArCharacter.posterUrl} alt={selectedArCharacter.name || selectedArCharacter.id} style={{ width: "96px", height: "96px", objectFit: "cover", borderRadius: "12px" }} />
                      ) : (
                        <div style={{ width: "96px", height: "96px", borderRadius: "12px", background: "#dfe8e4", display: "grid", placeItems: "center", color: "#64748b", fontSize: "12px" }}>
                          No poster
                        </div>
                      )}
                      <div style={{ display: "grid", gap: "6px" }}>
                        <strong style={{ color: "#052c24" }}>{selectedArCharacter.name || selectedArCharacter.id}</strong>
                        <span style={{ color: "#55605c", fontSize: "13px" }}>ID: {selectedArCharacter.id}</span>
                        <span style={{ color: "#55605c", fontSize: "13px" }}>GLB: {selectedArCharacter.glbUrl || "Chua co"}</span>
                        <span style={{ color: "#55605c", fontSize: "13px" }}>USDZ: {selectedArCharacter.usdzUrl || "Chua co"}</span>
                        <span style={{ color: "#55605c", fontSize: "13px" }}>Status: {selectedArCharacter.status || "draft"}</span>
                      </div>
                    </div>
                  </aside>
                ) : null}
                <TextArea label="AR voice text" value={selected.arGuide?.voiceText} onChange={(value) => setNested("arGuide", "voiceText", value)} />
                <JsonField label="Subtitles JSON array" name="subtitles" selected={selected.arGuide?.subtitles} jsonDraft={jsonDraft} setJsonDraft={setJsonDraft} />
                <aside className="admin-station-info-box" style={{ background: "#f0f4f2", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #10b981", marginTop: "16px", gridColumn: "1 / -1" }}>
                  <strong style={{ display: "block", fontSize: "14px", color: "#052c24", marginBottom: "4px" }}>Cấu hình nâng cao</strong>
                  <p style={{ margin: 0, fontSize: "13px", color: "#55605c" }}>Các thông số tọa độ AR và nội dung thuyết minh tự động có thể chỉnh sửa trong tab Chi tiết và AR.</p>
                </aside>
              </div>
            ) : null}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
