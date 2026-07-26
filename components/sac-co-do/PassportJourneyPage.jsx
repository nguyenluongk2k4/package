"use client";

import { useState, useEffect } from "react";
import { stations } from "../../data/sac-co-do";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { collection, getDocs } from "firebase/firestore";
import { translate, useI18n } from "./I18nProvider";
import passportDict from "../../locales/passport.json";

const assetBase = "/assets/ho-chieu-hanh-trinh";

const passportStopIcons = {
  "trang-an": `${assetBase}/mobile-icon/ic-trang-an.svg`,
  "hoa-lu": `${assetBase}/mobile-icon/ic-hoa-lu.svg`,
  "tam-coc": `${assetBase}/mobile-icon/ic-tam-coc.svg`,
  "bai-dinh": `${assetBase}/mobile-icon/ic-bai-dinh.svg`,
  "hang-mua": `${assetBase}/mobile-icon/ic-hang-mua.svg`,
  "pho-co-hoa-lu": `${assetBase}/mobile-icon/ic-pho-co-hoa-lu.svg`,
};

function getPassportStops(locale) {
  const stopsText = passportDict[locale]?.stops || passportDict.vi.stops;
  return Object.keys(passportStopIcons).map((id) => ({
    id,
    title: stopsText[id].title,
    subtitle: stopsText[id].subtitle,
    icon: passportStopIcons[id],
  }));
}

// Passive stop card representing a stamp in the album
function PassportStampCard({ stop, progress, index, onPhotoClick, onLockedClick }) {
  const { locale } = useI18n();
  const tp = (key) => translate(passportDict, locale, key);
  const isCompleted = !!progress?.checkedIn;
  const hasPhoto = !!progress?.photoUrl;

  const defaultStampImage = stop.icon || `${assetBase}/desktop-icon/ic-lock.svg`;

  return (
    <article
      className={`passport-stop-card ${isCompleted ? "is-unlocked" : "is-locked"}`}
      role={isCompleted ? undefined : "link"}
      tabIndex={isCompleted ? undefined : 0}
      onClick={isCompleted ? undefined : onLockedClick}
      onKeyDown={isCompleted ? undefined : (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onLockedClick();
        }
      }}
      style={isCompleted ? undefined : { cursor: "pointer" }}
    >
      <div className="passport-stop-heading">
        <h2>{stop.title}</h2>
        <p>{stop.subtitle}</p>
      </div>

      <div className={`passport-stamp-frame ${hasPhoto ? "has-photo" : ""}`} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
        {hasPhoto ? (
          <div 
            className="passport-polaroid-frame" 
            style={{ transform: `rotate(${index % 2 === 0 ? -1.5 : 1.5}deg)`, cursor: "pointer" }}
            onClick={() => onPhotoClick(progress.photoUrl, stop.title)}
          >
            <div className="passport-polaroid-img-wrapper">
              <img className="passport-polaroid-img" src={progress.photoUrl} alt={`${tp("stampCard.memoryAltPrefix")} ${stop.title}`} loading="lazy" decoding="async" />
            </div>
            <span className="passport-polaroid-caption">{tp("stampCard.memoryCaptionPrefix")} {stop.title}</span>
            <span className="passport-polaroid-date">{tp("stampCard.photographedLabel")}</span>
          </div>
        ) : isCompleted ? (
          <img className="passport-stamp-image" src={defaultStampImage} alt={`${tp("stampCard.stampAltPrefix")} ${stop.title}`} loading="lazy" decoding="async" />
        ) : (
          <>
            <img className="passport-locked-icon" src={stop.icon} alt="" loading="lazy" decoding="async" />
            <img className="passport-lock-icon" src={`${assetBase}/desktop-icon/ic-lock.svg`} alt="" loading="lazy" decoding="async" />
          </>
        )}
      </div>

      {!isCompleted && (
        <div className="passport-card-actions" style={{ marginTop: "12px", textAlign: "center" }}>
          <div 
            style={{ 
              display: "inline-block", 
              width: "100%", 
              padding: "10px", 
              borderRadius: "10px", 
              background: "#f9f8f6", 
              border: "1px dashed #cbd5e0", 
              color: "#718096", 
              fontWeight: "bold", 
              fontSize: "12px", 
              textAlign: "center",
              cursor: "pointer"
            }}
          >
            {tp("stampCard.exploreOnMap")}
          </div>
        </div>
      )}
    </article>
  );
}

// Zoomable Photo Lightbox Viewer Modal
function PhotoViewerModal({ photoUrl, stationName, onClose }) {
  const { locale } = useI18n();
  const tp = (key) => translate(passportDict, locale, key);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 3.5));
  const handleZoomOut = () => {
    setZoom((prev) => {
      const nextZoom = Math.max(prev - 0.5, 1);
      if (nextZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return nextZoom;
    });
  };
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom === 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom === 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (zoom === 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || zoom === 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  return (
    <div 
      className="photo-viewer-backdrop" 
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <div className="photo-viewer-controls" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={handleZoomOut} disabled={zoom <= 1} title={tp("viewer.zoomOut")}>-</button>
        <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={handleZoomIn} disabled={zoom >= 3.5} title={tp("viewer.zoomIn")}>+</button>
        <button type="button" className="reset-btn" onClick={handleReset} title={tp("viewer.reset")}>Reset</button>
        <button type="button" className="close-btn" onClick={onClose} title={tp("viewer.close")}>×</button>
      </div>

      <div className="photo-viewer-container" onClick={(e) => e.stopPropagation()}>
        <div 
          className={`photo-viewer-image-wrapper ${zoom > 1 ? "is-zoomable" : ""}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        >
          <img
            src={photoUrl}
            alt={`${tp("viewer.photoAltPrefix")} ${stationName}`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transition: isDragging ? "none" : "transform 0.15s ease-out"
            }}
            draggable={false}
          />
        </div>
        <p className="photo-viewer-caption">{tp("viewer.captionPrefix")} {stationName}</p>
      </div>
    </div>
  );
}

// Certificate Modal Component
function CertificatePreviewModal({ certificate, onClose, initialName }) {
  const { locale } = useI18n();
  const tp = (key) => translate(passportDict, locale, key);
  const [customName, setCustomName] = useState(initialName || tp("certModal.defaultName"));
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Scale parameter for high-res PNG export
    const scale = 3;
    canvas.width = 595.5 * scale;
    canvas.height = 842.25 * scale;

    // Remove crossOrigin for same-origin local assets to avoid CORS errors, and append download link to body for iOS/mobile compatibility
    img.src = certificate.svgUrl;
    img.onload = () => {
      // Ensure the local certificate font is loaded before drawing on canvas.
      document.fonts.load('1em "Alex Brush"').then(() => {
        // Draw background SVG
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Solid color block to hide the template's placeholder name
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(110 * scale, 396 * scale, 375 * scale, 58 * scale);

        // Draw the custom name overlay using Alex Brush.
        ctx.fillStyle = "#1a1a1a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${32 * scale}px "Alex Brush", cursive`;

        ctx.fillText(customName, (595.5 / 2) * scale, 428 * scale);

        try {
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `Chung_Nhan_Scd_${certificate.id}_${customName.replace(/\s+/g, "_")}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (e) {
          console.error("Canvas export failed:", e);
        } finally {
          setIsDownloading(false);
        }
      }).catch((err) => {
        console.warn("Font loading failed, falling back to standard cursive:", err);
        // Fallback draw
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(110 * scale, 396 * scale, 375 * scale, 58 * scale);
        ctx.fillStyle = "#1a1a1a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${28 * scale}px "Alex Brush", cursive`;
        ctx.fillText(customName, (595.5 / 2) * scale, 428 * scale);
        try {
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `Chung_Nhan_Scd_${certificate.id}_${customName.replace(/\s+/g, "_")}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (e) {
          console.error("Canvas export failed:", e);
        } finally {
          setIsDownloading(false);
        }
      });
    };

    img.onerror = (err) => {
      console.error("Failed to load certificate image", err);
      setIsDownloading(false);
    };
  };

  return (
    <div className="cert-modal-backdrop" onClick={onClose}>
      <div className="cert-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cert-modal-close" onClick={onClose} aria-label={tp("certModal.closeAria")}>×</button>

        <div className="cert-modal-left">
          <h3>{tp("certModal.title")}</h3>
          <p className="cert-modal-hint font-baloo">{tp("certModal.hint")}</p>

          <div className="cert-input-group">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={tp("certModal.namePlaceholder")}
              maxLength={40}
            />
          </div>

          <div className="cert-modal-actions">
            <button
              type="button"
              className="cert-download-btn"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? tp("certModal.downloading") : tp("certModal.download")}
            </button>
          </div>
        </div>

        <div className="cert-modal-right">
          <div className="cert-preview-wrapper">
            <img src={certificate.svgUrl} alt="Certificate template" className="cert-img-base" />
            <div className="cert-name-overlay-cover">
              <span className="cert-overlay-text">{customName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PassportJourneyPage() {
  const { user, db, profile } = useFirebaseAuth();
  const { locale } = useI18n();
  const tp = (key) => translate(passportDict, locale, key);
  const passportStops = getPassportStops(locale);
  const [visitedStops, setVisitedStops] = useState({});
  const [loadingStops, setLoadingStops] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [activeViewerPhoto, setActiveViewerPhoto] = useState(null);

  // Load progress stats
  useEffect(() => {
    let active = true;
    if (!db || !user) {
      if (typeof window !== "undefined") {
        const visitedList = JSON.parse(localStorage.getItem("scd_visited_stations") || "[]");
        const photosMap = JSON.parse(localStorage.getItem("scd_station_photos") || "{}");
        const progressMap = {};
        
        visitedList.forEach((id) => {
          progressMap[id] = {
            stationId: id,
            checkedIn: true,
            photoUrl: photosMap[id] || null,
          };
        });
        setVisitedStops(progressMap);
      }
      setLoadingStops(false);
      return;
    }

    async function fetchProgress() {
      try {
        const querySnapshot = await getDocs(collection(db, "users", user.uid, "journeyProgress"));
        if (!active) return;
        const progressMap = {};
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          progressMap[doc.id] = {
            stationId: doc.id,
            checkedIn: true,
            photoUrl: data.photoUrl || null,
          };
        });
        setVisitedStops(progressMap);
      } catch (err) {
        console.warn("⚠️ [Passport] Lỗi tải tiến trình từ Firestore:", err);
      } finally {
        if (active) setLoadingStops(false);
      }
    }

    fetchProgress();
    return () => {
      active = false;
    };
  }, [user, db]);

  // Calculations for progress stats
  const totalStops = passportStops.length;
  const completedStops = Object.keys(visitedStops).filter((id) => visitedStops[id]?.checkedIn).length;
  const progressPercent = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  // Achievement milestones with respective Canva SVGs
  const achievementText = passportDict[locale]?.achievements?.items || passportDict.vi.achievements.items;
  const achievements = [
    {
      id: "beginner",
      title: achievementText.beginner.title,
      description: achievementText.beginner.description,
      active: completedStops >= 2,
      icon: `${assetBase}/desktop-icon/ic-cert-1.svg`,
      svgUrl: "/certificate/begin.svg",
    },
    {
      id: "photographer",
      title: achievementText.photographer.title,
      description: achievementText.photographer.description,
      active: completedStops >= 4,
      icon: `${assetBase}/desktop-icon/ic-cert-2.svg`,
      svgUrl: "/certificate/HERITAGE-PHOTOGRAPHER.svg",
    },
    {
      id: "champion",
      title: achievementText.champion.title,
      description: achievementText.champion.description,
      active: completedStops >= 6,
      icon: `${assetBase}/desktop-icon/ic-cert-3.svg`,
      svgUrl: "/certificate/HERITAGE-CHAMPION.svg",
    },
  ];

  // Resolve user display name
  const userName = profile?.fullName || user?.displayName || user?.email?.split("@")[0] || tp("defaultUserName");

  return (
    <>
      <SiteHeader />
      <main className="heritage-passport-page">
        <section className="page-title-banner passport-title-banner">
          <img src="/assets/anh-new/cover photo.jpg" alt="" aria-hidden="true" />
          <div>
            <p className="passport-eyebrow">{tp("banner.eyebrow")}</p>
            <h1>{tp("banner.title")}</h1>
            <p>
              {tp("banner.description")}
            </p>
          </div>
          <div className="passport-progress-ring" aria-label={`${tp("banner.progressAriaPrefix")} ${progressPercent}%`}>
            <span>{progressPercent}%</span>
            <small>{tp("banner.progressLabel")}</small>
          </div>
        </section>

        <section className="passport-progress-card" aria-label={tp("progressCard.ariaLabel")}>
          <div>
            <span>{tp("progressCard.label")}</span>
            <strong>{completedStops}/{totalStops} {tp("progressCard.stopsSuffix")}</strong>
          </div>
          <strong>{progressPercent}%</strong>
          <div className="passport-progress-bar" aria-hidden="true">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <p>“{tp("progressCard.summaryPrefix")} {progressPercent}% {tp("progressCard.summarySuffix")}”</p>
          <img src={`${assetBase}/desktop-icon/image-decor1.svg`} alt="" aria-hidden="true" />
        </section>

        {loadingStops ? (
          <div className="loading-placeholder-container">
            <div className="spinner" />
          </div>
        ) : (
          <section className="passport-stamp-grid" aria-label={tp("stampGridAria")}>
            {passportStops.map((stop, index) => (
              <PassportStampCard 
                key={stop.id} 
                stop={stop} 
                progress={visitedStops[stop.id]} 
                index={index} 
                onPhotoClick={(url, name) => setActiveViewerPhoto({ url, name })}
                onLockedClick={() => {
                  window.location.href = "/hanh-trinh";
                }}
              />
            ))}
          </section>
        )}

        <section className="passport-lower-grid">
          <article className="passport-achievement-panel">
            <h2>
              <img src={`${assetBase}/desktop-icon/ic-thanh-tuu.svg`} alt="" aria-hidden="true" />
              {tp("achievements.heading")}
            </h2>
            <div className="passport-achievement-list">
              {achievements.map((item) => (
                <div className={`passport-achievement-item ${item.active ? "is-active" : ""}`} key={item.title}>
                  <span>
                    <img src={item.icon} alt="" aria-hidden="true" />
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                  {item.active ? (
                    <button
                      type="button"
                      className="btn-tiny"
                      onClick={() => setSelectedCertificate(item)}
                      style={{
                        padding: "6px 12px",
                        background: "#104c27",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "11px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        marginLeft: "10px"
                      }}
                    >
                      {tp("achievements.claim")}
                    </button>
                  ) : (
                    <span style={{ fontSize: "11px", color: "#a0aec0", fontStyle: "italic", marginLeft: "10px" }}>{tp("achievements.locked")}</span>
                  )}
                </div>
              ))}
            </div>
          </article>

          <aside className="passport-story-panel">
            <blockquote>{tp("story.quote")}</blockquote>
            <p>
              {tp("story.paragraph")}
            </p>
            <div className="passport-actions">
              <a className="passport-primary-action" href="/hanh-trinh">
                <img src={`${assetBase}/desktop-icon/ic-tiep-tuc-hanh-trinh.svg`} alt="" aria-hidden="true" />
                {tp("story.continueJourney")}
              </a>
              <button className="passport-secondary-action" type="button">
                <img src={`${assetBase}/desktop-icon/ic-chia-se-ket-qua.svg`} alt="" aria-hidden="true" />
                {tp("story.shareResult")}
              </button>
            </div>
            <div className="passport-memory-image">
              <img src="/assets/dia-danh/trang-an/TA1.jpg" alt={tp("story.memoryImageAlt")} loading="lazy" decoding="async" />
            </div>
          </aside>
        </section>

        <div className="passport-mobile-actions" aria-label={tp("mobileActionsAria")}>
          <a className="passport-primary-action" href="/hanh-trinh">
            {tp("story.continueJourney")}
          </a>
        </div>
      </main>
      <SiteFooter />

      {/* Dynamic Certificate Modal */}
      {selectedCertificate && (
        <CertificatePreviewModal 
          certificate={selectedCertificate} 
          onClose={() => setSelectedCertificate(null)}
          initialName={userName}
        />
      )}

      {/* Zoomable Photo Lightbox Viewer Modal */}
      {activeViewerPhoto && (
        <PhotoViewerModal 
          photoUrl={activeViewerPhoto.url} 
          stationName={activeViewerPhoto.name} 
          onClose={() => setActiveViewerPhoto(null)}
        />
      )}
    </>
  );
}
