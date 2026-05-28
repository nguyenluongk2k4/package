import { values } from "../../data/sac-co-do";
import SectionTitle from "./SectionTitle";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <section className="about-hero">
          <div>
            <p className="eyebrow">Về dự án</p>
            <h1>Sắc Cố Đô sinh ra để chuyến đi có vật chứng, không chỉ có ảnh.</h1>
            <p>
              Dự án kết hợp thiết kế giấy, điểm đến văn hóa và trải nghiệm số để tạo một sản phẩm du lịch trẻ,
              dễ dùng và có khả năng mở rộng theo mùa.
            </p>
          </div>
          <img src="/gowilds/assets/images/gallery/we-6.jpg" alt="Sắc Cố Đô" />
        </section>
        <SectionTitle eyebrow="Định hướng" title="Ba nguyên tắc thiết kế trải nghiệm" />
        <div className="step-grid">
          {values.map((value) => (
            <article className="step-card" key={value.title}>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
