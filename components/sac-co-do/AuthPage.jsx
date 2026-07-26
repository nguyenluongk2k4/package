"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useToast } from "./ToastProvider";
import { translate, useI18n } from "./I18nProvider";
import authDict from "../../locales/auth.json";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, loginWithEmail, loginWithGoogle, registerWithEmail, logout, isConfigured, missingKeys } = useFirebaseAuth();
  const { showToast } = useToast();
  const { locale, t } = useI18n();
  const ta = (key) => translate(authDict, locale, key);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = searchParams.get("next") || "/cua-toi";

  async function finishAuth(action, successMessage = ta("toast.loginSuccess")) {
    setSubmitting(true);
    setMessage("");

    try {
      await action();
      showToast(successMessage, "success");
      router.push(redirectTo);
    } catch (error) {
      setMessage(error.message);
      showToast(error.message || ta("toast.genericError"), "error");
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
    }, mode === "register" ? ta("toast.registerSuccess") : ta("toast.loginSuccess"));
  }

  return (
    <>
      <SiteHeader />
      <main className="customer-auth-page">
        <div className="customer-auth-logo">
          <img src="/assets/anh-new/logo.png" alt={t("header.brand")} />
          <span>{ta("brandLabel")}</span>
        </div>
        <section className="customer-auth-card">
          <h1>{user ? ta("titleAccount") : mode === "register" ? ta("titleRegister") : ta("titleLogin")}</h1>

          {!isConfigured ? <p className="auth-alert">{ta("missingFirebase")} {missingKeys.join(", ")}</p> : null}

          {user ? (
            <div className="customer-auth-profile">
              <img src={user.photoURL || "/assets/anh-new/logo.png"} alt="" />
              <div>
                <strong>{user.displayName || user.email}</strong>
                <p>{user.email}</p>
              </div>
              <button type="button" onClick={logout}>{ta("logout")}</button>
            </div>
          ) : (
            <>
              <div className="auth-mode-tabs" role="tablist" aria-label={ta("tabsAria")}>
                <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
                  {ta("tabLogin")}
                </button>
                <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>
                  {ta("tabRegister")}
                </button>
              </div>

              <form onSubmit={submit} suppressHydrationWarning>
                {mode === "register" ? (
                  <div className="customer-auth-field">
                    <label>{ta("displayNameLabel")}</label>
                    <div className="customer-input-with-icon">
                      <span className="customer-input-icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </span>
                      <input suppressHydrationWarning value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                    </div>
                  </div>
                ) : null}
                <div className="customer-auth-field">
                  <label>{ta("emailLabel")}</label>
                  <div className="customer-input-with-icon">
                    <span className="customer-input-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="m22 6-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <input suppressHydrationWarning value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" required />
                  </div>
                </div>
                <div className="customer-auth-field">
                  <label>{ta("passwordLabel")}</label>
                  <div className="customer-input-with-icon">
                    <span className="customer-input-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <input
                      suppressHydrationWarning
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      className={`auth-password-toggle ${showPassword ? "is-visible" : ""}`}
                      aria-label={showPassword ? ta("hidePassword") : ta("showPassword")}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M17.94 17.94A10.1 10.1 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {message ? <p className="auth-alert">{message}</p> : null}
                <button type="submit" disabled={submitting || loading || !isConfigured}>
                  {submitting ? ta("submitting") : mode === "register" ? ta("submitRegister") : ta("submitLogin")}
                </button>
              </form>

              <div className="auth-divider"><span>{ta("orDivider")}</span></div>
              <button
                className="google-auth-button"
                type="button"
                disabled={submitting || !isConfigured}
                onClick={() => finishAuth(loginWithGoogle, ta("toast.googleSuccess"))}
              >
                <img src="/logo-google.jpg" alt="" aria-hidden="true" />
                {ta("continueWithGoogle")}
              </button>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
