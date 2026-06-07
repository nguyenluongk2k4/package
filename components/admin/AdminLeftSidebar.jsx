"use client";

import Link from "next/link";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";

const sidebarItems = [
  { href: "/admin", label: "Dashboard", resource: "dashboard", icon: "/assets/admin/left-sidebar/ic-dashboard.svg" },
  { href: "/admin/stations", label: "Địa danh", resource: "stations", icon: "/assets/admin/left-sidebar/ic-dia-danh.svg" },
  { href: "/admin/products", label: "Sản phẩm", resource: "products", icon: "/assets/admin/left-sidebar/ic-san-pham.svg" },
  { href: "/admin/ar-characters", label: "Nhân vật AR", resource: "arCharacters", icon: "/assets/admin/left-sidebar/ic-nhan-vat-ar.svg" },
  { href: "/admin/users", label: "Users", resource: "users", icon: "/assets/admin/left-sidebar/ic-user.svg" },
];

export default function AdminLeftSidebar({ resource }) {
  const { logout } = useFirebaseAuth();

  return (
    <aside className="admin-left-sidebar">
      <Link className="admin-sidebar-brand" href="/admin">
        <span className="admin-sidebar-logo-mark">
          <img src="/assets/anh-new/logo.png" alt="" />
        </span>
        <span>
          <strong>Sac Co Do</strong>
          <small>Admin Ecosystem</small>
        </span>
      </Link>

      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        {sidebarItems.map((item) => (
          <Link className={item.resource === resource ? "active" : ""} href={item.href} key={item.href}>
            <img src={item.icon} alt="" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <Link href="/admin/users">
          <img src="/assets/admin/left-sidebar/ic-ho-so.svg" alt="" />
          <span>Hồ sơ</span>
        </Link>
        <button type="button" onClick={logout}>
          <img src="/assets/admin/left-sidebar/ic-dang-xuat.svg" alt="" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
