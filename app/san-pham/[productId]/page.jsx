import ProductDetailPage from "../../../components/sac-co-do/ProductDetailPage";
import { getProductBySlugOrId, getPublicProducts } from "../../../lib/firebase/catalog";
import { notFound, redirect } from "next/navigation";

export async function generateStaticParams() {
  const products = await getPublicProducts();
  return products.map((product) => ({
    productId: product.slug || product.id,
  }));
}

export async function generateMetadata({ params }) {
  const { productId } = await params;

  if (productId === "single") {
    return {
      title: "Pop-up Passport Ninh Bình | Sắc Cố Đô",
    };
  }

  const product = await getProductBySlugOrId(productId);

  return {
    title: product ? `${product.name} | Sắc Cố Đô` : "Chi tiết sản phẩm | Sắc Cố Đô",
  };
}

export default async function Page({ params }) {
  const { productId } = await params;

  if (productId === "single") {
    redirect("/san-pham/pop-up-passport-ninh-binh");
  }

  const product = await getProductBySlugOrId(productId);
  if (!product) {
    notFound();
  }

  return <ProductDetailPage productId={productId} />;
}
