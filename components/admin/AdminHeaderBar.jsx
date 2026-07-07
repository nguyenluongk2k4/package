"use client";

const titleByResource = {
  dashboard: "Quan tri he thong",
  stations: "Quan ly dia danh",
  products: "Quan ly san pham",
  orders: "Quan ly don hang",
  arCharacters: "Quan ly nhan vat AR",
  users: "Quan ly nguoi dung",
  activationCodes: "Quan ly ma kich hoat",
  settings: "Cau hinh van hanh",
};

const placeholderByResource = {
  dashboard: "Tim kiem du lieu...",
  stations: "Tim kiem dia danh...",
  products: "Tim kiem san pham...",
  orders: "Tim kiem don hang...",
  arCharacters: "Tim kiem nhan vat...",
  users: "Tim kiem nguoi dung...",
  activationCodes: "Tim kiem ma kich hoat...",
  settings: "Tim kiem cau hinh...",
};

export default function AdminHeaderBar({ resource }) {
  return (
    <header className="admin-header-bar">
      <div className="admin-header-title">
        <h1>{titleByResource[resource] || "Quan tri he thong"}</h1>
      </div>

      <div className="admin-header-actions">
        <label className="admin-header-search">
          <img src="/assets/admin/dashboard/ic-search.svg" alt="" />
          <input type="search" placeholder={placeholderByResource[resource] || "Tim kiem du lieu..."} />
        </label>

        <button className="admin-header-icon-button" type="button" aria-label="Thong bao">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        <button className="admin-header-icon-button" type="button" aria-label="Tro giup">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.1 9a3 3 0 1 1 4.9 2.3c-1.1.7-1.7 1.4-1.7 2.7" />
            <path d="M12 17.5h.01" />
          </svg>
        </button>

        <button className="admin-header-create" type="button">
          <span aria-hidden="true">+</span>
          Tao moi
        </button>
      </div>
    </header>
  );
}
