"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { brand, heroSlides, proofStats, stations, steps, souvenirProducts } from "../../data/sac-co-do";
import { getPublicProducts, getPublicStations } from "../../lib/firebase/catalog";
import PassportVersionSection from "./PassportVersionSection";
import SectionTitle from "./SectionTitle";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import HeroMediaSwitcher from "./HeroMediaSwitcher";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function HomePage() {
  const [firebaseStations, setFirebaseStations] = useState(stations);
  const [homeProducts, setHomeProducts] = useState([]);
  const tickerRef = useRef(null);
  const containerRef = useRef(null);

  const hero = heroSlides[0];

  const featuredStations = useMemo(() => {
    const selected = firebaseStations
      .filter((station) => station.isFeatured !== false)
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    return selected.length ? selected : firebaseStations;
  }, [firebaseStations]);

  const displayProducts = homeProducts;

  const loopImages = useMemo(() => {
    const images = featuredStations.map((station) => station.image);
    console.log("DEBUG: featuredStations length =", featuredStations.length);
    console.log("DEBUG: featuredStations data =", featuredStations);
    console.log("DEBUG: loopImages =", images);
    return images;
  }, [featuredStations]);

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
  
  // Refresh ScrollTrigger when products or stations load asynchronously
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [firebaseStations, homeProducts]);

  // GSAP Ticker animation
  useGSAP(() => {
    const track = tickerRef.current;
    if (!track) return;

    // Calculate half of scrollWidth since items are duplicated for wrapping
    const totalWidth = track.scrollWidth / 2;

    gsap.to(track, {
      x: -totalWidth,
      duration: 30,
      ease: "none",
      repeat: -1,
    });
  }, { scope: tickerRef });

  // GSAP Entrance Animations
  useGSAP(() => {
    // Hero entry animation
    gsap.from(".hero-copy-container > *", {
      opacity: 0,
      y: 40,
      stagger: 0.15,
      duration: 1,
      ease: "power3.out",
    });

    gsap.from(".hero-media-wrapper", {
      opacity: 0,
      scale: 0.98,
      duration: 1.2,
      ease: "power2.out",
      delay: 0.2,
    });

    // Timeline unified card entrance
    gsap.from(".timeline-unified-card", {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".timeline-unified-card",
        start: "top 85%",
      }
    });

    gsap.from(".timeline-unified-step", {
      opacity: 0,
      y: 30,
      stagger: 0.2,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".timeline-unified-card",
        start: "top 80%",
      }
    });

    // Horizontal cards for locations
    gsap.from(".location-horizontal-card", {
      opacity: 0,
      y: 50,
      stagger: 0.2,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".locations-horizontal-grid",
        start: "top 80%",
      }
    });

    // Product cards entrance
    gsap.from(".product-grid .product-card", {
      opacity: 0,
      y: 40,
      stagger: 0.15,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".product-grid",
        start: "top 85%",
      }
    });
  }, { scope: containerRef });

  return (
    <>
      <SiteHeader />
      <main ref={containerRef}>
        {/* Cinematic Hero Media Switcher */}
        <HeroMediaSwitcher
          heroImage={hero.image}
          heroVideo={hero.video}
          title={hero.title}
          subtitle={hero.description}
          badge={hero.eyebrow}
          primaryCTA={{ label: "Khám phá ngay", href: "#tram-trai-nghiem" }}
          secondaryCTA={{ label: "Xem video giới thiệu" }}
        />



        {/* Timeline Redesign with Nibi Guide */}
        <section className="content-section" id="cach-hoat-dong">
          <SectionTitle
            eyebrow="Cách hoạt động"
            title="Một hành trình đủ nhẹ để chơi, đủ sâu để nhớ"
            description="Sắc Cố Đô không chỉ bán một cuốn sổ. Nó tạo ra một vòng trải nghiệm từ vật phẩm giấy tới check-in số."
          />
          
          <div className="timeline-unified-card">
            <div className="timeline-unified-header">
              <div className="nibi-guide-row">
                <img src="/assets/anh-new/logo.png" alt="Nibi" className="nibi-avatar" />
                <div className="nibi-speech">
                  <strong>Nibi khuyên dùng:</strong> "Hãy theo sát lộ trình 3 bước dưới đây để kết nối trọn vẹn di sản Ninh Bình và mở khóa các phần quà hấp dẫn!"
                </div>
              </div>
            </div>
            
            <div className="timeline-unified-steps">
              <article className="timeline-unified-step">
                <span className="step-badge">Bước 01</span>
                <h3>Sở hữu Passport</h3>
                <p>Nhận cuốn hộ chiếu pop-up di sản thủ công cao cấp kèm mã ID kích hoạt tài khoản số cá nhân của bạn.</p>
              </article>
              <div className="timeline-divider" />
              <article className="timeline-unified-step">
                <span className="step-badge">Bước 02</span>
                <h3>Hành trình check-in</h3>
                <p>Khám phá 6 điểm dừng chân di tích lịch sử, quét mã QR tại các trạm trải nghiệm để tự động ghi dấu mộc số.</p>
              </article>
              <div className="timeline-divider" />
              <article className="timeline-unified-step">
                <span className="step-badge">Bước 03</span>
                <h3>Đóng Dấu & Mở AR</h3>
                <p>Đóng dấu mộc đỏ trực tiếp vào sổ tay, trải nghiệm chụp ảnh cùng Mascot Nibi AR và nhận phần quà lưu niệm.</p>
              </article>
            </div>
          </div>
        </section>

        {/* Passport Options Section */}
        <PassportVersionSection className="content-section" />

        {/* 6 Locations Redesign (Horizontal Cards) */}
        <section className="content-section" id="tram-trai-nghiem">
          <SectionTitle
            eyebrow="6 điểm dừng chân"
            title="Khám phá 6 điểm văn hóa Ninh Bình"
            description="Mỗi điểm đến là một câu chuyện lịch sử, một dấu mộc và một trải nghiệm check-in thực tế ảo riêng biệt."
          />
          
          <div className="locations-horizontal-grid">
            {featuredStations.slice(0, 6).map((station) => (
              <article className="location-horizontal-card" key={station.id}>
                <div className="location-card-image-wrapper">
                  <img src={station.image} alt={station.name} loading="lazy" decoding="async" />
                  <a className="location-image-overlay" href={`/hanh-trinh/${station.id}`}>
                    <span className="location-overlay-btn">Tìm hiểu thêm</span>
                  </a>
                </div>
                <div className="location-card-content">
                  <span className="pill" style={{ width: "fit-content", marginBottom: "12px" }}>{station.tag}</span>
                  <h3>{station.name}</h3>
                  <p>{station.description}</p>
                  <a 
                    href={`/hanh-trinh/${station.id}`}
                    style={{ fontWeight: "800", color: "var(--brand)", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    Khám phá chi tiết →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Products Showcase */}
        {displayProducts.length > 0 && (
          <section className="content-section product-showcase-home" id="san-pham-noi-bat">
            <SectionTitle
              eyebrow="Vật phẩm di sản"
              title="Những món quà đồng hành cùng hành trình"
              description="Xem và sở hữu các cuốn sổ tay pop-up di sản cùng những món quà đặc sản lưu niệm đậm đà bản sắc Cố Đô."
            />
            <div className="product-grid">
              {displayProducts.slice(0, 6).map((product) => (
                <article className="product-card" key={product.id}>
                  <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
                  <div>
                    <span className="pill">{product.badge || product.category || "Sản phẩm"}</span>
                    <h3 style={{ fontFamily: "Baloo 2", fontWeight: 700 }}>{product.name}</h3>
                    <p style={{ minHeight: "68px" }}>{product.description}</p>
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

        {/* Infinite Loop Image Ticker (GSAP Loop at Bottom) */}
        <section className="infinite-ticker-wrapper" aria-label="Ảnh cảm hứng lặp liên tục">
          <div className="infinite-ticker-track" ref={tickerRef}>
            {/* Group 1 */}
            {loopImages.map((imgSrc, index) => (
              <div className="ticker-image-item" key={`loop1-${index}`}>
                <img src={imgSrc} alt="Sắc Cố Đô" />
              </div>
            ))}
            {/* Group 2 (Duplicate for loop seamless overlap) */}
            {loopImages.map((imgSrc, index) => (
              <div className="ticker-image-item" key={`loop2-${index}`}>
                <img src={imgSrc} alt="Sắc Cố Đô" />
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
