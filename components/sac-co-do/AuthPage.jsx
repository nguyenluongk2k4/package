"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { useFirebaseAuth } from "./FirebaseAuthProvider";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, loginWithEmail, loginWithGoogle, registerWithEmail, logout, isConfigured, missingKeys } = useFirebaseAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = searchParams.get("next") || "/cua-toi";

  async function finishAuth(action) {
    setSubmitting(true);
    setMessage("");

    try {
      await action();
      router.push(redirectTo);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    await finishAuth(async () => {
      if (mode === "register") {
        return registerWithEmail(email, password, displayName);
      }

      return loginWithEmail(email, password);
    });
  }

  return (
    <>
      <SiteHeader />
      <main className="customer-auth-page">
        <section className="customer-auth-card">
          <span>Tài khoản hành trình</span>
          <h1>{user ? "Tài khoản của bạn" : mode === "register" ? "Tạo tài khoản" : "Đăng nhập"}</h1>

          {!isConfigured ? <p className="auth-alert">Thiếu Firebase env: {missingKeys.join(", ")}</p> : null}

          {user ? (
            <div className="customer-auth-profile">
              <img src={user.photoURL || "/assets/anh-new/logo.png"} alt="" />
              <div>
                <strong>{user.displayName || user.email}</strong>
                <p>{user.email}</p>
              </div>
              <button type="button" onClick={logout}>Đăng xuất</button>
            </div>
          ) : (
            <>
              <div className="auth-mode-tabs" role="tablist" aria-label="Chọn chế độ đăng nhập">
                <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
                  Đăng nhập
                </button>
                <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>
                  Đăng ký
                </button>
              </div>

              <form onSubmit={submit}>
                {mode === "register" ? (
                  <label>
                    Tên hiển thị
                    <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                  </label>
                ) : null}
                <label>
                  Email
                  <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
                </label>
                <label>
                  Mật khẩu
                  <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} required />
                </label>
                {message ? <p className="auth-alert">{message}</p> : null}
                <button type="submit" disabled={submitting || loading || !isConfigured}>
                  {submitting ? "Đang xử lý..." : mode === "register" ? "Tạo tài khoản" : "Đăng nhập"}
                </button>
              </form>

              <div className="auth-divider"><span>hoặc</span></div>
              <button
                className="google-auth-button"
                type="button"
                disabled={submitting || loading || !isConfigured}
                onClick={() => finishAuth(loginWithGoogle)}
              >
                <span aria-hidden="true">G</span>
                Tiếp tục với Google
              </button>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
