import OrderDetailManager from "../../../../components/admin/OrderDetailManager";

export const metadata = {
  title: "Order Detail | Sac Co Do",
};

export default async function Page({ params }) {
  const resolvedParams = await params;
  return <OrderDetailManager orderId={resolvedParams.orderId} />;
}
