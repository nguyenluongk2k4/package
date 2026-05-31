"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/hanh-trinh", label: "Hành trình" },
  { href: "/san-pham", label: "Hộ chiếu" },
  { href: "/ve-chung-toi", label: "Giới thiệu" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/";

  return (
    <header className={`site-header template-header ${isHome ? "header-home" : "header-inner"}`}>
      <div className="header-navigation">
        <div className="primary-menu">
          <a className="brand-mark nav-brand" href="/" aria-label="Sắc Cố Đô">
            <img src="/assets/logo.png" alt="Sắc Cố Đô" />
            <span className="brand-wordmark">Sắc Cố Đô</span>
          </a>

          <nav className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="Điều hướng chính">
            <a className="mobile-logo" href="/" onClick={() => setMenuOpen(false)} aria-label="Sắc Cố Đô">
              <img src="/assets/logo.png" alt="Sắc Cố Đô" />
              <span className="brand-wordmark">Sắc Cố Đô</span>
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
              <span aria-hidden="true">⌕</span>
            </a>
            <a className="header-icon-button" href="/ve-chung-toi" aria-label="Thông tin dự án">
              <span aria-hidden="true">◎</span>
            </a>
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
