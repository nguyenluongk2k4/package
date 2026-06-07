import AdminShell from "../../../components/admin/AdminShell";

export const metadata = {
  title: "Quản lý sản phẩm | Sắc Cố Đô",
};

export default function Page() {
  return <AdminShell resource="products" />;
}
