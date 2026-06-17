"use client";

import { useEffect, useRef, useState } from "react";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { useI18n } from "./I18nProvider";
import { heritageDestinations } from "./heritageDestinations";

const englishNarration = {
  "trang-an":
    "Trang An is a UNESCO mixed heritage site in Ninh Binh, where limestone mountains, emerald waterways, ancient temples, and cave systems come together. The journey by boat through Hang Sang, Hang Toi, Hang Nau Ruou, and Hang Dia Linh reveals a quiet landscape shaped by nature, history, and the memory of Hoa Lu ancient capital.",
  "hoa-lu":
    "Hoa Lu Ancient Capital marks the beginning of Dai Co Viet. Surrounded by limestone mountains and natural waterways, it was chosen by King Dinh Tien Hoang as the first capital of an independent Vietnamese state. Today, the temples of King Dinh and King Le preserve the solemn atmosphere of a thousand years of history.",
  "bai-dinh":
    "Bai Dinh Pagoda is one of the largest Buddhist complexes in Southeast Asia. Set among mountains and valleys, it combines traditional Vietnamese architecture with monumental bronze statues, long Arhat corridors, bell towers, and sacred spaces where visitors can slow down and find balance.",
  "tam-coc":
    "Tam Coc and Bich Dong are known as Ha Long Bay on land. A small boat follows the Ngo Dong River through rice fields, limestone cliffs, and three natural caves. Nearby, Bich Dong Pagoda rests against the mountain, adding a peaceful cultural layer to the river landscape.",
  "pho-co-hoa-lu":
    "Hoa Lu Old Quarter comes alive at night beside Ky Lan Lake. Inspired by traditional Dai Viet architecture, it blends tiled roofs, lanterns, local food, souvenirs, cafes, night markets, and cultural performances into a warm meeting point between heritage and modern life.",
  "hang-mua":
    "Hang Mua is a high viewpoint over Ninh Binh. After climbing nearly five hundred stone steps toward Ngoa Long peak, visitors are rewarded with sweeping views of the Ngo Dong River, Tam Coc rice fields, and limestone mountains. It is a place of effort, wind, and quiet triumph.",
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
  return (
    <div className="heritage-destination-nav" aria-label="Danh sách địa danh">
      {heritageDestinations.map((item) => (
        <a className={item.slug === activeSlug ? "is-active" : ""} href={`/dia-danh/${item.slug}`} key={item.slug}>
          {item.navName}
        </a>
      ))}
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
  const audioObjectUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioObjectUrlRef.current) {
        URL.revokeObjectURL(audioObjectUrlRef.current);
        audioObjectUrlRef.current = null;
      }
    };
  }, []);

  function stopNarration() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioObjectUrlRef.current) {
      URL.revokeObjectURL(audioObjectUrlRef.current);
      audioObjectUrlRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }

  async function playAudioWithRetry(audioUrl) {
    let lastError = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const source = audioUrl.startsWith("blob:") ? audioUrl : `${audioUrl}${audioUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
      const audio = new Audio(source);
      audio.preload = "auto";
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);

      try {
        await audio.play();
        return;
      } catch (error) {
        lastError = error;
        audio.pause();
        audioRef.current = null;
        await wait(1200);
      }
    }

    throw lastError || new Error("Không phát được audio thuyết minh.");
  }

  async function playFptNarration(text) {
    setIsLoadingAudio(true);
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload.error || "Không tạo được audio thuyết minh.");
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    audioObjectUrlRef.current = audioUrl;
    setIsSpeaking(true);
    await playAudioWithRetry(audioUrl);
  }

  function playEnglishNarration(text) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    const voice = findNarrationVoice("en-US");
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  async function handleNarration() {
    if (isSpeaking) {
      stopNarration();
      return;
    }

    const activeLocale = getActiveLocale(locale);
    const text = activeLocale === "en" ? englishNarration[destination.slug] : buildVietnameseNarration(destination);

    try {
      stopNarration();
      if (activeLocale === "vi") {
        await playFptNarration(text);
      } else {
        playEnglishNarration(text);
      }
    } catch (error) {
      console.error(error);
      setIsSpeaking(false);
    } finally {
      setIsLoadingAudio(false);
    }
  }

  return (
    <button className={`heritage-audio-chip ${isSpeaking ? "is-speaking" : ""}`} type="button" onClick={handleNarration} aria-pressed={isSpeaking} disabled={isLoadingAudio}>
      <span aria-hidden="true">{isLoadingAudio ? "…" : isSpeaking ? "■" : "▶"}</span>
      <div>
        <strong>{locale === "en" ? "Audio Guide" : "Thuyết minh"}</strong>
        <small>{locale === "en" ? "English narration" : "FPT giọng Việt"}</small>
      </div>
      <em>{isLoadingAudio ? (locale === "en" ? "Loading" : "Đang tạo") : isSpeaking ? (locale === "en" ? "Stop" : "Dừng") : (locale === "en" ? "Play" : "Nghe")}</em>
    </button>
  );
}

function Hero({ destination }) {
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
          <a href="#cau-chuyen">Khám phá hành trình</a>
          <a href="#thu-vien-anh">Xem thư viện ảnh</a>
        </div>
      </div>
      <a className="heritage-destination-scroll" href="#cau-chuyen" aria-label="Cuộn xuống nội dung">
        <span />
      </a>
    </section>
  );
}

function IntroSplit({ destination, reverse = false }) {
  return (
    <section className={`heritage-destination-intro ${reverse ? "is-reversed" : ""}`} id="cau-chuyen">
      <article className="heritage-destination-intro-copy">
        <p className="heritage-destination-kicker">{destination.sectionLabel}</p>
        <h2>{destination.introTitle}</h2>
        {destination.introParagraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <a className="heritage-destination-dark-button" href="#thu-vien-anh">
          Nhìn ngắm di sản
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
  return (
    <section className={`heritage-destination-story ${compact ? "is-compact" : ""}`} aria-label={`Câu chuyện ${destination.name}`}>
      <div className="heritage-destination-story-inner">
        <p>{destination.name}</p>
        <h2>{destination.storyTitle}</h2>
        <div className="heritage-destination-story-text">
          {destination.storyParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
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
  return (
    <section className="heritage-light-essay">
      <p className="heritage-destination-kicker">{destination.name}</p>
      <h2>{destination.storyTitle}</h2>
      <div>
        {destination.storyParagraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

function Closing({ destination, circleImage = false }) {
  return (
    <section className={`heritage-destination-closing ${circleImage ? "has-circle-image" : ""}`}>
      <div>
        <h2>{destination.closingTitle}</h2>
        <p>{destination.closingText}</p>
        <p className="heritage-destination-closing-actions">
          <a className="heritage-destination-dark-button" href="/hanh-trinh">
            Bắt đầu hành trình
          </a>
          <a className="heritage-destination-outline-button" href="/ho-chieu">
            Tải bản đồ
          </a>
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
        <a className="heritage-destination-dark-button" href="/hanh-trinh">Book Your Journey</a>
      </section>
    </>
  );
}

function PhoCoLayout({ destination }) {
  return (
    <>
      <IntroSplit destination={destination} reverse />
      <LightEssay destination={destination} />
      <section className="heritage-food-section">
        <div className="heritage-food-heading">
          <p className="heritage-destination-kicker">Ẩm thực & quà lưu niệm</p>
          <h2>{destination.storyTitle}</h2>
          <a href="/san-pham">Khám phá thực đơn</a>
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

export default function HeritageDestinationPage({ destination }) {
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
