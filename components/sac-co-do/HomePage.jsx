"use client";

import { useEffect, useMemo, useState } from "react";
import { brand, gallery, heroSlides, proofStats, stations, steps } from "../../data/sac-co-do";
import { getPublicProducts, getPublicStations } from "../../lib/firebase/catalog";
import PassportVersionSection from "./PassportVersionSection";
import SectionTitle from "./SectionTitle";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import StationCarousel from "./StationCarousel";

export default function HomePage() {
  const [firebaseStations, setFirebaseStations] = useState(stations);
  const [homeProducts, setHomeProducts] = useState([]);
  const hero = heroSlides[0];
  const featuredStations = useMemo(() => {
    const selected = firebaseStations
      .filter((station) => station.isFeatured !== false)
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    return selected.length ? selected : firebaseStations;
  }, [firebaseStations]);

  useEffect(() => {
    let mounted = true;

    async function loadFirebaseCatalog() {
      const [nextStations, nextProducts] = await Promise.all([
        getPublicStations(),
        getPublicProducts(),
      ]);

      if (!mounted) {
        return;
      }

      setFirebaseStations(nextStations);
      setHomeProducts(nextProducts.filter((product) => product.showOnHome !== false));
    }

    loadFirebaseCatalog();

    return () => {
      mounted = false;
    };
  }, []);

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
          <StationCarousel stations={featuredStations} />
        </section>

        {homeProducts.length > 0 && (
          <section className="content-section product-showcase-home" id="san-pham-noi-bat">
            <SectionTitle
              eyebrow="Vật phẩm"
              title="Những món quà được chọn cho hành trình"
              description="Danh sách này được điều khiển bằng Firebase qua cờ showOnHome."
            />
            <div className="product-grid">
              {homeProducts.slice(0, 3).map((product) => (
                <article className="product-card" key={product.id}>
                  <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
                  <div>
                    <span className="pill">{product.badge || product.category || "Sản phẩm"}</span>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <strong>{product.priceFormatted}</strong>
                    <a className="station-checkin-link" href={`/san-pham/${product.slug || product.id}`}>
                      Xem chi tiết
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

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
