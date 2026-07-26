"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Lottie from "lottie-react";
import { brand, heroSlides, proofStats, stations, steps } from "../../data/sac-co-do";
import { getPublicProducts, getPublicStations } from "../../lib/firebase/catalog";
import PassportVersionSection from "./PassportVersionSection";
import SectionTitle from "./SectionTitle";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import HeroMediaSwitcher from "./HeroMediaSwitcher";
import { translate, useI18n } from "./I18nProvider";
import homeDict from "../../locales/home.json";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { heritageDestinations } from "./heritageDestinations";
import { localizeStations } from "./stationLocalization";
import { Leaf, History, Compass } from "lucide-react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function HomePage() {
  const { locale } = useI18n();
  const th = (key) => translate(homeDict, locale, key);
  const [firebaseStations, setFirebaseStations] = useState(stations);
  const [homeProducts, setHomeProducts] = useState([]);
  const [nibiData, setNibiData] = useState(null);
  const [activeStationId, setActiveStationId] = useState("trang-an");
  const tickerRef = useRef(null);
  const containerRef = useRef(null);

  const hero = heroSlides[0];

  const featuredStations = useMemo(() => {
    const selected = firebaseStations
      .filter((station) => station.isFeatured !== false)
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    const list = selected.length ? selected : firebaseStations;
    return localizeStations(list, locale);
  }, [firebaseStations, locale]);

  const activeStation = useMemo(() => {
    return featuredStations.find((s) => s.id === activeStationId) || featuredStations[0];
  }, [featuredStations, activeStationId]);

  const loopGalleryItems = useMemo(() => {
    if (!activeStation || !activeStation.gallery || activeStation.gallery.length === 0) {
      return [];
    }
    const galleryList = activeStation.gallery;
    
    // Repeat the gallery array to ensure we have at least 12 items in a single group
    // for a seamless GSAP loop without empty space on large screens.
    const minItems = 12;
    const repeats = Math.ceil(minItems / galleryList.length);
    let repeated = [];
    for (let i = 0; i < repeats; i++) {
      repeated = [...repeated, ...galleryList];
    }
    
    return repeated.map((imgUrl, index) => ({
      url: imgUrl,
      originalIndex: index % galleryList.length,
    }));
  }, [activeStation]);

  const getGalleryItemCaption = (imgUrl, station, index) => {
    const dest = heritageDestinations.find(d => d.slug === station.id);
    if (dest && dest.gallery) {
      const filename = imgUrl.substring(imgUrl.lastIndexOf('/') + 1).toLowerCase();
      const match = dest.gallery.find(item => {
        const srcPath = typeof item === 'string' ? item : item.src;
        return srcPath && srcPath.toLowerCase().includes(filename);
      });
      if (match && match.caption) {
        return match.caption;
      }
    }
    return `${station.name} - ${th("gallery.viewSuffix")} ${index + 1}`;
  };

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

    fetch("/ar/nibi.json")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          setNibiData(data);
        }
      })
      .catch(() => {});

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

    // Reset track position to 0 first to ensure scrollWidth is calculated correctly
    gsap.set(track, { x: 0 });

    // Calculate half of scrollWidth since items are duplicated for wrapping
    const totalWidth = track.scrollWidth / 2;

    const anim = gsap.to(track, {
      x: -totalWidth,
      duration: 30,
      ease: "none",
      repeat: -1,
    });

    return () => {
      anim.kill();
    };
  }, { dependencies: [activeStationId, firebaseStations], scope: tickerRef });

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

    // About Us entrance animation
    gsap.from(".about-intro-wrapper > *", {
      opacity: 0,
      y: 30,
      stagger: 0.15,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".home-about-section",
        start: "top 80%",
      }
    });

    if (document.querySelector(".about-bg-decor")) {
      gsap.from(".about-bg-decor", {
        opacity: 0,
        scale: 0.85,
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".home-about-section",
          start: "top 80%",
        }
      });
    }

    gsap.from(".about-pillar-card", {
      opacity: 0,
      y: 40,
      stagger: 0.2,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".about-pillars-grid",
        start: "top 85%",
      }
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

    // Ninh Binh Story entrance animation
    gsap.from(".story-img-left", {
      opacity: 0,
      x: -40,
      duration: 1.1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".ninh-binh-story-section",
        start: "top 80%",
      }
    });

    gsap.from(".story-img-right", {
      opacity: 0,
      x: -30,
      duration: 1.1,
      ease: "power2.out",
      delay: 0.15,
      scrollTrigger: {
        trigger: ".ninh-binh-story-section",
        start: "top 80%",
      }
    });

    gsap.from(".ninh-binh-story-content > *", {
      opacity: 0,
      x: 40,
      stagger: 0.15,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".ninh-binh-story-section",
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
  }, { scope: containerRef });

  return (
    <>
      <SiteHeader />
      <main ref={containerRef} className="home-page-main">
        {/* Cinematic Hero Media Switcher */}
        <HeroMediaSwitcher
          heroImage={hero.image}
          heroVideo={hero.video}
          title={th("hero.title")}
          subtitle={th("hero.description")}
          badge={th("hero.eyebrow")}
          primaryCTA={{ label: th("hero.primaryCta"), href: "#tram-trai-nghiem" }}
          secondaryCTA={{ label: th("hero.secondaryCta"), imageLabel: th("hero.imageCta") }}
        />

        {/* About Us Mini Section */}
        <section className="home-about-section">
          {/* Widescreen background clouds decoration */}
          <div className="about-bg-cloud" aria-hidden="true">
            <img src="/gon-may.jpg" alt="" />
          </div>

          <div className="home-about-inner content-section">

            <div className="about-intro-wrapper">
              <h2 className="about-question">{th("about.question")}</h2>
              <p className="about-desc">{th("about.paragraph")}</p>
            </div>
            
            <div className="about-pillars-grid">
              <div className="about-pillar-card">
                <div className="card-decor-header">
                  <img src="/assets/ban-do/lotus-decor.png" className="card-lotus-image" alt="" />
                </div>
                <h3 className="pillar-title">{th("about.nature.title")}</h3>
                <p className="pillar-desc">{th("about.nature.desc")}</p>
              </div>
              
              <div className="about-pillar-card">
                <div className="card-decor-header">
                  <img src="/assets/ban-do/lotus-decor.png" className="card-lotus-image" alt="" />
                </div>
                <h3 className="pillar-title">{th("about.history.title")}</h3>
                <p className="pillar-desc">{th("about.history.desc")}</p>
              </div>
              
              <div className="about-pillar-card">
                <div className="card-decor-header">
                  <img src="/assets/ban-do/lotus-decor.png" className="card-lotus-image" alt="" />
                </div>
                <h3 className="pillar-title">{th("about.culture.title")}</h3>
                <p className="pillar-desc">{th("about.culture.desc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Redesign with Nibi Guide */}
        <section className="content-section" id="cach-hoat-dong">
          <SectionTitle
            eyebrow={th("timeline.eyebrow")}
            title={th("timeline.title")}
            description={th("timeline.description")}
          />
          
          <div className="nibi-guide-card">
            <div className="nibi-guide-row">
              <div className="nibi-avatar" aria-label="Nibi">
                {nibiData ? (
                  <Lottie
                    animationData={nibiData}
                    loop={true}
                    autoplay={true}
                    style={{ width: "100%", height: "100%", background: "#ffffff" }}
                  />
                ) : null}
              </div>
              <div className="nibi-speech">
                <strong>{th("timeline.nibiLabel")}</strong> "{th("timeline.nibiAdvice")}"
              </div>
            </div>
          </div>

          <div className="timeline-unified-card">
            <div className="timeline-unified-steps">
              <article className="timeline-unified-step">
                <span className="step-badge">{th("timeline.step1.badge")}</span>
                <h3>{th("timeline.step1.title")}</h3>
                <p>{th("timeline.step1.description")}</p>
              </article>
              <div className="timeline-divider" />
              <article className="timeline-unified-step">
                <span className="step-badge">{th("timeline.step2.badge")}</span>
                <h3>{th("timeline.step2.title")}</h3>
                <p>{th("timeline.step2.description")}</p>
              </article>
              <div className="timeline-divider" />
              <article className="timeline-unified-step">
                <span className="step-badge">{th("timeline.step3.badge")}</span>
                <h3>{th("timeline.step3.title")}</h3>
                <p>{th("timeline.step3.description")}</p>
              </article>
            </div>
          </div>
        </section>
        {/* Ninh Binh Story Section */}
        <section className="content-section ninh-binh-story-section">
          <div className="ninh-binh-story-container">
            <div className="ninh-binh-story-images">
              <div className="story-img-left">
                <img src="/assets/ninh-binh-co-do.jpg" alt={th("story.imageAlt1")} loading="lazy" />
              </div>
              <div className="story-img-right">
                <img src="/assets/ninh-binh-story.png" alt={th("story.imageAlt2")} loading="lazy" />
              </div>
            </div>
            <div className="ninh-binh-story-content">
              <span className="pill" style={{ width: "fit-content", marginBottom: "6px" }}>{th("story.badge")}</span>
              <h2 className="story-title">
                {th("story.title")}
              </h2>
              <p className="story-paragraph">
                {th("story.paragraph1")}
              </p>
              <p className="story-paragraph">
                {th("story.paragraph2")}
              </p>
            </div>
          </div>
        </section>

        {/* 6 Locations Redesign (Horizontal Cards) */}
        <section className="content-section" id="tram-trai-nghiem">
          <SectionTitle
            eyebrow={th("locations.eyebrow")}
            title={th("locations.title")}
            description={th("locations.description")}
          />
          
          <div className="locations-horizontal-grid">
            {featuredStations.slice(0, 6).map((station) => (
              <article className="location-horizontal-card" key={station.id}>
                <div className="location-card-image-wrapper">
                  <img src={station.image} alt={station.name} loading="lazy" decoding="async" />
                  <a className="location-image-overlay" href={`/dia-danh/${station.id}`}>
                    <span className="location-overlay-btn">{th("locations.learnMore")}</span>
                  </a>
                </div>
                <div className="location-card-content">
                  <span className="pill" style={{ width: "fit-content", marginBottom: "12px" }}>{station.tag}</span>
                  <h3>{station.name}</h3>
                  <p>{station.description}</p>
                  <a 
                    href={`/dia-danh/${station.id}`}
                    style={{ fontWeight: "800", color: "var(--brand)", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    {th("locations.detail")}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Passport Options Section */}
        <PassportVersionSection className="content-section" products={homeProducts} />

        {/* Interactive Location Circles & Loop Gallery (Heritage Moments) */}
        <section className="content-section interactive-gallery-section" style={{ paddingBottom: 0 }}>
          <SectionTitle
            eyebrow={th("gallery.eyebrow")}
            title={th("gallery.title")}
            description={th("gallery.description")}
          />

          <div className="destination-circles-container">
            {featuredStations.slice(0, 6).map((station) => {
              const isActive = station.id === activeStationId;
              return (
                <button
                  key={station.id}
                  className={`destination-circle-btn ${isActive ? "active" : ""}`}
                  onClick={() => setActiveStationId(station.id)}
                  type="button"
                >
                  <div className="circle-image-wrapper">
                    <img src={station.image} alt={station.name} loading="lazy" />
                  </div>
                  <span className="circle-label">{station.name}</span>
                </button>
              );
            })}
          </div>

          <div className="infinite-ticker-wrapper" aria-label={th("ticker.aria")} style={{ marginTop: "40px" }}>
            <div className="infinite-ticker-track" ref={tickerRef}>
              {/* Group 1 */}
              {loopGalleryItems.map((item, index) => (
                <div className="gallery-loop-item" key={`loop1-${index}`}>
                  <div className="gallery-loop-image-wrapper">
                    <img src={item.url} alt={`${activeStation.name} gallery`} loading="lazy" />
                  </div>
                  <div className="gallery-loop-caption">
                    {getGalleryItemCaption(item.url, activeStation, item.originalIndex)}
                  </div>
                </div>
              ))}
              {/* Group 2 (Duplicate for loop seamless overlap) */}
              {loopGalleryItems.map((item, index) => (
                <div className="gallery-loop-item" key={`loop2-${index}`}>
                  <div className="gallery-loop-image-wrapper">
                    <img src={item.url} alt={`${activeStation.name} gallery`} loading="lazy" />
                  </div>
                  <div className="gallery-loop-caption">
                    {getGalleryItemCaption(item.url, activeStation, item.originalIndex)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
