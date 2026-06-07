import ProductConfigurator from "./ProductConfigurator";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function ProductDetailPage({ productId }) {
  return (
    <>
      <SiteHeader />
      <main className="product-detail-page">
        <ProductConfigurator productId={productId} />
      </main>
      <SiteFooter />
    </>
  );
}
