import { redirect } from "next/navigation";

export const metadata = {
  title: "Gio hang | Sac Co Do",
};

export default function Page() {
  redirect("/san-pham");
}
