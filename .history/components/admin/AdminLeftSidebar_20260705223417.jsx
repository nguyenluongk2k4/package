"use client";

import Link from "next/link";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";

const sidebarItems = [
  { href: "/admin", label: "Dashboard", resource: "dashboard", icon: "/assets/admin/left-sidebar/ic-dashboard.svg" },
  { href: "/admin/stations", label: "Dia danh", resource: "stations", icon: "/assets/admin/left-sidebar/ic-dia-danh.svg" },
  { href: "/admin/products", label: "San pham", resource: "products", icon: "/assets/admin/left-sidebar/ic-san-pham.svg" },
  { href: "/admin/orders", label: "Orders", resource: "orders", icon: "/assets/admin/left-sidebar/ic-san-pham.svg" },
  { href: "/admin/ar-characters", label: "Nhan vat AR", resource: "arCharacters", icon: "/assets/admin/left-sidebar/ic-nhan-vat-ar.svg" },
  { href: "/admin/users", label: "Users", resource: "users", icon: "/assets/admin/left-sidebar/ic-user.svg" },
  { href: "/admin/activation-codes", label: "Activation Codes", resource: "activationCodes", icon: "/assets/admin/left-sidebar/ic-user.svg" },
  { href: "/admin/settings", label: "Cau hinh", resource: "settings", icon: "/assets/admin/left-sidebar/ic-dashboard.svg" },
];

export default function AdminLeftSidebar({ resource, collapsed, onToggleSidebar }) {
  const { logout } = useFirebaseAuth();

  return (
    <aside className={`admin-left-sidebar${collapsed ? " is-collapsed" : ""}`}>
      <div className="admin-sidebar-top">
        <Link className="admin-sidebar-brand" href="/admin">
          <span className="">
            <img src="/assets/anh-new/logo.png" alt="" />
          </span>
          <span className="admin-sidebar-brand-copy">
            <h3>Sac Co Do</h3>
          </span>
        </Link>

        <button
          className="admin-sidebar-collapse"
          type="button"
          aria-label={collapsed ? "Mo rong sidebar" : "Thu gon sidebar"}
          aria-pressed={collapsed}
          onClick={onToggleSidebar}
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
          <span className="admin-sidebar-link-label">Ho so</span>
        </Link>
        <button type="button" onClick={logout}>
          <img src="/assets/admin/left-sidebar/ic-dang-xuat.svg" alt="" />
          <span className="admin-sidebar-link-label">Dang xuat</span>
        </button>
      </div>
    </aside>
  );
}
