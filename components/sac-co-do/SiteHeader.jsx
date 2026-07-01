"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useI18n } from "./I18nProvider";
import { useToast } from "./ToastProvider";
import { Lock } from "lucide-react";

const navLinks = [
  { href: "/ve-chung-toi", labelKey: "header.nav.about" },
  { href: "/hanh-trinh", labelKey: "header.nav.journey" },
  { href: "/ho-chieu", labelKey: "header.nav.passport" },
  { href: "/san-pham", labelKey: "header.nav.products" },
];

const locationDropdownItems = [
  { href: "/dia-danh/trang-an", labelKey: "header.locations.trangAn" },
  { href: "/dia-danh/hoa-lu", labelKey: "header.locations.hoaLu" },
  { href: "/dia-danh/bai-dinh", labelKey: "header.locations.baiDinh" },
  { href: "/dia-danh/pho-co-hoa-lu", labelKey: "header.locations.phoCoHoaLu" },
  { href: "/dia-danh/tam-coc", labelKey: "header.locations.tamCoc" },
  { href: "/dia-danh/hang-mua", labelKey: "header.locations.hangMua" },
];

function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "U";
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logout } = useFirebaseAuth();
  const { locale, locales, setLocale, t } = useI18n();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isHome = pathname === "/";
  const accountName = profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "User";
  const accountPhoto = profile?.photoURL || user?.photoURL;

  const headerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll-driven morph: sets --scroll-t (0→1) over first 200px
  useEffect(() => {
    const THRESHOLD = 200;
    const onScroll = () => {
      const t = Math.min(window.scrollY / THRESHOLD, 1);
      if (headerRef.current) {
        headerRef.current.style.setProperty("--scroll-t", t.toFixed(3));
      }
    };
    onScroll(); // set initial value
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
    setLanguageOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try {
      await logout();
      showToast(t("header.toast.logoutSuccess"), "success");
      setMenuOpen(false);
      setAccountOpen(false);

      if (pathname === "/cua-toi") {
        router.push("/dang-nhap");
      }
    } catch (error) {
      showToast(error.message || t("header.toast.logoutError"), "error");
    }
  }

  return (
    <header
      ref={headerRef}
      className={`site-header template-header ${isHome ? "header-home" : "header-inner"}`}
    >
      <div className="header-navigation">
        <div className="primary-menu">
          <a className="brand-mark nav-brand" href="/" aria-label={t("header.brand")}>
            <img src="/assets/anh-new/logo.png" alt={t("header.brand")} />
          </a>

          <nav className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
            <a className="mobile-logo" href="/" onClick={() => setMenuOpen(false)} aria-label={t("header.brand")}>
              <img src="/assets/anh-new/logo.png" alt={t("header.brand")} />
            </a>

            <button
              className="mobile-menu-close"
              type="button"
              aria-label={t("header.actions.closeMenu")}
              onClick={() => {
                setMenuOpen(false);
                setDropdownOpen(false);
              }}
            >
              <span />
              <span />
            </button>

            <div
              className={`dropdown-container ${dropdownOpen ? "is-open" : ""}`}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <a
                className={`menu-link ${pathname === "/" ? "is-active" : ""}`}
                href="/"
                onClick={() => {
                  setMenuOpen(false);
                  setDropdownOpen(false);
                }}
              >
                {t("header.nav.home")}
              </a>
              <button
                className="dropdown-toggle-button"
                type="button"
                aria-label={t("header.actions.openLocations")}
                aria-expanded={dropdownOpen}
                onClick={() => setDropdownOpen((value) => !value)}
              >
                <span className="dropdown-caret" style={{ display: "inline-block" }}>
                  ▼
                </span>
              </button>
              <div className={`header-dropdown-menu ${dropdownOpen ? "active" : ""}`}>
                {locationDropdownItems.map((loc) => (
                  <a
                    key={loc.href}
                    href={loc.href}
                    className="dropdown-item"
                    onClick={() => {
                      setMenuOpen(false);
                      setDropdownOpen(false);
                    }}
                  >
                    {t(loc.labelKey)}
                  </a>
                ))}
              </div>
            </div>

            {navLinks.map((item) => {
              const isLocked = item.href === "/hanh-trinh" && (!user || !profile?.isActivated);
              return (
                <a
                  className={`menu-link ${pathname === item.href ? "is-active" : ""} ${isLocked ? "is-locked-link" : ""}`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {isLocked ? (
                    <>
                      <Lock size={13} className="nav-lock-icon" />
                      <span>{t(item.labelKey)}</span>
                    </>
                  ) : (
                    t(item.labelKey)
                  )}
                </a>
              );
            })}
          </nav>

          <div className="nav-right-item">
            <div className={`header-dropdown-control language-switcher ${languageOpen ? "is-open" : ""}`}>
              <button
                className="header-icon-button"
                type="button"
                aria-label={t("header.actions.language")}
                aria-expanded={languageOpen}
                onClick={() => {
                  setLanguageOpen((value) => !value);
                  setAccountOpen(false);
                }}
              >
                <img src="/assets/ic-language.svg" alt="" aria-hidden="true" />
              </button>
              <div className="header-popover-menu">
                {locales.map((item) => (
                  <button
                    className={`header-popover-item ${locale === item ? "is-active" : ""}`}
                    type="button"
                    key={item}
                    onClick={() => {
                      setLocale(item);
                      setLanguageOpen(false);
                    }}
                  >
                    {t(`language.${item}`)}
                  </button>
                ))}
              </div>
            </div>
            <a className="header-icon-button header-cart-link" href="/gio-hang" aria-label={t("header.actions.cart")}>
              <img src="/assets/ic-gio-hang.svg" alt="" aria-hidden="true" />
            </a>
            {mounted && user ? (
              <div className={`header-dropdown-control account-menu ${accountOpen ? "is-open" : ""}`}>
                <button
                  className="header-avatar-button"
                  type="button"
                  aria-label={t("header.account.open")}
                  aria-expanded={accountOpen}
                  onClick={() => {
                    setAccountOpen((value) => !value);
                    setLanguageOpen(false);
                  }}
                >
                  {accountPhoto ? (
                    <img src={accountPhoto} alt="" aria-hidden="true" />
                  ) : (
                    <span>{getInitials(accountName)}</span>
                  )}
                </button>
                <div className="header-popover-menu account-popover">
                  <div className="account-popover-summary">
                    <strong>{accountName}</strong>
                    {user?.email ? <small>{user.email}</small> : null}
                  </div>
                  <a className="header-popover-item" href="/cua-toi">
                    {t("header.account.profile")}
                  </a>
                  <button className="header-popover-item danger" type="button" onClick={handleLogout}>
                    {t("header.account.logout")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <a className="header-account-link" href="/dang-nhap">
                  {t("header.account.login")}
                </a>
                <a className="header-avatar-button header-login-avatar" href="/dang-nhap" aria-label={t("header.account.login")}>
                  <span>U</span>
                </a>
              </>
            )}
            <a className="header-cta" href="/kich-hoat">
              {t("header.actions.start")}
            </a>
            <button
              className={`navbar-toggler ${menuOpen ? "is-open" : ""}`}
              type="button"
              aria-label={t("header.actions.openMenu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
