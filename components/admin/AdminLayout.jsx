"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeaderBar from "./AdminHeaderBar";
import AdminLeftSidebar from "./AdminLeftSidebar";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";
import { useToast } from "../sac-co-do/ToastProvider";

export function AdminLoginCard() {
  const { loginWithEmail, isConfigured, missingKeys, authError, user } = useFirebaseAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/admin");
    }
  }, [user, router]);

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
        <div className="admin-login-logo">
          <img src="/assets/anh-new/logo.png" alt="Sắc Cố Đô" />
          <span>ADMIN ECOSYSTEM</span>
        </div>

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
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="admin@saccodo.vn" required />
              </div>
            </div>

            <div className="form-group">
              <div className="label-wrapper">
                <label>Mật khẩu</label>
                <a href="#" className="forgot-password" onClick={(event) => { event.preventDefault(); showToast("Vui lòng liên hệ Admin tối cao để khôi phục mật khẩu.", "info"); }}>Quên mật khẩu?</a>
              </div>
              <div className="input-with-icon">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} placeholder="********" required />
                <button
                  type="button"
                  className="password-toggle-btn"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M17.94 17.94A10.1 10.1 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
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

        <footer className="admin-login-footer">© 2024 Sac Co Do Admin. Bảo lưu mọi quyền.</footer>
      </div>
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

export default function AdminLayout({ resource, children, contentClassName = "admin-content" }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("admin-sidebar-collapsed");
    if (saved === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((current) => {
      const next = !current;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("admin-sidebar-collapsed", String(next));
      }
      return next;
    });
  }

  return (
    <AdminGate>
      <main className={`admin-page${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}>
        <AdminLeftSidebar resource={resource} collapsed={sidebarCollapsed} onToggleSidebar={toggleSidebarCollapsed} />
        <div className="admin-main-shell">
          <AdminHeaderBar resource={resource} />
          <section className={contentClassName}>{children}</section>
        </div>
      </main>
    </AdminGate>
  );
}
