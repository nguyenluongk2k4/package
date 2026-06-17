import ProductDetailPage from "../../../components/sac-co-do/ProductDetailPage";
import { getHardcodedProductBySlugOrId, hardcodedProducts } from "../../../components/sac-co-do/hardcodedProducts";
import { notFound, redirect } from "next/navigation";

export function generateStaticParams() {
  return hardcodedProducts.map((product) => ({
    productId: product.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { productId } = await params;
  if (productId === "single") {
    return {
      title: "Pop-up Passport Ninh Bình | Sắc Cố Đô",
    };
  }

  const product = getHardcodedProductBySlugOrId(productId);

  return {
    title: product ? `${product.name} | Sắc Cố Đô` : "Chi tiết sản phẩm | Sắc Cố Đô",
  };
}

export default async function Page({ params }) {
  const { productId } = await params;
  if (productId === "single") {
    redirect("/san-pham/pop-up-passport-ninh-binh");
  }

  if (!getHardcodedProductBySlugOrId(productId)) {
    notFound();
  }

  return <ProductDetailPage productId={productId} />;
}
