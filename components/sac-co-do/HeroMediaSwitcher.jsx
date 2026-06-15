"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Helper to extract YouTube video ID from standard, embed, or short URLs.
 */
function getYoutubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function HeroMediaSwitcher({
  heroImage,
  heroVideo,
  title,
  subtitle,
  badge,
  primaryCTA,
  secondaryCTA,
}) {
  const youtubeId = getYoutubeId(heroVideo);
  const isDirectVideo = heroVideo && !youtubeId;
  const [mediaState, setMediaState] = useState("image"); // "image" | "video"
  const nextSectionRef = useRef(null);

  useEffect(() => {
    setMediaState("image");
  }, [heroImage, heroVideo]);

  // Handle CTA 1 Click: Set to image & scroll to next section
  const handlePrimaryClick = (e) => {
    setMediaState("image");
    
    // Smooth scroll to target section (default to locations section)
    const targetId = primaryCTA?.href || "#tram-trai-nghiem";
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      e.preventDefault();
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle CTA 2 Click: Toggle image/video background
  const handleSecondaryClick = () => {
    setMediaState((currentState) => (currentState === "video" ? "image" : "video"));
  };

  return (
    <section className="hero-media-switcher">
      {/* 1. Background Media Layer */}
      <div className="hero-media-wrapper">
        {/* State 1: Image Layer */}
        <div className={`hero-media-layer hero-image-layer ${mediaState === "image" ? "active" : ""}`}>
          <img
            src={heroImage}
            alt={title || "Sắc Cố Đô"}
            decoding="async"
            fetchPriority="high"
          />
        </div>

        {/* State 2: Video Layer */}
        <div className={`hero-media-layer hero-video-layer ${youtubeId ? "is-youtube-video" : ""} ${mediaState === "video" ? "active" : ""}`}>
          {mediaState === "video" && (
            <>
              {isDirectVideo ? (
                <video
                  src={heroVideo}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="hero-video-element"
                />
              ) : youtubeId ? (
                <div className="hero-iframe-container">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${youtubeId}&controls=0&disablekb=1&fs=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1`}
                    title={title || "Sắc Cố Đô Video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="hero-video-iframe"
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* 2. Premium Heritage Dark Vignette Overlay Layer */}
      <div className="hero-overlay-layer" />

      {/* 3. Content Overlaid Layer */}
      <div className="hero-content-layer">
        <div className="hero-copy-container">
          {badge && <p className="eyebrow">{badge}</p>}
          {title && <h1 className="hero-title">{title}</h1>}
          {subtitle && <p className="hero-desc">{subtitle}</p>}

          <div className="button-row">
            <a
              className="btn primary"
              href={primaryCTA?.href || "#tram-trai-nghiem"}
              onClick={handlePrimaryClick}
            >
              {primaryCTA?.label || "Khám phá ngay"}
            </a>
            <button
              className="btn ghost hero-video-trigger"
              type="button"
              onClick={handleSecondaryClick}
              style={{ display: "flex", gap: "8px", alignItems: "center" }}
            >
              <span className="play-icon" aria-hidden="true">▶</span>
              {mediaState === "video"
                ? secondaryCTA?.imageLabel || "Xem ảnh giới thiệu"
                : secondaryCTA?.label || "Xem video giới thiệu"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
