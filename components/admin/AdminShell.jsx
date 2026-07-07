"use client";

import { AdminLoginCard } from "./AdminLayout";
import ActivationCodesManager from "./ActivationCodesManager";
import ArCharactersManager from "./ArCharactersManager";
import CatalogManager from "./CatalogManager";
import Dashboard from "./Dashboard";
import OrdersListManager from "./OrdersListManager";
import SettingsManager from "./SettingsManager";
import StationsManager from "./StationsManager";
import UsersOverview from "./UsersOverview";

export { AdminLoginCard };

export default function AdminShell({ resource }) {
  if (resource === "dashboard") return <Dashboard />;
  if (resource === "stations") return <StationsManager />;
  if (resource === "users") return <UsersOverview />;
  if (resource === "orders") return <OrdersListManager />;
  if (resource === "arCharacters") return <ArCharactersManager />;
  if (resource === "activationCodes") return <ActivationCodesManager />;
  if (resource === "settings") return <SettingsManager />;
  if (resource === "products") {
    return <CatalogManager resource="products" title="San pham" description="Quan ly list/detail/homepage flags, anh chi tiet va media san pham." />;
  }

  return <Dashboard />;
}
