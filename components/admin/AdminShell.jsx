"use client";

import CatalogManager from "./CatalogManager";
import Dashboard from "./Dashboard";
import StationsManager from "./StationsManager";
import UsersOverview from "./UsersOverview";
export { AdminLoginCard } from "./AdminLayout";

export default function AdminShell({ resource }) {
  if (resource === "dashboard") return <Dashboard />;
  if (resource === "stations") return <StationsManager />;
  if (resource === "users") return <UsersOverview />;
  if (resource === "products") {
    return <CatalogManager resource="products" title="Sản phẩm" description="Quản lý list/detail/homepage flags, ảnh chi tiết và model 3D." />;
  }

  return <CatalogManager resource="arCharacters" title="Nhân vật AR" description="Upload GLB/USDZ/poster, preview model-viewer và set default." />;
}
