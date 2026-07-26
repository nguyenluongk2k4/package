"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, Rocket } from "lucide-react";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { translate, useI18n } from "./I18nProvider";
import aboutDict from "../../locales/about.json";

function LazySection({ children, className = "", ariaLabel = "", style = {}, placeholder }) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150px" } // Pre-load when section is 150px close to viewport
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={className} aria-label={ariaLabel} style={{ ...style, minHeight: !isIntersecting ? "220px" : "auto" }}>
      {isIntersecting ? children : <div className="lazy-section-placeholder">{placeholder}</div>}
    </section>
  );
}

export default function AboutPage() {
  const { locale } = useI18n();
  const ta = (key) => translate(aboutDict, locale, key);
  const missionPoints = aboutDict[locale]?.visionMission?.missionPoints || aboutDict.vi.visionMission.missionPoints;
  const coreValues = aboutDict[locale]?.values?.items || aboutDict.vi.values.items;

  return (
    <>
      <SiteHeader />
      <main className="about-page">
        <section className="about-hero">
          <div className="about-hero-copy">
            <p className="eyebrow">{ta("hero.eyebrow")}</p>
            <h1 style={{ fontFamily: "var(--font-heading, 'Baloo 2'), sans-serif", fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: "800", color: "var(--ink)", lineHeight: "1.2", marginBottom: "20px" }}>
              {ta("hero.title")}
            </h1>

            <h3 style={{ fontSize: "19px", color: "var(--brand-2)", fontFamily: "var(--font-heading, 'Baloo 2'), sans-serif", fontWeight: "700", lineHeight: "1.4", marginTop: "20px", marginBottom: "16px" }}>
              {ta("hero.subtitle")}
            </h3>

            <p style={{ color: "var(--ink)", fontSize: "15px", lineHeight: "1.7", margin: "0" }}>
              {ta("hero.paragraph")}
            </p>

            <div className="about-hero-actions">
              <a className="btn primary" href="/hanh-trinh">{ta("hero.viewJourney")}</a>
              <a className="btn ghost" href="/ho-chieu">{ta("hero.viewPassport")}</a>
            </div>
          </div>
          <figure className="about-hero-media">
            <img src="/assets/anh-new/cover photo.jpg" alt={ta("hero.mediaAlt")} decoding="async" fetchPriority="high" />
            <figcaption>{ta("hero.mediaCaption")}</figcaption>
          </figure>
        </section>

        <LazySection className="about-mission" placeholder={ta("lazyPlaceholder")}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <p className="eyebrow">{ta("mission.eyebrow")}</p>
              <h2 style={{ margin: 0 }}>{ta("mission.title")}</h2>
            </div>
            <div className="about-mission-media" style={{ width: "100%", height: "280px", borderRadius: "16px", overflow: "hidden", border: "2px solid rgba(16, 76, 39, 0.25)" }}>
              <img src="/assets/ninh-binh-heritage.png" alt={ta("mission.mediaAlt")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", color: "var(--ink)", fontSize: "15px", lineHeight: "1.75" }}>
            <p>
              {ta("mission.paragraph1")}
            </p>
            <p>
              {ta("mission.paragraph2")}
            </p>
            <p>
              {ta("mission.paragraph3")}
            </p>
            <p style={{ fontStyle: "italic", fontWeight: "700", color: "var(--brand)", borderLeft: "4px solid var(--brand-2)", paddingLeft: "16px", marginTop: "12px", fontSize: "16px" }}>
              "{ta("mission.quote")}"
            </p>
          </div>
        </LazySection>

        <LazySection className="about-vision-mission" ariaLabel={ta("visionMission.ariaLabel")} placeholder={ta("lazyPlaceholder")}>
          <div className="vision-card">
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Eye size={26} style={{ color: "var(--brand)", flexShrink: 0 }} /> {ta("visionMission.visionTitle")}
            </h2>
            <p>
              {ta("visionMission.visionText")}
            </p>
          </div>

          <div className="mission-card">
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Rocket size={26} style={{ color: "var(--brand)", flexShrink: 0 }} /> {ta("visionMission.missionTitle")}
            </h2>
            <ul className="mission-list">
              {missionPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        </LazySection>

        <LazySection style={{ marginTop: "64px" }} ariaLabel={ta("values.ariaLabel")} placeholder={ta("lazyPlaceholder")}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <p className="eyebrow" style={{ display: "inline-block" }}>{ta("values.eyebrow")}</p>
            <h2 style={{ fontFamily: "var(--font-heading, 'Baloo 2'), sans-serif", color: "var(--ink)", fontSize: "36px", fontWeight: "800", marginTop: "8px" }}>
              {ta("values.title")}
            </h2>
          </div>
          <div className="about-values-grid">
            {coreValues.map((item) => (
              <article key={item.title}>
                <h3 style={{ fontFamily: "var(--font-heading, 'Baloo 2'), sans-serif", color: "var(--brand)", fontSize: "22px", fontWeight: "800", marginBottom: "10px", marginTop: 0 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "14px", lineHeight: "1.5", color: "var(--muted)", margin: 0 }}>
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </LazySection>
      </main>
      <SiteFooter />
    </>
  );
}
