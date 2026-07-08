"use client";

const titleByResource = {
  dashboard: "Quản trị hệ thống",
  stations: "Quản lý địa danh",
  products: "Quản lý sản phẩm",
  orders: "Quản lý đơn hàng",
  arCharacters: "Quản lý nhân vật AR",
  users: "Quản lý người dùng",
  activationCodes: "Quản lý mã kích hoạt",
  settings: "Cấu hình vận hành",
};

const placeholderByResource = {
  dashboard: "Tìm kiếm dữ liệu...",
  stations: "Tìm kiếm địa danh...",
  products: "Tìm kiếm sản phẩm...",
  orders: "Tìm kiếm đơn hàng...",
  arCharacters: "Tìm kiếm nhân vật...",
  users: "Tìm kiếm người dùng...",
  activationCodes: "Tìm kiếm mã kích hoạt...",
  settings: "Tìm kiếm cấu hình...",
};

export default function AdminHeaderBar({ resource, onToggleMobileSidebar }) {
  return (
    <header className="admin-header-bar">
      <div className="admin-header-title">
        <button
          className="admin-mobile-menu-toggle"
          type="button"
          aria-label="Menu"
          onClick={onToggleMobileSidebar}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="24" height="24">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1>{titleByResource[resource] || "Quản trị hệ thống"}</h1>
      </div>

      <div className="admin-header-actions">
        <label className="admin-header-search">
          <img src="/assets/admin/dashboard/ic-search.svg" alt="" />
          <input type="search" placeholder={placeholderByResource[resource] || "Tìm kiếm dữ liệu..."} />
        </label>

        <button className="admin-header-icon-button" type="button" aria-label="Thông báo">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        <button className="admin-header-icon-button" type="button" aria-label="Trợ giúp">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.1 9a3 3 0 1 1 4.9 2.3c-1.1.7-1.7 1.4-1.7 2.7" />
            <path d="M12 17.5h.01" />
          </svg>
        </button>

        <button className="admin-header-create" type="button">
          <span aria-hidden="true">+</span>
          Tạo mới
        </button>
      </div>
    </header>
  );
}
