"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { brand } from "../../data/sac-co-do";

const menuGroups = [
  {
    label: "Trang chủ",
    links: [
      { href: "/", label: "Home 01" },
      { href: "/#cach-hoat-dong", label: "Cách hoạt động" },
      { href: "/#san-pham-noi-bat", label: "Sản phẩm nổi bật" },
      { href: "/#tram-trai-nghiem", label: "6 trạm trải nghiệm" },
    ],
  },
  {
    label: "Sản phẩm",
    links: [
      { href: "/san-pham", label: "Chi tiết passport" },
      { href: "/gio-hang", label: "Giỏ hàng" },
      { href: "/cua-toi", label: "Passport của tôi" },
    ],
  },
  {
    label: "Hành trình",
    links: [
      { href: "/hanh-trinh", label: "Bản đồ 6 trạm" },
      { href: "/checkin/trang-an", label: "Check-in Tràng An" },
      { href: "/photobooth", label: "Photobooth" },
    ],
  },
  {
    label: "Kích hoạt",
    links: [
      { href: "/kich-hoat", label: "Kích hoạt ID" },
      { href: "/phan-thuong", label: "Phần thưởng" },
    ],
  },
  {
    label: "Dự án",
    links: [
      { href: "/ve-chung-toi", label: "Về chúng tôi" },
      { href: "/photobooth", label: "Thư viện ảnh" },
      { href: "/hanh-trinh", label: "Điểm đến" },
    ],
  },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/";

  return (
    <header className={`site-header template-header ${isHome ? "header-home" : "header-inner"}`}>
      {!isHome ? (
        <div className="header-top-bar">
          <a className="brand-mark top-brand" href="/">
            <span className="brand-symbol">S</span>
            <span>
              <strong>{brand.name}</strong>
              <small>{brand.tagline}</small>
            </span>
          </a>
          <div className="header-info">
            <span>Ninh Bình</span>
            <a href="mailto:hello@saccodo.vn">hello@saccodo.vn</a>
            <a href="tel:+84901234567">+84 901 234 567</a>
          </div>
        </div>
      ) : null}

      <div className="header-navigation">
        <div className="primary-menu">
          <a className="brand-mark nav-brand" href="/">
            <span className="brand-symbol">S</span>
            <span>
              <strong>{brand.name}</strong>
              <small>{brand.tagline}</small>
            </span>
          </a>

          <nav className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="Điều hướng chính">
            <a className="mobile-logo" href="/" onClick={() => setMenuOpen(false)}>
              {brand.name}
            </a>
            {menuGroups.map((group) => (
              <div className="menu-item has-children" key={group.label}>
                <button className="menu-link" type="button">
                  {group.label}
                </button>
                <ul className="sub-menu">
                  {group.links.map((item) => (
                    <li key={item.href + item.label}>
                      <a href={item.href} onClick={() => setMenuOpen(false)}>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="nav-right-item">
            <a className="header-search" href="/hanh-trinh" aria-label="Tìm hành trình">
              Search
            </a>
            <a className="header-cta" href="/kich-hoat">
              Kích hoạt
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
