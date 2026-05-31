import PassportVersionSection from "./PassportVersionSection";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function ProductPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PassportVersionSection />
      </main>
      <SiteFooter />
    </>
  );
}
