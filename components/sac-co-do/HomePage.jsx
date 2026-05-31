import { brand, gallery, heroSlides, proofStats, stations, steps } from "../../data/sac-co-do";
import PassportVersionSection from "./PassportVersionSection";
import SectionTitle from "./SectionTitle";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import StationCarousel from "./StationCarousel";

export default function HomePage() {
  const hero = heroSlides[0];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero-section">
          <div className="hero-media" aria-hidden="true">
            <img src={hero.image} alt="" decoding="async" fetchPriority="high" />
          </div>
          <div className="hero-copy">
            <p className="eyebrow">{hero.eyebrow}</p>
            <h1>{hero.title}</h1>
            <p>{hero.description}</p>
            <div className="button-row">
              <a className="btn primary" href={brand.primaryCta.href}>
                {brand.primaryCta.label}
              </a>
              <a className="btn ghost" href={brand.secondaryCta.href}>
                <span aria-hidden="true">▶</span>
                {brand.secondaryCta.label}
              </a>
            </div>
          </div>
        </section>

        <section className="stats-band">
          {proofStats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>

        <section className="content-section" id="cach-hoat-dong">
          <SectionTitle
            eyebrow="Cách hoạt động"
            title="Một hành trình đủ nhẹ để chơi, đủ sâu để nhớ"
            description="Sắc Cố Đô không chỉ bán một cuốn sổ. Nó tạo ra một vòng trải nghiệm từ vật phẩm giấy tới check-in số."
          />
          <div className="step-grid">
            {steps.map((step) => (
              <article className="step-card" key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <PassportVersionSection className="content-section" />

        <section className="content-section" id="tram-trai-nghiem">
          <SectionTitle
            eyebrow="6 trạm"
            title="Các điểm đến tạo nên bản đồ trải nghiệm"
            description="Mỗi trạm có một dấu mộc, một câu chuyện và một hành động check-in riêng."
          />
          <StationCarousel stations={stations} />
        </section>

        <section className="gallery-strip" aria-label="Ảnh cảm hứng">
          {gallery.map((image) => (
            <img key={image} src={image} alt="" loading="lazy" decoding="async" />
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
