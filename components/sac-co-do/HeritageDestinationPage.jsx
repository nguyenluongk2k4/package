"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { translate, useI18n } from "./I18nProvider";
import { heritageDestinations } from "./heritageDestinations";
import heritageDict from "../../locales/heritage.json";
import heritageTrangAn from "../../locales/heritage/trang-an.json";
import heritageHoaLu from "../../locales/heritage/hoa-lu.json";
import heritageBaiDinh from "../../locales/heritage/bai-dinh.json";
import heritagePhoCoHoaLu from "../../locales/heritage/pho-co-hoa-lu.json";
import heritageTamCoc from "../../locales/heritage/tam-coc.json";
import heritageHangMua from "../../locales/heritage/hang-mua.json";

const heritageTextBySlug = {
  "trang-an": heritageTrangAn,
  "hoa-lu": heritageHoaLu,
  "bai-dinh": heritageBaiDinh,
  "pho-co-hoa-lu": heritagePhoCoHoaLu,
  "tam-coc": heritageTamCoc,
  "hang-mua": heritageHangMua,
};

function localizeDestination(destination, locale) {
  const dict = heritageTextBySlug[destination.slug];
  const text = dict?.[locale] || dict?.vi;
  if (!text) return destination;

  return {
    ...destination,
    name: text.name,
    navName: text.navName,
    eyebrow: text.eyebrow,
    title: text.title,
    subtitle: text.subtitle,
    featureCaption: text.featureCaption,
    sectionLabel: text.sectionLabel,
    introTitle: text.introTitle,
    introParagraphs: text.introParagraphs,
    storyTitle: text.storyTitle,
    storyParagraphs: text.storyParagraphs,
    highlights: text.highlights,
    galleryEyebrow: text.galleryEyebrow,
    galleryTitle: text.galleryTitle,
    gallery: destination.gallery.map((image, index) => ({ ...image, caption: text.galleryCaptions?.[index] || image.caption })),
    stats: text.stats || destination.stats,
    closingTitle: text.closingTitle,
    closingText: text.closingText,
  };
}

const destinationNarrationAudio = {
  "trang-an": "/assets/am-thanh/TM%20Tr%C3%A0ng%20An.MP3",
  "hoa-lu": "/assets/am-thanh/TM%20C%E1%BB%91%20%C4%90%C3%B4%20Hoa%20L%C6%B0.MP3",
  "bai-dinh": "/assets/am-thanh/TM%20chua%20Bai%20Dinh.MP3",
  "tam-coc": "/assets/am-thanh/TM%20Tam%20Coc%20-%20Bich%20Dong.MP3",
  "pho-co-hoa-lu": "/assets/am-thanh/TM%20Ph%E1%BB%91%20c%E1%BB%95%20Hoa%20L%C6%B0.MP3",
  "hang-mua": "/assets/am-thanh/TM%20Hang%20M%C3%BAa.MP3",
};

const destinationNarrationAudioEn = {
  "trang-an": "/assets/am-thanh/eng/trang-an2.mp3",
  "hoa-lu": "/assets/am-thanh/eng/co-do-hoa-lu2.mp3",
  "bai-dinh": "/assets/am-thanh/eng/bai-dinh2.mp3",
  "tam-coc": "/assets/am-thanh/eng/tam-coc-2.mp3",
  "pho-co-hoa-lu": "/assets/am-thanh/eng/pho-co-hoa-lu2.mp3",
  "hang-mua": "/assets/am-thanh/eng/hang-mua2.mp3",
};

function LazyImage({ src, alt, className = "", loading = "lazy", ...props }) {
  const [loaded, setLoaded] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <span className={`heritage-lazy-frame ${loaded ? "is-loaded" : ""} ${className}`.trim()}>
      <img ref={imageRef} src={src} alt={alt} loading={loading} decoding="async" onLoad={() => setLoaded(true)} {...props} />
    </span>
  );
}

function DestinationNav({ activeSlug }) {
  const { locale } = useI18n();
  const th = (key) => translate(heritageDict, locale, key);
  return (
    <div className="heritage-destination-nav" aria-label={th("navAria")}>
      {heritageDestinations.map((item) => {
        const navName = heritageTextBySlug[item.slug]?.[locale]?.navName || heritageTextBySlug[item.slug]?.vi?.navName || item.navName;
        return (
          <Link className={item.slug === activeSlug ? "is-active" : ""} href={`/dia-danh/${item.slug}`} key={item.slug}>
            {navName}
          </Link>
        );
      })}
    </div>
  );
}

function buildVietnameseNarration(destination) {
  return [
    destination.name,
    destination.title,
    destination.subtitle,
    ...destination.introParagraphs,
    destination.storyTitle,
    ...destination.storyParagraphs,
  ]
    .filter(Boolean)
    .join(". ");
}

function getActiveLocale(fallbackLocale) {
  if (typeof window === "undefined") return fallbackLocale || "vi";

  const htmlLocale = document.documentElement.lang;
  const savedLocale = window.localStorage.getItem("sac-co-do-locale");
  const nextLocale = htmlLocale || savedLocale || fallbackLocale || "vi";

  return nextLocale === "en" ? "en" : "vi";
}

function findNarrationVoice(lang) {
  const voices = window.speechSynthesis.getVoices();
  const normalizedLang = lang.toLowerCase();
  const baseLang = normalizedLang.slice(0, 2);

  return (
    voices.find((voice) => voice.lang?.toLowerCase() === normalizedLang) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith(`${baseLang}-`)) ||
    null
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function AudioChip({ destination }) {
  const { locale } = useI18n();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef(null);
  const narrationUrl =
    locale === "en"
      ? destinationNarrationAudioEn[destination.slug] || destinationNarrationAudio[destination.slug]
      : destinationNarrationAudio[destination.slug];

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Stop narration if the user switches language mid-playback so the wrong-language audio doesn't keep playing.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, [locale]);

  function stopNarration() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }

  async function playNarration() {
    if (!narrationUrl) return;
    setIsLoadingAudio(true);
    const audio = new Audio(narrationUrl);
    audio.preload = "auto";
    audioRef.current = audio;
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => setIsSpeaking(false);

    try {
      await audio.play();
      setIsSpeaking(true);
    } finally {
      setIsLoadingAudio(false);
    }
  }

  async function handleNarration() {
    if (isSpeaking) {
      stopNarration();
      return;
    }

    try {
      stopNarration();
      await playNarration();
    } catch (error) {
      console.error(error);
      setIsSpeaking(false);
    }
  }

  return (
    <button className={`heritage-audio-chip ${isSpeaking ? "is-speaking" : ""}`} type="button" onClick={handleNarration} aria-pressed={isSpeaking} disabled={isLoadingAudio}>
      <span aria-hidden="true">{isLoadingAudio ? "…" : isSpeaking ? "■" : "▶"}</span>
      <div>
        <strong>{locale === "en" ? "Audio Guide" : "Thuyết minh"}</strong>
        <small>{locale === "en" ? "English narration" : "Âm thanh thuyết minh địa danh"}</small>
      </div>
      <em>{isLoadingAudio ? (locale === "en" ? "Loading" : "Đang tạo") : isSpeaking ? (locale === "en" ? "Stop" : "Dừng") : (locale === "en" ? "Play" : "Nghe")}</em>
    </button>
  );
}

function Hero({ destination }) {
  const { locale } = useI18n();
  const th = (key) => translate(heritageDict, locale, key);
  return (
    <section className="heritage-destination-hero" aria-labelledby="destination-title">
      <img src={destination.heroImage} alt="" aria-hidden="true" decoding="async" fetchPriority="high" />
      <DestinationNav activeSlug={destination.slug} />
      <div className="heritage-destination-hero-copy">
        <p>{destination.eyebrow}</p>
        <h1 id="destination-title">{destination.title}</h1>
        <span>{destination.subtitle}</span>
        <AudioChip destination={destination} />
        <div className="heritage-destination-actions">
          <a href={`/hanh-trinh/${destination.slug}`}>{th("exploreJourney")}</a>
          <a href="#thu-vien-anh">{th("viewGallery")}</a>
        </div>
      </div>
      <a className="heritage-destination-scroll" href="#cau-chuyen" aria-label={th("scrollDownAria")}>
        <span />
      </a>
    </section>
  );
}

function IntroSplit({ destination, reverse = false }) {
  const { locale } = useI18n();
  const th = (key) => translate(heritageDict, locale, key);
  return (
    <section className={`heritage-destination-intro ${reverse ? "is-reversed" : ""}`} id="cau-chuyen">
      <article className="heritage-destination-intro-copy">
        <p className="heritage-destination-kicker">{destination.sectionLabel}</p>
        <h2>{destination.introTitle}</h2>
        {destination.introParagraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <a className="heritage-destination-dark-button" href="#thu-vien-anh">
          {th("viewHeritage")}
        </a>
      </article>
      <figure className="heritage-destination-feature">
        <LazyImage className="heritage-feature-frame" src={destination.featureImage} alt={destination.name} />
        <figcaption>{destination.featureCaption}</figcaption>
      </figure>
    </section>
  );
}

function DarkStory({ destination, compact = false }) {
  const { locale } = useI18n();
  const th = (key) => translate(heritageDict, locale, key);
  const imageLeft = destination.storyImage1 || destination.featureImage;
  const imageRight = destination.storyImage2 || destination.gallery[0]?.src || destination.heroImage;

  return (
    <section className={`heritage-destination-story ${compact ? "is-compact" : ""}`} aria-label={`${th("storyAriaPrefix")} ${destination.name}`}>
      <div className="heritage-destination-story-inner">
        <div className="heritage-story-split">
          <div className="heritage-story-split-images">
            <div className="story-img-left">
              <img src={imageLeft} alt={destination.name} loading="lazy" />
            </div>
            <div className="story-img-right">
              <img src={imageRight} alt={destination.storyTitle} loading="lazy" />
            </div>
          </div>
          <div className="heritage-story-split-text">
            <p className="heritage-story-kicker">{destination.name}</p>
            <h2>{destination.storyTitle}</h2>
            <div className="heritage-destination-story-text-vertical" style={{ display: "flex", flexDirection: "column", gap: "16px", color: "rgba(255, 255, 255, 0.75)" }}>
              {destination.storyParagraphs.map((paragraph) => (
                <p key={paragraph} style={{ margin: 0, lineHeight: "1.7" }}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="heritage-destination-highlights">
          {destination.highlights.map((item) => (
            <article key={`${item.number}-${item.title}`}>
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        {destination.stats?.length ? (
          <div className="heritage-destination-stats">
            {destination.stats.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Gallery({ destination, variant = "mosaic" }) {
  return (
    <section className="heritage-destination-gallery" id="thu-vien-anh">
      <div className="heritage-destination-gallery-heading">
        <div>
          <p className="heritage-destination-kicker">{destination.galleryEyebrow}</p>
          <h2>{destination.galleryTitle}</h2>
        </div>
      </div>
      <div className={`heritage-destination-gallery-grid is-${variant}`}>
        {destination.gallery.map((image, index) => (
          <figure key={image.src} className={index === 0 ? "is-featured" : ""}>
            <LazyImage className="heritage-gallery-frame" src={image.src} alt={image.caption} />
            <figcaption>{image.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function LightEssay({ destination }) {
  const imageLeft = destination.storyImage1 || destination.featureImage;
  const imageRight = destination.storyImage2 || destination.gallery[0]?.src || destination.heroImage;

  return (
    <section className="heritage-story-light">
      <div className="heritage-story-light-inner">
        <div className="heritage-story-split" style={{ color: "var(--ink)" }}>
          <div className="heritage-story-split-images">
            <div className="story-img-left" style={{ border: "2px solid rgba(16, 76, 39, 0.2)" }}>
              <img src={imageLeft} alt={destination.name} loading="lazy" />
            </div>
            <div className="story-img-right" style={{ border: "2px solid rgba(16, 76, 39, 0.2)" }}>
              <img src={imageRight} alt={destination.storyTitle} loading="lazy" />
            </div>
          </div>
          <div className="heritage-story-split-text">
            <p className="heritage-destination-kicker">{destination.name}</p>
            <h2 style={{ color: "var(--brand)", fontFamily: "var(--font-heading, 'Baloo 2'), sans-serif", fontSize: "clamp(26px, 3vw, 42px)", fontWeight: "800", marginTop: 0, marginBottom: "20px", textAlign: "left" }}>
              {destination.storyTitle}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", color: "var(--ink)", lineHeight: "1.7" }}>
              {destination.storyParagraphs.map((paragraph) => (
                <p key={paragraph} style={{ margin: 0 }}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Closing({ destination, circleImage = false }) {
  const { locale } = useI18n();
  const th = (key) => translate(heritageDict, locale, key);
  return (
    <section className={`heritage-destination-closing ${circleImage ? "has-circle-image" : ""}`}>
      <div>
        <h2>{destination.closingTitle}</h2>
        <p>{destination.closingText}</p>
        <p className="heritage-destination-closing-actions">
          <Link className="heritage-destination-dark-button" href="/hanh-trinh">
            {th("startJourney")}
          </Link>
          <Link className="heritage-destination-outline-button" href="/ho-chieu">
            {th("myPassport")}
          </Link>
        </p>
      </div>
      {circleImage ? (
        <LazyImage className="heritage-closing-circle" src={destination.gallery[2]?.src || destination.featureImage} alt={destination.name} />
      ) : null}
    </section>
  );
}

function HoaLuLayout({ destination }) {
  return (
    <>
      <IntroSplit destination={destination} />
      <DarkStory destination={destination} compact />
      <Gallery destination={destination} variant="archive" />
      <Closing destination={destination} />
    </>
  );
}

function BaiDinhLayout({ destination }) {
  return (
    <>
      <IntroSplit destination={destination} reverse />
      <DarkStory destination={destination} />
      <Gallery destination={destination} variant="temple" />
      <Closing destination={destination} />
    </>
  );
}

function TamCocLayout({ destination }) {
  const { locale } = useI18n();
  const th = (key) => translate(heritageDict, locale, key);
  return (
    <>
      <IntroSplit destination={destination} reverse />
      <DarkStory destination={destination} compact />
      <Gallery destination={destination} variant="river" />
      <section className="heritage-season-strip">
        <h2>{destination.closingTitle}</h2>
        <div>
          {destination.highlights.map((item) => (
            <article key={item.title}>
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <a className="heritage-destination-dark-button" href="/hanh-trinh">{th("exploreJourney")}</a>
      </section>
    </>
  );
}

function PhoCoLayout({ destination }) {
  const { locale } = useI18n();
  const th = (key) => translate(heritageDict, locale, key);
  return (
    <>
      <IntroSplit destination={destination} reverse />
      <LightEssay destination={destination} />
      <section className="heritage-food-section">
        <div className="heritage-food-heading">
          <p className="heritage-destination-kicker">{th("foodSectionKicker")}</p>
          <h2>{destination.storyTitle}</h2>
          <a href="/san-pham">{th("exploreMenu")}</a>
        </div>
        <div className="heritage-food-grid">
          {destination.highlights.map((item, index) => (
            <article key={item.title}>
              <LazyImage className="heritage-food-image" src={destination.gallery[index]?.src || destination.featureImage} alt={item.title} />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
      <Gallery destination={destination} variant="night" />
      <Closing destination={destination} />
    </>
  );
}

function HangMuaLayout({ destination }) {
  return (
    <>
      <IntroSplit destination={destination} reverse />
      <DarkStory destination={destination} />
      <Gallery destination={destination} variant="peak" />
      <Closing destination={destination} circleImage />
    </>
  );
}

function TrangAnLayout({ destination }) {
  return (
    <>
      <IntroSplit destination={destination} />
      <DarkStory destination={destination} />
      <Gallery destination={destination} variant="balanced" />
      <Closing destination={destination} />
    </>
  );
}

const layouts = {
  "hoa-lu": HoaLuLayout,
  "bai-dinh": BaiDinhLayout,
  "tam-coc": TamCocLayout,
  "pho-co": PhoCoLayout,
  "hang-mua": HangMuaLayout,
  "trang-an": TrangAnLayout,
};

export default function HeritageDestinationPage({ destination: rawDestination }) {
  const { locale } = useI18n();
  const destination = localizeDestination(rawDestination, locale);
  const Layout = layouts[destination.layout] || TrangAnLayout;

  return (
    <>
      <SiteHeader />
      <main className={`heritage-destination-page heritage-layout-${destination.layout}`}>
        <Hero destination={destination} />
        <Layout destination={destination} />
      </main>
      <SiteFooter />
    </>
  );
}
