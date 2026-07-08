"use client";

import Link from "next/link";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";

const sidebarItems = [
  { href: "/admin", label: "Bảng điều khiển", resource: "dashboard", icon: "/assets/admin/left-sidebar/ic-dashboard.svg" },
  { href: "/admin/stations", label: "Địa danh", resource: "stations", icon: "/assets/admin/left-sidebar/ic-dia-danh.svg" },
  { href: "/admin/products", label: "Sản phẩm", resource: "products", icon: "/assets/admin/left-sidebar/ic-san-pham.svg" },
  { href: "/admin/orders", label: "Đơn hàng", resource: "orders", icon: "/assets/admin/left-sidebar/ic-san-pham.svg" },
  { href: "/admin/ar-characters", label: "Nhân vật AR", resource: "arCharacters", icon: "/assets/admin/left-sidebar/ic-nhan-vat-ar.svg" },
  { href: "/admin/users", label: "Người dùng", resource: "users", icon: "/assets/admin/left-sidebar/ic-user.svg" },
  { href: "/admin/activation-codes", label: "Mã kích hoạt", resource: "activationCodes", icon: "/assets/admin/left-sidebar/ic-user.svg" },
  { href: "/admin/settings", label: "Cấu hình", resource: "settings", icon: "/assets/admin/left-sidebar/ic-dashboard.svg" },
];

export default function AdminLeftSidebar({ resource, collapsed, onToggleSidebar, isMobileOpen, onCloseMobileSidebar }) {
  const { logout } = useFirebaseAuth();

  const handleCollapseClick = () => {
    if (isMobileOpen && onCloseMobileSidebar) {
      onCloseMobileSidebar();
    } else if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  return (
    <aside className={`admin-left-sidebar${collapsed ? " is-collapsed" : ""}${isMobileOpen ? " is-mobile-open" : ""}`}>
      <div className="admin-sidebar-top">
        <Link className="admin-sidebar-brand" href="/admin">
          <span className="">
            <img src="/assets/anh-new/logo.png" alt="" />
          </span>
          <span className="admin-sidebar-brand-copy">
            <h3>Sắc Cố Đô</h3>
          </span>
        </Link>

        <div className="admin-sidebar-top-actions">
          <button
            className="admin-sidebar-collapse"
            type="button"
            aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            aria-pressed={collapsed}
            onClick={handleCollapseClick}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {collapsed ? (
                <>
                  <path d="M9 6l6 6-6 6" />
                  <path d="M5 5v14" />
                </>
              ) : (
                <>
                  <path d="M15 6l-6 6 6 6" />
                  <path d="M19 5v14" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        {sidebarItems.map((item) => (
          <Link className={item.resource === resource ? "active" : ""} href={item.href} key={item.href}>
            <img src={item.icon} alt="" />
            <span className="admin-sidebar-link-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <Link href="/admin/users">
          <img src="/assets/admin/left-sidebar/ic-ho-so.svg" alt="" />
          <span className="admin-sidebar-link-label">Hồ sơ</span>
        </Link>
        <button type="button" onClick={logout}>
          <img src="/assets/admin/left-sidebar/ic-dang-xuat.svg" alt="" />
          <span className="admin-sidebar-link-label">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
