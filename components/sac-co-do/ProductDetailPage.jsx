import ProductConfigurator from "./ProductConfigurator";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function ProductDetailPage() {
  return (
    <>
      <SiteHeader />
      <main className="product-detail-page">
        <ProductConfigurator />
      </main>
      <SiteFooter />
    </>
  );
}
