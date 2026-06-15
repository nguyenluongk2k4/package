"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useToast } from "./ToastProvider";

const navLinks = [
  { href: "/hanh-trinh", label: "Hành trình" },
  { href: "/ho-chieu", label: "Hộ Chiếu" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/ve-chung-toi", label: "Giới thiệu" },
];

const locationDropdownItems = [
  { href: "/hanh-trinh/trang-an", label: "Tràng An" },
  { href: "/hanh-trinh/hoa-lu", label: "Cố Đô Hoa Lư" },
  { href: "/hanh-trinh/bai-dinh", label: "Chùa Bái Đính" },
  { href: "/hanh-trinh/pho-co-hoa-lu", label: "Phố Cổ Hoa Lư" },
  { href: "/hanh-trinh/tam-coc", label: "Tam Cốc - Bích Động" },
  { href: "/hanh-trinh/hang-mua", label: "Hang Múa" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logout } = useFirebaseAuth();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isHome = pathname === "/";
  const accountName = profile?.displayName || user?.displayName || user?.email?.split("@")[0];

  useEffect(() => {
    setMounted(true);
  }, []);

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
            
            <div 
              className={`dropdown-container ${dropdownOpen ? "is-open" : ""}`}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <a 
                className={`menu-link ${pathname === "/" ? "is-active" : ""}`}
                href="/"
                onClick={(e) => {
                  if (window.innerWidth <= 1024) {
                    e.preventDefault();
                  } else {
                    setMenuOpen(false);
                  }
                }}
              >
                Trang chủ <span className="dropdown-caret" style={{ display: "inline-block" }}>▼</span>
              </a>
              <div 
                className={`header-dropdown-menu ${dropdownOpen ? "active" : ""}`}
              >
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
                    {loc.label}
                  </a>
                ))}
              </div>
            </div>

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
            {mounted && user ? (
              <>
                <a className="header-account-link" href="/cua-toi">
                  {accountName}
                </a>
                <button className="header-logout-button" type="button" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <a className="header-account-link" href="/dang-nhap">
                Đăng nhập
              </a>
            )}
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
