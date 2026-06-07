import AdminShell from "../../components/admin/AdminShell";

export const metadata = {
  title: "Admin CMS | Sắc Cố Đô",
};

export default function Page() {
  return <AdminShell resource="dashboard" />;
}
