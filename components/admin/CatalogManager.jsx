"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import AdminLayout from "./AdminLayout";
import { CheckField, FileField, JsonField, StatusFields, TextArea, TextField } from "./AdminFormFields";
import { collectionByResource, createId, emptyDocs, parseJson, stringifyJson } from "./adminData";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";
import { archiveDocument, uploadAdminFile, upsertDocument } from "../../lib/firebase/catalog";

function AdminFields({ resource, selected, setField, setNested, jsonDraft, setJsonDraft, uploadFile }) {
  if (resource === "products") {
    return (
      <>
        <TextField label="Tên" value={selected.name} onChange={(value) => setField("name", value)} />
        <TextField label="Slug" value={selected.slug} onChange={(value) => setField("slug", value)} />
        <TextField label="Short name" value={selected.shortName} onChange={(value) => setField("shortName", value)} />
        <TextArea label="Mô tả" value={selected.description} onChange={(value) => setField("description", value)} />
        <TextField label="Giá" value={selected.price} type="number" onChange={(value) => setField("price", value)} />
        <TextField label="Khối lượng" value={selected.weight} onChange={(value) => setField("weight", value)} />
        <TextField label="Badge" value={selected.badge} onChange={(value) => setField("badge", value)} />
        <TextField label="Category" value={selected.category} onChange={(value) => setField("category", value)} />
        <StatusFields selected={selected} setField={setField} />
        <CheckField label="Hiện homepage" checked={selected.showOnHome} onChange={(value) => setField("showOnHome", value)} />
        <CheckField label="Hiện product list" checked={selected.showOnProductList} onChange={(value) => setField("showOnProductList", value)} />
        <TextField label="Home placement" value={selected.homePlacement} onChange={(value) => setField("homePlacement", value)} />
        <JsonField label="Images JSON array" name="images" selected={selected.images} jsonDraft={jsonDraft} setJsonDraft={setJsonDraft} />
        <JsonField label="Detail images JSON array" name="detailImages" selected={selected.detailImages} jsonDraft={jsonDraft} setJsonDraft={setJsonDraft} />
        <JsonField label="Features JSON array" name="features" selected={selected.features} jsonDraft={jsonDraft} setJsonDraft={setJsonDraft} />
        <JsonField label="Variants JSON array" name="variants" selected={selected.variants} jsonDraft={jsonDraft} setJsonDraft={setJsonDraft} />
        <TextField label="GLB URL" value={selected.model3d?.glbUrl} onChange={(value) => setNested("model3d", "glbUrl", value)} />
        <FileField label="Upload GLB" onChange={(file) => uploadFile("glbUrl", file, "model3d")} />
        <TextField label="USDZ URL" value={selected.model3d?.usdzUrl} onChange={(value) => setNested("model3d", "usdzUrl", value)} />
        <FileField label="Upload USDZ" onChange={(file) => uploadFile("usdzUrl", file, "model3d")} />
        <TextField label="Poster URL" value={selected.model3d?.posterUrl} onChange={(value) => setNested("model3d", "posterUrl", value)} />
        {selected.model3d?.glbUrl ? <model-viewer className="admin-model-preview" src={selected.model3d.glbUrl} poster={selected.model3d.posterUrl || undefined} camera-controls auto-rotate /> : null}
      </>
    );
  }

  return (
    <>
      <TextField label="Tên" value={selected.name} onChange={(value) => setField("name", value)} />
      <StatusFields selected={selected} setField={setField} />
      <CheckField label="Nhân vật mặc định" checked={selected.isDefault} onChange={(value) => setField("isDefault", value)} />
      <TextField label="GLB URL" value={selected.glbUrl} onChange={(value) => setField("glbUrl", value)} />
      <FileField label="Upload GLB" onChange={(file) => uploadFile("glbUrl", file)} />
      <TextField label="USDZ URL" value={selected.usdzUrl} onChange={(value) => setField("usdzUrl", value)} />
      <FileField label="Upload USDZ" onChange={(file) => uploadFile("usdzUrl", file)} />
      <TextField label="Poster URL" value={selected.posterUrl} onChange={(value) => setField("posterUrl", value)} />
      <TextField label="Default animation" value={selected.defaultAnimation} onChange={(value) => setField("defaultAnimation", value)} />
      <JsonField label="Animations JSON array" name="animations" selected={selected.animations} jsonDraft={jsonDraft} setJsonDraft={setJsonDraft} />
      {selected.glbUrl ? <model-viewer className="admin-model-preview" src={selected.glbUrl} poster={selected.posterUrl || undefined} camera-controls auto-rotate /> : null}
    </>
  );
}

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
  const [jsonDraft, setJsonDraft] = useState({});

  useEffect(() => {
    setSelected(emptyDocs[resource]);
    setDocId("");
    setJsonDraft({});
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
    setSelected({ ...emptyDocs[resource], ...item });
    setJsonDraft({
      detailImages: stringifyJson(item.detailImages),
      images: stringifyJson(item.images),
      features: stringifyJson(item.features),
      variants: stringifyJson(item.variants),
      animations: stringifyJson(item.animations),
    });
  }

  function createNew() {
    setDocId("");
    setSelected(emptyDocs[resource]);
    setJsonDraft({});
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
        payload.images = parseJson(jsonDraft.images || stringifyJson(selected.images), []);
        payload.detailImages = parseJson(jsonDraft.detailImages || stringifyJson(selected.detailImages), []);
        payload.features = parseJson(jsonDraft.features || stringifyJson(selected.features), []);
        payload.variants = parseJson(jsonDraft.variants || stringifyJson(selected.variants), []);
      }

      if (resource === "arCharacters") {
        payload.animations = parseJson(jsonDraft.animations || stringifyJson(selected.animations), []);
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
    await archiveDocument(collectionName, id);
    setMessage("Đã lưu trữ document.");
  }

  return (
    <AdminLayout resource={resource}>
      <header className="admin-heading">
        <span>Admin CMS</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      <div className="admin-toolbar">
        <div className="admin-search-wrapper">
          <img src="/assets/ic-search.svg" className="admin-search-icon" alt="" />
          <input placeholder="Tìm theo tên, slug..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <button type="button" onClick={createNew}>Tạo mới</button>
      </div>

      <div className="admin-manager-grid">
        <div className="admin-table">
          {filteredItems.map((item) => (
            <article className={item.id === docId ? "active" : ""} key={item.id}>
              <button type="button" onClick={() => edit(item)}>
                <strong>{item.name || item.id}</strong>
                <span>{item.slug || item.status || "draft"}</span>
              </button>
              <small>{item.status || "draft"} · #{item.sortOrder || 0}</small>
            </article>
          ))}
        </div>

        <form className="admin-editor" onSubmit={save}>
          <div className="admin-editor-head">
            <h2>{docId ? "Chỉnh sửa" : "Tạo mới"}</h2>
            {message ? <p>{message}</p> : null}
          </div>
          <AdminFields
            resource={resource}
            selected={selected}
            setField={setField}
            setNested={setNested}
            jsonDraft={jsonDraft}
            setJsonDraft={setJsonDraft}
            uploadFile={uploadFile}
          />
          <div className="admin-form-actions">
            <button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
            {docId ? (
              <button type="button" onClick={() => archive(docId)} className="admin-secondary-button" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <img src="/assets/ic-trash'.svg" style={{ width: "16px", height: "16px", opacity: 0.8 }} alt="" />
                Lưu trữ
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
