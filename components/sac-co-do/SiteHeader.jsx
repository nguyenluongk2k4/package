"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useToast } from "./ToastProvider";

const navLinks = [
  { href: "/hanh-trinh", label: "Hành trình" },
  { href: "/ho-chieu", label: "Hộ Chiếu" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/ve-chung-toi", label: "Giới thiệu" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logout } = useFirebaseAuth();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/";
  const accountName = profile?.displayName || user?.displayName || user?.email?.split("@")[0];

  async function handleLogout() {
    try {
      await logout();
      showToast("Đăng xuất thành công!", "success");
      setMenuOpen(false);

      if (pathname === "/cua-toi") {
        router.push("/dang-nhap");
      }
    } catch (error) {
      showToast(error.message || "Không thể đăng xuất. Vui lòng thử lại.", "error");
    }
  }

  return (
    <header className={`site-header template-header ${isHome ? "header-home" : "header-inner"}`}>
      <div className="header-navigation">
        <div className="primary-menu">
          <a className="brand-mark nav-brand" href="/" aria-label="Sắc Cố Đô">
            <img src="/assets/anh-new/logo.png" alt="Sắc Cố Đô" />
          </a>

          <nav className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="Điều hướng chính">
            <a className="mobile-logo" href="/" onClick={() => setMenuOpen(false)} aria-label="Sắc Cố Đô">
              <img src="/assets/anh-new/logo.png" alt="Sắc Cố Đô" />
            </a>
            {navLinks.map((item) => (
              <a
                className={`menu-link ${pathname === item.href ? "is-active" : ""}`}
                href={item.href}
                key={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="nav-right-item">
            <a className="header-icon-button" href="/hanh-trinh" aria-label="Tìm hành trình">
              <img src="/assets/ic-search.svg" alt="" aria-hidden="true" />
            </a>
            <a className="header-icon-button" href="/ve-chung-toi" aria-label="Thông tin dự án">
              <img src="/assets/ic-language.svg" alt="" aria-hidden="true" />
            </a>
            <a className="header-icon-button header-cart-link" href="/gio-hang" aria-label="Giỏ hàng">
              <img src="/assets/ic-gio-hang.svg" alt="" aria-hidden="true" />
            </a>
            <a className="header-account-link" href={user ? "/cua-toi" : "/dang-nhap"}>
              {user ? accountName : "Đăng nhập"}
            </a>
            {user ? (
              <button className="header-logout-button" type="button" onClick={handleLogout}>
                Đăng xuất
              </button>
            ) : null}
            <a className="header-cta" href="/kich-hoat">
              Bắt đầu
            </a>
            <button
              className={`navbar-toggler ${menuOpen ? "is-open" : ""}`}
              type="button"
              aria-label="Mở menu"
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
