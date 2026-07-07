"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";
import {
  DEFAULT_COMMERCE_SETTINGS,
  loadCommerceSettings,
  saveCommerceSettings,
} from "../../lib/firebase/appSettings";

const PROVINCE_PAGE_SIZE = 8;
const WARD_PAGE_SIZE = 12;

const SETTINGS_FORM_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "18px 16px",
};

const SETTINGS_LABEL_STYLE = {
  display: "grid",
  gap: "8px",
  alignContent: "start",
  margin: 0,
  width: "100%",
  color: "#052c24",
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: 1.5,
};

const SETTINGS_FIELD_STYLE = {
  display: "block",
  width: "100%",
  minWidth: 0,
  minHeight: "48px",
  margin: 0,
  border: "1px solid rgba(5, 52, 44, 0.14)",
  borderRadius: "14px",
  background: "#ffffff",
  color: "#0f172a",
  padding: "0 16px",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: 500,
  lineHeight: 1.4,
  boxSizing: "border-box",
  appearance: "none",
  WebkitAppearance: "none",
};

const SETTINGS_TEXTAREA_STYLE = {
  ...SETTINGS_FIELD_STYLE,
  minHeight: "132px",
  padding: "14px 16px",
  resize: "vertical",
};

const SETTINGS_PAGINATION_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
  paddingTop: "18px",
};

const SETTINGS_PAGINATION_STATUS_STYLE = {
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 700,
};

const SETTINGS_PAGINATION_ACTIONS_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const SETTINGS_PAGINATION_BUTTON_STYLE = {
  minHeight: "42px",
  padding: "0 18px",
  border: "1px solid rgba(5, 52, 44, 0.16)",
  borderRadius: "999px",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fbf9 100%)",
  color: "#052c24",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

const SETTINGS_PAGINATION_BUTTON_DISABLED_STYLE = {
  ...SETTINGS_PAGINATION_BUTTON_STYLE,
  opacity: 0.5,
  cursor: "not-allowed",
};

const SETTINGS_ROW_ACTION_STYLE = {
  minHeight: "40px",
  padding: "0 16px",
  border: "1px solid rgba(5, 52, 44, 0.18)",
  borderRadius: "999px",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fbf9 100%)",
  color: "#052c24",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 800,
  letterSpacing: "0.01em",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
};

const SETTINGS_ROW_ACTION_ACTIVE_STYLE = {
  ...SETTINGS_ROW_ACTION_STYLE,
  border: "1px solid rgba(5, 150, 105, 0.36)",
  background: "linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)",
  color: "#065f46",
};

function formatVnd(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function EmptyState({ message }) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "14px",
        border: "1px dashed rgba(5, 52, 44, 0.16)",
        background: "#f8fafc",
        color: "#64748b",
        fontSize: "14px",
      }}
    >
      {message}
    </div>
  );
}

function Pagination({ currentPage, totalPages, totalItems, pageSize, onChange }) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="admin-pagination" style={SETTINGS_PAGINATION_STYLE}>
      <span className="admin-pagination-status" style={SETTINGS_PAGINATION_STATUS_STYLE}>
        Hiển thị {start}-{end} / {totalItems}
      </span>
      <div className="admin-pagination-actions" style={SETTINGS_PAGINATION_ACTIONS_STYLE}>
        <button type="button" className="admin-btn-secondary" style={canGoPrev ? SETTINGS_PAGINATION_BUTTON_STYLE : SETTINGS_PAGINATION_BUTTON_DISABLED_STYLE} onClick={() => onChange(currentPage - 1)} disabled={!canGoPrev}>
          Trước
        </button>
        <span className="admin-pagination-page" style={SETTINGS_PAGINATION_STATUS_STYLE}>
          Trang {currentPage} / {totalPages}
        </span>
        <button type="button" className="admin-btn-secondary" style={canGoNext ? SETTINGS_PAGINATION_BUTTON_STYLE : SETTINGS_PAGINATION_BUTTON_DISABLED_STYLE} onClick={() => onChange(currentPage + 1)} disabled={!canGoNext}>
          Sau
        </button>
      </div>
    </div>
  );
}

export default function SettingsManager() {
  const { db, isAdmin } = useFirebaseAuth();
  const [commerceSettings, setCommerceSettings] = useState(DEFAULT_COMMERCE_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [provinceRows, setProvinceRows] = useState([]);
  const [loadingAddressData, setLoadingAddressData] = useState(true);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
  const [provincePage, setProvincePage] = useState(1);
  const [wardPage, setWardPage] = useState(1);

  useEffect(() => {
    if (!db || !isAdmin) return;

    let mounted = true;

    async function loadSettings() {
      setLoadingSettings(true);
      setSettingsMessage("");
      try {
        const loaded = await loadCommerceSettings(db);
        if (!mounted) return;
        setCommerceSettings(loaded);
      } catch (error) {
        if (!mounted) return;
        console.error("Load commerce settings failed:", error);
        setSettingsMessage("Không thể tải cấu hình commerce từ Firebase.");
      } finally {
        if (mounted) setLoadingSettings(false);
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, [db, isAdmin]);

  useEffect(() => {
    let mounted = true;

    async function loadAddressData() {
      setLoadingAddressData(true);
      try {
        const response = await fetch("/data-tinh-thanh.json", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Address dataset responded ${response.status}`);
        }
        const data = await response.json();
        if (!mounted) return;

        const rows = Array.isArray(data) ? data : [];
        setProvinceRows(rows);
        if (!selectedProvinceCode && rows[0]?.Code) {
          setSelectedProvinceCode(rows[0].Code);
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Load address dataset failed:", error);
        setProvinceRows([]);
      } finally {
        if (mounted) setLoadingAddressData(false);
      }
    }

    loadAddressData();

    return () => {
      mounted = false;
    };
  }, [selectedProvinceCode]);

  const provinceStats = useMemo(() => {
    const wardCount = provinceRows.reduce((sum, item) => sum + (Array.isArray(item.Wards) ? item.Wards.length : 0), 0);
    return {
      provinceCount: provinceRows.length,
      wardCount,
    };
  }, [provinceRows]);

  const filteredProvinces = useMemo(() => {
    const keyword = provinceSearch.trim().toLowerCase();
    if (!keyword) return provinceRows;

    return provinceRows.filter((item) => {
      const haystack = [
        item.Code,
        item.Name,
        item.FullName,
        item.CodeName,
        item.AdministrativeUnitShortName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [provinceRows, provinceSearch]);

  const selectedProvince = useMemo(
    () => provinceRows.find((item) => item.Code === selectedProvinceCode) || filteredProvinces[0] || null,
    [filteredProvinces, provinceRows, selectedProvinceCode]
  );

  const filteredWards = useMemo(() => {
    const wards = Array.isArray(selectedProvince?.Wards) ? selectedProvince.Wards : [];
    const keyword = wardSearch.trim().toLowerCase();
    if (!keyword) return wards;

    return wards.filter((item) => {
      const haystack = [
        item.Code,
        item.Name,
        item.FullName,
        item.CodeName,
        item.AdministrativeUnitShortName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [selectedProvince, wardSearch]);

  const provinceTotalPages = Math.max(1, Math.ceil(filteredProvinces.length / PROVINCE_PAGE_SIZE));
  const wardTotalPages = Math.max(1, Math.ceil(filteredWards.length / WARD_PAGE_SIZE));

  const pagedProvinces = useMemo(() => {
    const start = (provincePage - 1) * PROVINCE_PAGE_SIZE;
    return filteredProvinces.slice(start, start + PROVINCE_PAGE_SIZE);
  }, [filteredProvinces, provincePage]);

  const pagedWards = useMemo(() => {
    const start = (wardPage - 1) * WARD_PAGE_SIZE;
    return filteredWards.slice(start, start + WARD_PAGE_SIZE);
  }, [filteredWards, wardPage]);

  useEffect(() => {
    setProvincePage(1);
  }, [provinceSearch]);

  useEffect(() => {
    setWardPage(1);
  }, [selectedProvinceCode, wardSearch]);

  useEffect(() => {
    if (provincePage > provinceTotalPages) {
      setProvincePage(provinceTotalPages);
    }
  }, [provincePage, provinceTotalPages]);

  useEffect(() => {
    if (wardPage > wardTotalPages) {
      setWardPage(wardTotalPages);
    }
  }, [wardPage, wardTotalPages]);

  function setCommerceField(name, value) {
    setCommerceSettings((current) => ({
      ...current,
      [name]: name === "notes" || name === "defaultProvince" ? value : Number(value),
    }));
  }

  async function submitSettings(event) {
    event.preventDefault();
    if (!db || !isAdmin) return;

    setSavingSettings(true);
    setSettingsMessage("");
    try {
      const saved = await saveCommerceSettings(db, commerceSettings);
      setCommerceSettings(saved);
      setSettingsMessage("Đã lưu cấu hình commerce. Checkout sẽ dùng phí ship mới cho các đơn tạo sau thời điểm này.");
    } catch (error) {
      console.error("Save commerce settings failed:", error);
      setSettingsMessage(error.message || "Không thể lưu cấu hình commerce.");
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <AdminLayout resource="settings">
      <header className="admin-heading">
        <span>System</span>
        <h1>Cấu hình vận hành</h1>
        <p>Quản lý thông số commerce như phí ship và tra cứu bộ địa giới hành chính mới từ dữ liệu đã có trong hệ thống.</p>
      </header>

      <div className="admin-user-stats" style={{ marginBottom: "24px" }}>
        <div className="admin-user-stat-card">
          <span>Phí ship hiện tại</span>
          <strong>{formatVnd(commerceSettings.baseShippingFee)}</strong>
          <small>áp dụng cho đơn mới</small>
        </div>
        <div className="admin-user-stat-card">
          <span>Miễn ship từ</span>
          <strong>{formatVnd(commerceSettings.freeShippingThreshold)}</strong>
          <small>0 = không dùng</small>
        </div>
        <div className="admin-user-stat-card">
          <span>Tỉnh / thành</span>
          <strong>{provinceStats.provinceCount}</strong>
          <small>đọc từ file JSON</small>
        </div>
        <div className="admin-user-stat-card">
          <span>Phường / xã</span>
          <strong>{provinceStats.wardCount}</strong>
          <small>theo dữ liệu địa giới mới</small>
        </div>
      </div>

      <div className="admin-user-section-grid">
        <section className="admin-user-section admin-settings-section">
          <div className="admin-user-section-head">
            <h3>Cấu hình commerce</h3>
          </div>

          {loadingSettings ? <EmptyState message="Đang tải cấu hình commerce..." /> : null}

          {!loadingSettings ? (
            <form onSubmit={submitSettings} className="admin-user-form-grid admin-settings-form" style={SETTINGS_FORM_STYLE}>
              <label style={SETTINGS_LABEL_STYLE}>
                Phí ship mặc định
                <input
                  style={SETTINGS_FIELD_STYLE}
                  type="number"
                  min="0"
                  step="1000"
                  value={commerceSettings.baseShippingFee}
                  onChange={(event) => setCommerceField("baseShippingFee", event.target.value)}
                  placeholder="0"
                />
              </label>

              <label style={SETTINGS_LABEL_STYLE}>
                Ngưỡng miễn ship
                <input
                  style={SETTINGS_FIELD_STYLE}
                  type="number"
                  min="0"
                  step="1000"
                  value={commerceSettings.freeShippingThreshold}
                  onChange={(event) => setCommerceField("freeShippingThreshold", event.target.value)}
                  placeholder="0"
                />
              </label>

              <label style={{ ...SETTINGS_LABEL_STYLE, gridColumn: "1 / -1" }}>
                Tỉnh / thành mặc định
                <select
                  style={SETTINGS_FIELD_STYLE}
                  value={commerceSettings.defaultProvince}
                  onChange={(event) => setCommerceField("defaultProvince", event.target.value)}
                >
                  <option value="">Chưa chọn</option>
                  {provinceRows.map((item) => (
                    <option key={item.Code} value={item.FullName || item.Name}>
                      {item.FullName || item.Name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ ...SETTINGS_LABEL_STYLE, gridColumn: "1 / -1" }}>
                Ghi chú vận hành
                <textarea
                  style={SETTINGS_TEXTAREA_STYLE}
                  value={commerceSettings.notes}
                  onChange={(event) => setCommerceField("notes", event.target.value)}
                  placeholder="Ví dụ: tạm miễn ship cho giai đoạn soft launch..."
                />
              </label>

              <div className="admin-form-actions admin-settings-actions" style={{ gridColumn: "1 / -1", paddingTop: "4px" }}>
                <button type="submit" className="admin-btn-primary" disabled={savingSettings}>
                  {savingSettings ? "Đang lưu..." : "Lưu cấu hình"}
                </button>
              </div>
            </form>
          ) : null}

          {settingsMessage ? <p className="admin-editor-message">{settingsMessage}</p> : null}
        </section>
      </div>

      <section className="admin-user-section" style={{ marginTop: "20px" }}>
        <div className="admin-user-section-head">
          <h3>Bảng tỉnh / thành</h3>
          <span>{filteredProvinces.length} / {provinceRows.length} bản ghi</span>
        </div>

        <div className="admin-toolbar" style={{ flexWrap: "wrap" }}>
          <div className="admin-search-wrapper">
            <img src="/assets/ic-search.svg" className="admin-search-icon" alt="" />
            <input
              placeholder="Tìm tỉnh / thành theo tên, mã, codeName..."
              value={provinceSearch}
              onChange={(event) => setProvinceSearch(event.target.value)}
            />
          </div>
        </div>

        {loadingAddressData ? <EmptyState message="Đang tải dữ liệu tỉnh / thành..." /> : null}
        {!loadingAddressData && filteredProvinces.length === 0 ? <EmptyState message="Không tìm thấy tỉnh / thành phù hợp." /> : null}
        {!loadingAddressData && filteredProvinces.length > 0 ? (
          <>
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Tỉnh / thành</th>
                    <th>Loại đơn vị</th>
                    <th>Phường / xã</th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedProvinces.map((item) => (
                    <tr key={item.Code}>
                      <td style={{ whiteSpace: "nowrap", fontWeight: 700 }}>{item.Code}</td>
                      <td>
                        <div style={{ display: "grid", gap: "2px" }}>
                          <strong style={{ color: "#0f172a" }}>{item.FullName || item.Name}</strong>
                          <span style={{ color: "#64748b", fontSize: "12px" }}>{item.CodeName || item.NameEn}</span>
                        </div>
                      </td>
                      <td>{item.AdministrativeUnitShortName || item.Type}</td>
                      <td>{Array.isArray(item.Wards) ? item.Wards.length : 0}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-table-action"
                          style={selectedProvinceCode === item.Code ? SETTINGS_ROW_ACTION_ACTIVE_STYLE : SETTINGS_ROW_ACTION_STYLE}
                          onClick={() => setSelectedProvinceCode(item.Code)}
                        >
                          Xem phường / xã
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={provincePage}
              totalPages={provinceTotalPages}
              totalItems={filteredProvinces.length}
              pageSize={PROVINCE_PAGE_SIZE}
              onChange={setProvincePage}
            />
          </>
        ) : null}
      </section>

      <section className="admin-user-section" style={{ marginTop: "20px" }}>
        <div className="admin-user-section-head">
          <h3>Phường / xã thuộc {selectedProvince?.FullName || selectedProvince?.Name || "..."}</h3>
          <span>{filteredWards.length} bản ghi</span>
        </div>

        <div className="admin-toolbar" style={{ flexWrap: "wrap" }}>
          <div className="admin-search-wrapper">
            <img src="/assets/ic-search.svg" className="admin-search-icon" alt="" />
            <input
              placeholder="Tìm phường / xã theo tên, mã..."
              value={wardSearch}
              onChange={(event) => setWardSearch(event.target.value)}
            />
          </div>
        </div>

        {!selectedProvince ? <EmptyState message="Chưa có tỉnh / thành nào được chọn." /> : null}
        {selectedProvince && filteredWards.length === 0 ? <EmptyState message="Không tìm thấy phường / xã phù hợp." /> : null}
        {selectedProvince && filteredWards.length > 0 ? (
          <>
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Phường / xã</th>
                    <th>Loại đơn vị</th>
                    <th>CodeName</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedWards.map((item) => (
                    <tr key={item.Code}>
                      <td style={{ whiteSpace: "nowrap", fontWeight: 700 }}>{item.Code}</td>
                      <td>
                        <div style={{ display: "grid", gap: "2px" }}>
                          <strong style={{ color: "#0f172a" }}>{item.FullName || item.Name}</strong>
                          <span style={{ color: "#64748b", fontSize: "12px" }}>{item.NameEn || item.Name}</span>
                        </div>
                      </td>
                      <td>{item.AdministrativeUnitShortName || item.Type}</td>
                      <td>{item.CodeName || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={wardPage}
              totalPages={wardTotalPages}
              totalItems={filteredWards.length}
              pageSize={WARD_PAGE_SIZE}
              onChange={setWardPage}
            />
          </>
        ) : null}
      </section>
    </AdminLayout>
  );
}
