import ProductDetailPage from "../../../components/sac-co-do/ProductDetailPage";
import { souvenirProducts } from "../../../data/sac-co-do";

export function generateStaticParams() {
  return souvenirProducts.map((product) => ({
    productId: product.id,
  }));
}

export async function generateMetadata({ params }) {
  const { productId } = await params;
  const product = souvenirProducts.find((item) => item.id === productId);

  return {
    title: product ? `${product.name} | Sắc Cố Đô` : "Chi tiết sản phẩm | Sắc Cố Đô",
  };
}

export default async function Page({ params }) {
  const { productId } = await params;

  return <ProductDetailPage productId={productId} />;
}
