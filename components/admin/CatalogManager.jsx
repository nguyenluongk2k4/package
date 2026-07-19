"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import AdminLayout from "./AdminLayout";
import { CheckField, FileField, StatusFields, TextArea, TextField } from "./AdminFormFields";
import { collectionByResource, createId, emptyDocs } from "./adminData";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";
import { archiveDocument, uploadAdminFile, upsertDocument } from "../../lib/firebase/catalog";

// ─── REPEATABLE STRINGS (FEATURES, ANIMATIONS) ───────────────────────────
function RepeatableStringList({ label, values = [], onChange, placeholder = "Nhập giá trị..." }) {
  const items = Array.isArray(values) ? values : [];

  function updateItem(index, val) {
    const next = [...items];
    next[index] = val;
    onChange(next);
  }

  function addItem() {
    onChange([...items, ""]);
  }

  function removeItem(index) {
    const next = items.filter((_, i) => i !== index);
    onChange(next);
  }

  return (
    <div className="admin-repeatable-field">
      <label>{label}</label>
      <div className="admin-repeatable-list">
        {items.map((item, index) => (
          <div key={index} className="admin-repeatable-row">
            <input
              type="text"
              value={item || ""}
              placeholder={placeholder}
              onChange={(e) => updateItem(index, e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="admin-delete-row-btn"
            >
              Xóa
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="admin-add-row-btn"
        >
          + Thêm dòng mới
        </button>
      </div>
    </div>
  );
}

// ─── REPEATABLE IMAGES WITH DIRECT UPLOAD ─────────────────────────────────
function RepeatableImageList({ label, values = [], onChange, uploadInlineFile, fieldName }) {
  const items = Array.isArray(values) ? values : [];
  const [uploadingIndex, setUploadingIndex] = useState(null);

  function updateItem(index, val) {
    const next = [...items];
    next[index] = val;
    onChange(next);
  }

  function addItem() {
    onChange([...items, ""]);
  }

  function removeItem(index) {
    const next = items.filter((_, i) => i !== index);
    onChange(next);
  }

  async function handleFileChange(index, file) {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const url = await uploadInlineFile(file, fieldName);
      updateItem(index, url);
    } catch (err) {
      console.error(err);
      alert("Tải lên thất bại: " + err.message);
    } finally {
      setUploadingIndex(null);
    }
  }

  return (
    <div className="admin-repeatable-field">
      <label>{label}</label>
      <div className="admin-repeatable-list">
        {items.map((item, index) => (
          <div key={index} className="admin-repeatable-row admin-image-row">
            {item ? (
              <img
                src={item}
                alt=""
                className="admin-inline-thumb"
              />
            ) : (
              <div className="admin-inline-thumb-empty">Trống</div>
            )}
            <input
              type="text"
              value={item || ""}
              placeholder="Đường dẫn ảnh hoặc tải lên tệp..."
              onChange={(e) => updateItem(index, e.target.value)}
            />
            <label className="admin-inline-upload-label">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(index, e.target.files?.[0])}
                style={{ display: "none" }}
              />
              <span>{uploadingIndex === index ? "..." : "Tải ảnh"}</span>
            </label>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="admin-delete-row-btn"
            >
              Xóa
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="admin-add-row-btn"
        >
          + Thêm hình ảnh mới
        </button>
      </div>
    </div>
  );
}

// ─── REPEATABLE VARIANTS (LABEL, PRICE) ──────────────────────────────────
function RepeatableVariantList({ label, values = [], onChange }) {
  const items = Array.isArray(values) ? values : [];

  function updateItem(index, key, val) {
    const next = [...items];
    const item = { ...next[index] };
    if (key === "price" || key === "compareAtPrice") {
      const numericValue = Number(val || 0);
      item[key] = numericValue;
      if (key === "price") {
        item.priceFormatted = new Intl.NumberFormat("vi-VN").format(numericValue) + "đ";
      }
    } else {
      item[key] = val;
    }
    next[index] = item;
    onChange(next);
  }

  function addItem() {
    onChange([...items, { label: "", price: 0, compareAtPrice: 0, priceFormatted: "0đ" }]);
  }

  function removeItem(index) {
    const next = items.filter((_, i) => i !== index);
    onChange(next);
  }

  return (
    <div className="admin-repeatable-field">
      <label>{label}</label>
      <div className="admin-repeatable-list">
        {items.map((item, index) => (
          <div key={index} className="admin-repeatable-row admin-variant-row">
            <input
              type="text"
              placeholder="Nhãn (ví dụ: Hũ 275g)"
              value={item.label || ""}
              onChange={(e) => updateItem(index, "label", e.target.value)}
              style={{ flex: 2 }}
            />
            <input
              type="number"
              placeholder="Giá (ví dụ: 175000)"
              value={item.price || ""}
              onChange={(e) => updateItem(index, "price", e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              placeholder="Giá niêm yết"
              value={item.compareAtPrice || ""}
              onChange={(e) => updateItem(index, "compareAtPrice", e.target.value)}
              style={{ flex: 1 }}
            />
            <span className="admin-formatted-price">
              {item.priceFormatted || "0đ"}
            </span>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="admin-delete-row-btn"
            >
              Xóa
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="admin-add-row-btn"
        >
          + Thêm biến thể mới
        </button>
      </div>
    </div>
  );
}

// ─── PRODUCT FIELDS EDITOR WITH TABS ─────────────────────────────────────
function ProductFields({ selected, setField, setNested, uploadFile, uploadInlineFile }) {
  const [activeTab, setActiveTab] = useState("basic");

  return (
    <div className="admin-tabbed-container">
      <nav className="admin-tabs-nav">
        <button
          type="button"
          className={activeTab === "basic" ? "active" : ""}
          onClick={() => setActiveTab("basic")}
        >
          Cơ bản
        </button>
        <button
          type="button"
          className={activeTab === "display" ? "active" : ""}
          onClick={() => setActiveTab("display")}
        >
          Hiển thị
        </button>
        <button
          type="button"
          className={activeTab === "details" ? "active" : ""}
          onClick={() => setActiveTab("details")}
        >
          Nội dung
        </button>
        <button
          type="button"
          className={activeTab === "media" ? "active" : ""}
          onClick={() => setActiveTab("media")}
        >
          Hình ảnh
        </button>
        <button
          type="button"
          className={activeTab === "model3d" ? "active" : ""}
          onClick={() => setActiveTab("model3d")}
        >
          Mô hình 3D
        </button>
      </nav>

      <div className="admin-tab-content">
        {activeTab === "basic" && (
          <div className="admin-form-section">
            <div className="admin-form-row">
              <TextField label="Tên sản phẩm" value={selected.name} onChange={(value) => setField("name", value)} />
              <TextField label="Slug" value={selected.slug} onChange={(value) => setField("slug", value)} />
            </div>
            <div className="admin-form-row">
              <TextField label="Tên ngắn (shortName)" value={selected.shortName} onChange={(value) => setField("shortName", value)} />
              <TextField label="Danh mục (category)" value={selected.category} onChange={(value) => setField("category", value)} />
            </div>
            <div className="admin-form-row">
              <TextField label="Giá tiền (price)" value={selected.price} type="number" onChange={(value) => setField("price", value)} />
              <TextField label="Giá niêm yết (compareAtPrice)" value={selected.compareAtPrice || ""} type="number" onChange={(value) => setField("compareAtPrice", Number(value || 0))} />
            </div>
            <div className="admin-form-row">
              <TextField label="Khối lượng (weight)" value={selected.weight} onChange={(value) => setField("weight", value)} />
              <TextField label="Nhãn ưu đãi (saleLabel)" value={selected.saleLabel || ""} onChange={(value) => setField("saleLabel", value)} />
            </div>
            <div className="admin-form-row">
              <TextField label="Badge nổi bật" value={selected.badge} onChange={(value) => setField("badge", value)} />
              <StatusFields selected={selected} setField={setField} />
            </div>
          </div>
        )}

        {activeTab === "display" && (
          <div className="admin-form-section">
            <div className="admin-form-checkboxes">
              <CheckField label="Hiện trên Trang chủ" checked={selected.showOnHome} onChange={(value) => setField("showOnHome", value)} />
              <CheckField label="Hiện trên Trang sản phẩm" checked={selected.showOnProductList} onChange={(value) => setField("showOnProductList", value)} />
            </div>
            <div className="admin-form-row">
              <TextField label="Vị trí hiển thị trang chủ (homePlacement)" value={selected.homePlacement} onChange={(value) => setField("homePlacement", value)} />
              <TextField label="Đường dẫn liên kết (href)" value={selected.href || ""} onChange={(value) => setField("href", value)} />
            </div>
            <div className="admin-form-row">
              <TextField label="Căn lề X trang chủ (homeVisualOffsetX)" value={selected.homeVisualOffsetX || ""} onChange={(value) => setField("homeVisualOffsetX", value)} />
              <TextField label="Căn lề Y trang chủ (homeVisualOffsetY)" value={selected.homeVisualOffsetY || ""} onChange={(value) => setField("homeVisualOffsetY", value)} />
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="admin-form-section">
            <TextArea label="Mô tả ngắn" value={selected.description} onChange={(value) => setField("description", value)} />
            <TextField label="Tiêu đề câu chuyện (storyTitle)" value={selected.storyTitle || ""} onChange={(value) => setField("storyTitle", value)} />
            <TextArea label="Câu chuyện di sản (story)" value={selected.story || ""} onChange={(value) => setField("story", value)} />
            <TextArea label="Thành phần (ingredients)" value={selected.ingredients || ""} onChange={(value) => setField("ingredients", value)} />
            <TextArea label="Hướng dẫn sử dụng (usage)" value={selected.usage || ""} onChange={(value) => setField("usage", value)} />
            <div className="admin-form-row">
              <TextField label="Hạn sử dụng (shelfLife)" value={selected.shelfLife || ""} onChange={(value) => setField("shelfLife", value)} />
              <TextField label="Cách bảo quản (storage)" value={selected.storage || ""} onChange={(value) => setField("storage", value)} />
            </div>
            <TextArea label="Lưu ý (note)" value={selected.note || ""} onChange={(value) => setField("note", value)} />
            <TextArea label="Ghi chú ưu đãi (saleNote)" value={selected.saleNote || ""} onChange={(value) => setField("saleNote", value)} />
          </div>
        )}

        {activeTab === "media" && (
          <div className="admin-form-section">
            <div className="admin-form-row">
              <div style={{ flex: 1 }}>
                <TextField label="URL Ảnh đại diện chính (image)" value={selected.image || ""} onChange={(value) => setField("image", value)} />
                <FileField label="Upload image" onChange={(file) => uploadFile("image", file)} />
              </div>
              <div style={{ flex: 1 }}>
                <TextField label="URL Ảnh hiển thị trang chủ (homeImage)" value={selected.homeImage || ""} onChange={(value) => setField("homeImage", value)} />
                <FileField label="Upload homeImage" onChange={(file) => uploadFile("homeImage", file)} />
              </div>
            </div>
            
            <RepeatableImageList
              label="Ảnh trưng bày chính (images)"
              values={selected.images}
              onChange={(val) => setField("images", val)}
              uploadInlineFile={uploadInlineFile}
              fieldName="images"
            />
            <RepeatableImageList
              label="Ảnh chi tiết phụ (detailImages)"
              values={selected.detailImages}
              onChange={(val) => setField("detailImages", val)}
              uploadInlineFile={uploadInlineFile}
              fieldName="detailImages"
            />
            <RepeatableStringList
              label="Đặc điểm nổi bật (features)"
              values={selected.features}
              onChange={(val) => setField("features", val)}
              placeholder="Nhập một đặc điểm sản phẩm..."
            />
            <RepeatableVariantList
              label="Danh sách biến thể (variants)"
              values={selected.variants}
              onChange={(val) => setField("variants", val)}
            />

            {selected.image ? (
              <div className="admin-image-preview-stack" style={{ marginTop: "24px" }}>
                <div>
                  <small>Ảnh đại diện chính</small>
                  <img className="admin-image-preview" src={selected.image} alt={selected.name || "Product image"} />
                </div>
                {selected.homeImage ? (
                  <div>
                    <small>Ảnh trang chủ</small>
                    <img className="admin-image-preview" src={selected.homeImage} alt={`${selected.name || "Product"} home`} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        {activeTab === "model3d" && (
          <div className="admin-form-section">
            <div className="admin-form-row">
              <TextField label="GLB URL" value={selected.model3d?.glbUrl} onChange={(value) => setNested("model3d", "glbUrl", value)} />
              <FileField label="Upload GLB" onChange={(file) => uploadFile("glbUrl", file, "model3d")} />
            </div>
            <div className="admin-form-row">
              <TextField label="USDZ URL" value={selected.model3d?.usdzUrl} onChange={(value) => setNested("model3d", "usdzUrl", value)} />
              <FileField label="Upload USDZ" onChange={(file) => uploadFile("usdzUrl", file, "model3d")} />
            </div>
            <TextField label="Poster URL" value={selected.model3d?.posterUrl} onChange={(value) => setNested("model3d", "posterUrl", value)} />

            {selected.model3d?.glbUrl ? (
              <div style={{ marginTop: "24px" }}>
                <small style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#64748b" }}>Xem trước mô hình 3D:</small>
                <model-viewer
                  className="admin-model-preview"
                  src={selected.model3d.glbUrl}
                  poster={selected.model3d.posterUrl || undefined}
                  camera-controls
                  auto-rotate
                  style={{ width: "100%", height: "260px", background: "#f1f5f9", borderRadius: "8px" }}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AR CHARACTER FIELDS EDITOR ──────────────────────────────────────────
function ArCharacterFields({ selected, setField, uploadFile }) {
  return (
    <div className="admin-form-section">
      <TextField label="Tên" value={selected.name} onChange={(value) => setField("name", value)} />
      <StatusFields selected={selected} setField={setField} />
      <CheckField label="Nhân vật mặc định" checked={selected.isDefault} onChange={(value) => setField("isDefault", value)} />
      <div className="admin-form-row">
        <TextField label="GLB URL" value={selected.glbUrl} onChange={(value) => setField("glbUrl", value)} />
        <FileField label="Upload GLB" onChange={(file) => uploadFile("glbUrl", file)} />
      </div>
      <div className="admin-form-row">
        <TextField label="USDZ URL" value={selected.usdzUrl} onChange={(value) => setField("usdzUrl", value)} />
        <FileField label="Upload USDZ" onChange={(file) => uploadFile("usdzUrl", file)} />
      </div>
      <TextField label="Poster URL" value={selected.posterUrl} onChange={(value) => setField("posterUrl", value)} />
      <TextField label="Default animation" value={selected.defaultAnimation} onChange={(value) => setField("defaultAnimation", value)} />
      
      <RepeatableStringList
        label="Danh sách animations (animations)"
        values={selected.animations}
        onChange={(val) => setField("animations", val)}
        placeholder="Nhập tên animation (ví dụ: Idle, Wave)..."
      />

      {selected.glbUrl ? (
        <div style={{ marginTop: "24px" }}>
          <small style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#64748b" }}>Xem trước mô hình:</small>
          <model-viewer
            className="admin-model-preview"
            src={selected.glbUrl}
            poster={selected.posterUrl || undefined}
            camera-controls
            auto-rotate
            style={{ width: "100%", height: "260px", background: "#f1f5f9", borderRadius: "8px" }}
          />
        </div>
      ) : null}
    </div>
  );
}

// ─── ADMIN FIELDS WRAPPER ────────────────────────────────────────────────
function AdminFields(props) {
  if (props.resource === "products") {
    return <ProductFields {...props} />;
  }

  return <ArCharacterFields {...props} />;
}

// ─── MAIN CATALOG MANAGER COMPONENT ──────────────────────────────────────
export default function CatalogManager({ resource, title, description }) {
  const { db } = useFirebaseAuth();
  const collectionName = collectionByResource[resource];
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(emptyDocs[resource]);
  const [docId, setDocId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSelected(emptyDocs[resource]);
    setDocId("");
  }, [resource]);

  useEffect(() => {
    if (!db || !collectionName) return;

    async function loadItems() {
      const snapshot = await getDocs(query(collection(db, collectionName), orderBy("sortOrder")));
      setItems(snapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() })));
    }

    loadItems().catch(async () => {
      const snapshot = await getDocs(collection(db, collectionName));
      setItems(snapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() })));
    });
  }, [collectionName, db, message]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const keyword = `${item.name || ""} ${item.slug || ""} ${item.category || ""}`.toLowerCase();
      return matchesStatus && keyword.includes(search.toLowerCase());
    });
  }, [items, search, statusFilter]);

  function edit(item) {
    setDocId(item.id);
    setSelected({
      ...emptyDocs[resource],
      ...item,
      ...(resource === "products" ? { model3d: { glbUrl: "", usdzUrl: "", posterUrl: "" } } : {}),
    });
  }

  function createNew() {
    setDocId("");
    setSelected(emptyDocs[resource]);
  }

  function setField(name, value) {
    setSelected((current) => ({ ...current, [name]: value }));
  }

  function setNested(group, name, value) {
    setSelected((current) => ({ ...current, [group]: { ...(current[group] || {}), [name]: value } }));
  }

  async function uploadFile(field, file, nestedGroup) {
    if (!file) return;
    const baseId = docId || createId(selected.slug || selected.name || Date.now());
    const url = await uploadAdminFile(`${collectionName}/${baseId}/${field}/${file.name}`, file);
    if (nestedGroup) {
      setNested(nestedGroup, field, url);
    } else {
      setField(field, url);
    }
  }

  async function uploadInlineFile(file, folderName) {
    if (!file) return "";
    const baseId = docId || createId(selected.slug || selected.name || Date.now());
    return await uploadAdminFile(`${collectionName}/${baseId}/${folderName}/${file.name}`, file);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const id = docId || createId(selected.slug || selected.name);
      if (!id || !selected.name) {
        throw new Error("Cần nhập name và slug hợp lệ.");
      }

      const payload = {
        ...selected,
        slug: selected.slug || id,
        sortOrder: Number(selected.sortOrder || 0),
        updatedAt: serverTimestamp(),
      };

      if (resource === "products") {
        payload.price = Number(selected.price || 0);
        payload.compareAtPrice = Number(selected.compareAtPrice || 0);
        payload.images = selected.images || [];
        payload.detailImages = selected.detailImages || [];
        payload.features = selected.features || [];
        payload.variants = selected.variants || [];
        payload.image = selected.image || payload.images?.[0] || "";
        payload.homeImage = selected.homeImage || selected.image || payload.images?.[0] || "";
        payload.href = selected.href || `/san-pham/${selected.slug || id}`;
        payload.model3d = {
          glbUrl: "",
          usdzUrl: "",
          posterUrl: "",
        };
      }

      if (resource === "arCharacters") {
        payload.animations = selected.animations || [];
        if (payload.isDefault && db) {
          const defaults = await getDocs(query(collection(db, "arCharacters"), where("isDefault", "==", true)));
          await Promise.all(defaults.docs.map((itemDoc) => setDoc(doc(db, "arCharacters", itemDoc.id), { isDefault: false }, { merge: true })));
        }
      }

      await upsertDocument(collectionName, id, payload);
      setDocId(id);
      setMessage("Đã lưu thay đổi.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function archive(id) {
    if (!window.confirm("Bạn có chắc chắn muốn lưu trữ tài liệu này?")) return;
    await archiveDocument(collectionName, id);
    setMessage("Đã lưu trữ document.");
  }

  return (
    <AdminLayout resource={resource} contentClassName={`admin-content admin-products-content`}>
      <div className="admin-products-workspace">
        <aside className="admin-products-list-panel admin-stations-list-panel">
          <div className="admin-products-sidebar-header" style={{ padding: "16px 20px", borderBottom: "1px solid #dfe7e2" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#252f2b" }}>Danh sách ({filteredItems.length})</span>
                <button
                  type="button"
                  onClick={createNew}
                  style={{
                    padding: "8px 16px",
                    background: "#052c24",
                    color: "#ffffff",
                    border: 0,
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0
                  }}
                >
                  + Tạo mới
                </button>
              </div>
              <div className="admin-search-wrapper" style={{ margin: 0, width: "100%" }}>
                <img src="/assets/ic-search.svg" className="admin-search-icon" alt="" />
                <input
                  placeholder="Tìm theo tên, slug..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  style={{ width: "100%", height: "38px", fontSize: "13px", paddingLeft: "44px" }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  fontSize: "13px",
                  borderRadius: "8px",
                  border: "1px solid rgba(5, 52, 44, 0.12)",
                  padding: "0 10px",
                  fontWeight: "600"
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="admin-products-list">
            {filteredItems.map((item) => {
              const itemImage = item.image || item.posterUrl || (Array.isArray(item.images) ? item.images[0] : "");
              return (
                <article className={item.id === docId ? "active" : ""} key={item.id}>
                  <button type="button" onClick={() => edit(item)}>
                    {itemImage ? (
                      <img src={itemImage} className="admin-product-thumb" alt="" />
                    ) : (
                      <div className="admin-product-thumb-placeholder">Không ảnh</div>
                    )}
                    <div className="admin-product-info">
                      <span className={`admin-station-status ${item.status || "draft"}`} style={{ position: "static", alignSelf: "start" }}>
                        {(item.status || "draft").toUpperCase()}
                      </span>
                      <strong className="admin-product-name">{item.name || item.id}</strong>
                      <div className="admin-product-meta">
                        <span>Thứ tự: {item.sortOrder || 0}</span>
                      </div>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        </aside>

        <form className="admin-editor" onSubmit={save}>
          <div className="admin-editor-head">
            <div>
              <h2>{docId ? "Chỉnh sửa" : "Tạo mới"}</h2>
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
                  onClick={() => archive(docId)}
                  className="admin-secondary-button"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <img src="/assets/ic-trash'.svg" style={{ width: "16px", height: "16px", opacity: 0.8 }} alt="" />
                  Lưu trữ
                </button>
              ) : null}
            </div>
          </div>
          <AdminFields
            resource={resource}
            selected={selected}
            setField={setField}
            setNested={setNested}
            uploadFile={uploadFile}
            uploadInlineFile={uploadInlineFile}
          />
        </form>
      </div>
    </AdminLayout>
  );
}
