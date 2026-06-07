"use client";

const titleByResource = {
  dashboard: "Quản trị hệ thống",
  stations: "Quản lý địa danh",
  products: "Quản lý sản phẩm",
  arCharacters: "Quản lý nhân vật AR",
  users: "Quản lý người dùng",
};

export default function AdminHeaderBar({ resource }) {
  return (
    <header className="admin-header-bar">
      <h1>{titleByResource[resource] || "Quản trị hệ thống"}</h1>

      <div className="admin-header-actions">
        <label className="admin-header-search">
          <img src="/assets/admin/dashboard/ic-search.svg" alt="" />
          <input type="search" placeholder="Tìm kiếm dữ liệu..." />
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
