"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminHeaderBar from "./AdminHeaderBar";
import AdminLeftSidebar from "./AdminLeftSidebar";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";
import { archiveDocument, uploadAdminFile, upsertDocument } from "../../lib/firebase/catalog";

const navItems = [
  { href: "/admin", label: "Dashboard", resource: "dashboard", icon: "/assets/passport_icon.svg" },
  { href: "/admin/stations", label: "Địa danh", resource: "stations", icon: "/assets/combo_passport_icon.svg" },
  { href: "/admin/products", label: "Sản phẩm", resource: "products", icon: "/assets/gift_box_icon.svg" },
  { href: "/admin/ar-characters", label: "Nhân vật AR", resource: "arCharacters", icon: "/assets/passport_icon.svg" },
  { href: "/admin/users", label: "Users", resource: "users", icon: "/assets/ic-language.svg" },
];

const collectionByResource = {
  stations: "stations",
  products: "products",
  arCharacters: "arCharacters",
};

const emptyDocs = {
  stations: {
    name: "",
    slug: "",
    tag: "",
    description: "",
    heroImage: "",
    image: "",
    gallery: [],
    mapImage: "",
    hours: "",
    stamp: "",
    status: "draft",
    isFeatured: false,
    sortOrder: 0,
    detail: {
      badge: "",
      headline: "",
      intro: "",
      history: [],
      chapters: [],
      stationCode: "",
      qrCode: "",
      offer: "",
    },
    arGuide: {
      voiceText: "",
      subtitles: [],
      stampName: "",
      modelId: "",
    },
  },
  products: {
    name: "",
    slug: "",
    shortName: "",
    description: "",
    price: 0,
    weight: "",
    badge: "",
    category: "",
    status: "draft",
    sortOrder: 0,
    showOnHome: false,
    showOnProductList: true,
    homePlacement: "",
    images: [],
    detailImages: [],
    features: [],
    variants: [],
    model3d: { glbUrl: "", usdzUrl: "", posterUrl: "" },
  },
  arCharacters: {
    name: "",
    glbUrl: "",
    usdzUrl: "",
    posterUrl: "",
    animations: [],
    defaultAnimation: "",
    isDefault: false,
    status: "draft",
  },
};

function createId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseJson(value, fallback) {
  try {
    return value.trim() ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function stringifyJson(value) {
  return JSON.stringify(value || [], null, 2);
}

function AdminLoginCard() {
  const { loginWithEmail, isConfigured, missingKeys, authError, user } = useFirebaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/admin");
    }
  }, [user, router]);

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "info" });
    }, 3000);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!isConfigured) return;
    setError("");
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      showToast("Đăng nhập thành công!", "success");
    } catch (err) {
      console.error("Login failed:", err);
      const msg = err.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-container">
        {/* Logo tren card */}
        <div className="admin-login-logo">
          <img src="/assets/anh-new/logo.png" alt="Sắc Cố Đô" />
          <span>ADMIN ECOSYSTEM</span>
        </div>

        {/* Card dang nhap */}
        <section className="admin-login-card">
          <h1>Đăng nhập quản trị</h1>
          {!isConfigured ? <p className="admin-alert">Thiếu Firebase env: {missingKeys.join(", ")}</p> : null}
          
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Email</label>
              <div className="input-with-icon">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input 
                  value={email} 
                  onChange={(event) => setEmail(event.target.value)} 
                  type="email" 
                  placeholder="admin@saccodo.vn" 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-wrapper">
                <label>Mật khẩu</label>
                <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); showToast("Vui lòng liên hệ Admin tối cao để khôi phục mật khẩu.", "info"); }}>Quên mật khẩu?</a>
              </div>
              <div className="input-with-icon">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input 
                  value={password} 
                  onChange={(event) => setPassword(event.target.value)} 
                  type={showPassword ? "text" : "password"} 
                  placeholder="********" 
                  required 
                />
                <button 
                  type="button" 
                  className="password-toggle-btn" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" stroke="currentColor" strokeWidth="2" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error || authError ? <p className="admin-alert">{error || authError}</p> : null}
            <button type="submit" className="admin-login-submit" disabled={loading || !isConfigured}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="admin-card-footer">Hệ thống quản trị di sản văn hóa Ninh Bình</p>
        </section>

        {/* Footer duoi cung */}
        <footer className="admin-login-footer">
          © 2024 Sac Co Do Admin. Bảo lưu mọi quyền.
        </footer>
      </div>


      {/* Inline Toast Notification */}
      {toast.show && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          padding: "16px 24px",
          backgroundColor: toast.type === "error" ? "#ef4444" : toast.type === "success" ? "#10b981" : "#3b82f6",
          color: "white",
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          zIndex: 9999,
          fontSize: "14px",
          fontWeight: "500",
          maxWidth: "350px",
          transition: "all 0.3s ease-in-out",
          borderLeft: "5px solid rgba(0,0,0,0.2)"
        }}>
          {toast.message}
        </div>
      )}
    </main>
  );
}

function AdminGate({ children }) {
  const { user, isAdmin, loading, logout, authError } = useFirebaseAuth();

  if (loading) {
    return <main className="admin-loading">Đang kiểm tra quyền admin...</main>;
  }

  if (!user) {
    return <AdminLoginCard />;
  }

  if (!isAdmin) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-card">
          <div className="logo-container">
            <img src="/assets/anh-new/logo.png" alt="Sắc Cố Đô Logo" />
          </div>
          <span>Admin CMS</span>
          <h1>Tài khoản chưa có quyền</h1>
          <p className="admin-alert">{authError || "Account này chưa có `adminUsers/{user.uid}`. Hãy chạy seed với `FIREBASE_ADMIN_UID` hoặc cấp quyền thủ công."}</p>
          <button type="button" onClick={logout}>Đăng xuất</button>
        </section>
      </main>
    );
  }

  return children;
}

function AdminLayout({ resource, children }) {

  return (
    <AdminGate>
      <main className="admin-page">
        <AdminLeftSidebar resource={resource} />
        <div className="admin-main-shell">
          <AdminHeaderBar resource={resource} />
          <section className="admin-content">{children}</section>
        </div>
      </main>
    </AdminGate>
  );
}

function Dashboard() {
  const { db } = useFirebaseAuth();
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (!db) return;

    async function loadStats() {
      const names = ["stations", "products", "users", "arCharacters"];
      const result = {};
      await Promise.all(
        names.map(async (name) => {
          const snapshot = await getDocs(collection(db, name));
          result[name] = snapshot.size;
        })
      );
      setStats(result);
    }

    loadStats();
  }, [db]);

  const dashboardStats = [
    { label: "Địa danh", value: stats.stations ?? "-", badge: "ACTIVE", icon: "/assets/admin/dashboard/ic-dia-danh-dashboard-da-co-bg.svg" },
    { label: "Sản phẩm", value: stats.products ?? "-", badge: "STOCK", icon: "/assets/admin/dashboard/ic-san-pham-dashboard-da-co-bg.svg" },
    { label: "Người dùng", value: stats.users ?? "-", badge: "GROWTH", icon: "/assets/admin/dashboard/ic-ngươi-dung-dashboard-da-co-bg.svg" },
    { label: "Nhân vật AR", value: stats.arCharacters ?? "-", badge: "3D LIVE", icon: "/assets/admin/dashboard/ic-nhan-vat-ar-dashboard-da-co-bg.svg" },
  ];

  return (
    <AdminLayout resource="dashboard">
      <div className="admin-dashboard-page">
        <header className="admin-dashboard-heading">
          <h1>Dashboard</h1>
          <p>Quản trị dữ liệu đang dùng cho public app. Hệ thống quản lý di sản, sản phẩm du lịch và trải nghiệm thực tế ảo tăng cường.</p>
        </header>

        <section className="admin-dashboard-stat-grid" aria-label="Tổng quan dữ liệu">
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

        <section className="admin-dashboard-main-grid">
          <article className="admin-dashboard-feature-card">
            <img src="/assets/dia-danh/co-do-hoa-lu/CĐHL 1.jpg" alt="Cố đô Hoa Lư" />
            <div>
              <span>Tiêu điểm di sản</span>
              <h2>Cố Đô Hoa Lư - Phục dựng thực tế ảo</h2>
              <Link href="/admin/ar-characters">Xem chi tiết AR</Link>
            </div>
          </article>

          <aside className="admin-dashboard-activity-card">
            <header>
              <h2>Hoạt động gần đây</h2>
              <span aria-hidden="true">↺</span>
            </header>
            <div className="admin-activity-list">
              <article>
                <span className="orange" />
                <div>
                  <strong>Cập nhật Asset 3D</strong>
                  <p>Lê Văn An vừa cập nhật model 'Long Sàng' cho Đền Vua Đinh.</p>
                  <small>12 phút trước</small>
                </div>
              </article>
              <article>
                <span />
                <div>
                  <strong>Tạo địa danh mới</strong>
                  <p>Hệ thống vừa thêm 'Chùa Bái Đính' vào danh mục Map.</p>
                  <small>2 giờ trước</small>
                </div>
              </article>
              <article>
                <span />
                <div>
                  <strong>Báo cáo người dùng</strong>
                  <p>Số lượng đăng ký mới tăng 15% trong 24h qua.</p>
                  <small>Hôm qua</small>
                </div>
              </article>
            </div>
            <button type="button">Xem tất cả lịch sử</button>
          </aside>
        </section>
      </div>
    </AdminLayout>
  );
}

function CatalogManager({ resource, title, description }) {
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
      gallery: stringifyJson(item.gallery),
      detailImages: stringifyJson(item.detailImages),
      images: stringifyJson(item.images),
      features: stringifyJson(item.features),
      variants: stringifyJson(item.variants),
      history: stringifyJson(item.detail?.history),
      chapters: stringifyJson(item.detail?.chapters),
      subtitles: stringifyJson(item.arGuide?.subtitles),
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
    const path = `${collectionName}/${baseId}/${field}/${file.name}`;
    const url = await uploadAdminFile(path, file);
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

      if (resource === "stations") {
        payload.gallery = parseJson(jsonDraft.gallery || stringifyJson(selected.gallery), []);
        payload.detail = {
          ...(selected.detail || {}),
          history: parseJson(jsonDraft.history || stringifyJson(selected.detail?.history), []),
          chapters: parseJson(jsonDraft.chapters || stringifyJson(selected.detail?.chapters), []),
        };
        payload.arGuide = {
          ...(selected.arGuide || {}),
          subtitles: parseJson(jsonDraft.subtitles || stringifyJson(selected.arGuide?.subtitles), []),
        };
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

function AdminFields({ resource, selected, setField, setNested, jsonDraft, setJsonDraft, uploadFile }) {
  if (resource === "stations") {
    return (
      <>
        <TextField label="Tên" value={selected.name} onChange={(value) => setField("name", value)} />
        <TextField label="Slug" value={selected.slug} onChange={(value) => setField("slug", value)} />
        <TextField label="Tag" value={selected.tag} onChange={(value) => setField("tag", value)} />
        <TextArea label="Mô tả card" value={selected.description} onChange={(value) => setField("description", value)} />
        <TextField label="Hero image URL" value={selected.heroImage} onChange={(value) => setField("heroImage", value)} />
        <FileField label="Upload hero image" onChange={(file) => uploadFile("heroImage", file)} />
        <TextField label="Map image URL" value={selected.mapImage} onChange={(value) => setField("mapImage", value)} />
        <TextField label="Giờ mở cửa" value={selected.hours} onChange={(value) => setField("hours", value)} />
        <TextField label="Stamp" value={selected.stamp} onChange={(value) => setField("stamp", value)} />
        <StatusFields selected={selected} setField={setField} featuredLabel="Hiện ở homepage" />
        <TextField label="Detail badge" value={selected.detail?.badge} onChange={(value) => setNested("detail", "badge", value)} />
        <TextField label="Detail headline" value={selected.detail?.headline} onChange={(value) => setNested("detail", "headline", value)} />
        <TextArea label="Intro" value={selected.detail?.intro} onChange={(value) => setNested("detail", "intro", value)} />
        <JsonField label="Gallery JSON array" name="gallery" selected={selected.gallery} jsonDraft={jsonDraft} setJsonDraft={setJsonDraft} />
        <JsonField label="History JSON array" name="history" selected={selected.detail?.history} jsonDraft={jsonDraft} setJsonDraft={setJsonDraft} />
        <JsonField label="Chapters JSON array" name="chapters" selected={selected.detail?.chapters} jsonDraft={jsonDraft} setJsonDraft={setJsonDraft} />
        <TextArea label="AR voice text" value={selected.arGuide?.voiceText} onChange={(value) => setNested("arGuide", "voiceText", value)} />
        <TextField label="AR modelId" value={selected.arGuide?.modelId} onChange={(value) => setNested("arGuide", "modelId", value)} />
        <JsonField label="Subtitles JSON array" name="subtitles" selected={selected.arGuide?.subtitles} jsonDraft={jsonDraft} setJsonDraft={setJsonDraft} />
      </>
    );
  }

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

function TextField({ label, value, onChange, type = "text" }) {
  return (
    <label>
      {label}
      <input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label>
      {label}
      <textarea value={value || ""} onChange={(event) => onChange(event.target.value)} rows={4} />
    </label>
  );
}

function CheckField({ label, checked, onChange }) {
  return (
    <label className="admin-check">
      <input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function FileField({ label, onChange }) {
  return (
    <label>
      {label}
      <input type="file" onChange={(event) => onChange(event.target.files?.[0])} />
    </label>
  );
}

function JsonField({ label, name, selected, jsonDraft, setJsonDraft }) {
  return (
    <label>
      {label}
      <textarea
        value={jsonDraft[name] ?? stringifyJson(selected)}
        onChange={(event) => setJsonDraft((current) => ({ ...current, [name]: event.target.value }))}
        rows={5}
      />
    </label>
  );
}

function StatusFields({ selected, setField, featuredLabel }) {
  return (
    <>
      <label>
        Status
        <select value={selected.status || "draft"} onChange={(event) => setField("status", event.target.value)}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <TextField label="Sort order" type="number" value={selected.sortOrder} onChange={(value) => setField("sortOrder", value)} />
      {featuredLabel ? <CheckField label={featuredLabel} checked={selected.isFeatured} onChange={(value) => setField("isFeatured", value)} /> : null}
    </>
  );
}

function UsersOverview() {
  const { db } = useFirebaseAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [details, setDetails] = useState({});

  useEffect(() => {
    if (!db) return;

    getDocs(collection(db, "users")).then((snapshot) => {
      setUsers(snapshot.docs.map((userDoc) => ({ id: userDoc.id, ...userDoc.data() })));
    });
  }, [db]);

  async function inspectUser(userRow) {
    setSelectedUser(userRow);
    const groups = ["cart", "journeyProgress", "photoboothPhotos", "arExperiences"];
    const nextDetails = {};
    await Promise.all(
      groups.map(async (group) => {
        const snapshot = await getDocs(collection(db, "users", userRow.id, group));
        nextDetails[group] = snapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() }));
      })
    );
    setDetails(nextDetails);
  }

  return (
    <AdminLayout resource="users">
      <header className="admin-heading">
        <span>Read only</span>
        <h1>User overview</h1>
        <p>Xem profile, cart, hành trình, photobooth và AR sessions theo từng user.</p>
      </header>
      <div className="admin-manager-grid">
        <div className="admin-table">
          {users.map((userRow) => (
            <article className={selectedUser?.id === userRow.id ? "active" : ""} key={userRow.id}>
              <button type="button" onClick={() => inspectUser(userRow)}>
                <strong>{userRow.displayName || userRow.email || userRow.id}</strong>
                <span>{userRow.email || userRow.id}</span>
              </button>
            </article>
          ))}
        </div>
        <section className="admin-editor">
          <h2>{selectedUser ? selectedUser.email || selectedUser.id : "Chọn user"}</h2>
          {Object.entries(details).map(([group, rows]) => (
            <div className="admin-json-block" key={group}>
              <strong>{group}</strong>
              <pre>{JSON.stringify(rows, null, 2)}</pre>
            </div>
          ))}
        </section>
      </div>
    </AdminLayout>
  );
}

export default function AdminShell({ resource }) {
  if (resource === "dashboard") return <Dashboard />;
  if (resource === "users") return <UsersOverview />;
  if (resource === "stations") {
    return <CatalogManager resource="stations" title="Địa danh" description="Quản lý card, detail, gallery, map, AR guide và trạng thái publish." />;
  }
  if (resource === "products") {
    return <CatalogManager resource="products" title="Sản phẩm" description="Quản lý list/detail/homepage flags, ảnh chi tiết và model 3D." />;
  }
  return <CatalogManager resource="arCharacters" title="Nhân vật AR" description="Upload GLB/USDZ/poster, preview model-viewer và set default." />;
}

export { AdminLoginCard };
