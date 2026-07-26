"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clock,
  MapPin,
  Tag as TagIcon,
  Lightbulb,
  Smartphone,
  ArrowRight,
  QrCode,
  X,
} from "lucide-react";
import { stations } from "../../data/sac-co-do";
import { getStationBySlugOrId } from "../../lib/firebase/catalog";
import { hasLocalStationQrUnlock, hasStationQrUnlock, saveLocalStationQrUnlock, saveStationQrUnlock } from "../../lib/firebase/userData";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useToast } from "./ToastProvider";
import { translate, useI18n } from "./I18nProvider";
import journeyDict from "../../locales/journey.json";
import guideTrangAn from "../../locales/journey-station/trang-an.json";
import guideHoaLu from "../../locales/journey-station/hoa-lu.json";
import guideBaiDinh from "../../locales/journey-station/bai-dinh.json";
import guidePhoCoHoaLu from "../../locales/journey-station/pho-co-hoa-lu.json";
import guideTamCoc from "../../locales/journey-station/tam-coc.json";
import guideHangMua from "../../locales/journey-station/hang-mua.json";
import { localizeStation } from "./stationLocalization";

// ─── Nội dung gợi ý vị trí QR cho từng trạm ───

const qrGuides = {
  "trang-an": guideTrangAn,
  "hoa-lu": guideHoaLu,
  "bai-dinh": guideBaiDinh,
  "pho-co-hoa-lu": guidePhoCoHoaLu,
  "tam-coc": guideTamCoc,
  "hang-mua": guideHangMua,
};

function getGuide(stationId, locale) {
  const dict = qrGuides[stationId] || qrGuides["trang-an"];
  return dict[locale] || dict.vi;
}

// ─── Helper ảnh ───

function heroImageFor(station, stationId) {
  if (station?.heroImage || station?.image) {
    return station.heroImage || station.image;
  }

  const id = station?.id || stationId;
  const map = {
    "trang-an": "/assets/dia-danh/trang-an/TA1.jpg",
    "hoa-lu": "/assets/dia-danh/co-do-hoa-lu/CDHL 5.webp",
    "bai-dinh": "/assets/dia-danh/bai-dinh/Chùa Bái Đính 1.jpg",
    "pho-co-hoa-lu": "/assets/dia-danh/pho-co-hoa-lu/PCHL1.jpg",
    "tam-coc": "/assets/dia-danh/tam-coc-bich-dong/TC1.jpg",
    "hang-mua": "/assets/dia-danh/hang-mua/HM1.jpg",
  };
  return map[id] || "/assets/dia-danh/trang-an/TA1.jpg";
}

function galleryImageFor(station, stationId) {
  const g = station?.gallery;
  if (g && g.length > 1) return g[1];
  if (g && g.length > 0) return g[0];
  const id = station?.id || stationId;
  const map = {
    "trang-an": "/assets/dia-danh/trang-an/TA2.jpg",
    "hoa-lu": "/assets/dia-danh/co-do-hoa-lu/CĐHL 1.jpg",
    "bai-dinh": "/assets/dia-danh/bai-dinh/Chùa Bái Đính 2.jpg",
    "pho-co-hoa-lu": "/assets/dia-danh/pho-co-hoa-lu/PCHL 2.jpg",
    "tam-coc": "/assets/dia-danh/tam-coc-bich-dong/TC2.jpg",
    "hang-mua": "/assets/dia-danh/hang-mua/HM2.jpg",
  };
  return map[id] || heroImageFor(station, stationId);
}

function stepImageFor(station, stationId, index) {
  const gallery = station?.gallery || [];
  if (gallery.length) return gallery[index % gallery.length];

  const id = station?.id || stationId;
  const fallback = {
    "trang-an": ["/assets/dia-danh/trang-an/TA1.jpg", "/assets/dia-danh/trang-an/TA2.jpg", "/assets/dia-danh/trang-an/TA3.jpg", "/assets/dia-danh/trang-an/TA10.jpg"],
    "hoa-lu": ["/assets/dia-danh/co-do-hoa-lu/CDHL 5.webp", "/assets/dia-danh/co-do-hoa-lu/CĐHL 1.jpg", "/assets/dia-danh/co-do-hoa-lu/CĐHL 2.jpg", "/assets/dia-danh/co-do-hoa-lu/CĐHL 3.jpg"],
    "bai-dinh": ["/assets/dia-danh/bai-dinh/Chùa Bái Đính 1.jpg", "/assets/dia-danh/bai-dinh/Chùa Bái Đính 2.jpg", "/assets/dia-danh/bai-dinh/Chùa Bái Đính 3.jpg", "/assets/dia-danh/bai-dinh/Chùa bái đính 4.jpg"],
    "pho-co-hoa-lu": ["/assets/dia-danh/pho-co-hoa-lu/PCHL1.jpg", "/assets/dia-danh/pho-co-hoa-lu/PCHL 2.jpg", "/assets/dia-danh/pho-co-hoa-lu/PCHL 3.jpg", "/assets/dia-danh/pho-co-hoa-lu/IMG_1021.JPG"],
    "tam-coc": ["/assets/dia-danh/tam-coc-bich-dong/TC1.jpg", "/assets/dia-danh/tam-coc-bich-dong/TC2.jpg", "/assets/dia-danh/tam-coc-bich-dong/TC4.jpg", "/assets/dia-danh/tam-coc-bich-dong/TC5.jpg"],
    "hang-mua": ["/assets/dia-danh/hang-mua/HM1.jpg", "/assets/dia-danh/hang-mua/HM2.jpg", "/assets/dia-danh/hang-mua/HM3.jpg", "/assets/dia-danh/hang-mua/HM4.jpg"],
  };

  return (fallback[id] || fallback["trang-an"])[index % 4];
}

// ─── Component chính ───

export default function JourneyDetailPage({ station, stationId }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, db, loading: authLoading } = useFirebaseAuth();
  const { locale } = useI18n();
  const tj = (key) => translate(journeyDict, locale, key);
  const [activeStation, setActiveStation] = useState(station);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isQrUnlocked, setIsQrUnlocked] = useState(false);
  const [isQrUnlockLoading, setIsQrUnlockLoading] = useState(true);
  const isSavingQrUnlockRef = useRef(false);
  const guide = getGuide(stationId || station?.id, locale);

  useEffect(() => {
    let mounted = true;

    async function loadStation() {
      const fbStation = await getStationBySlugOrId(stationId || station?.slug || station?.id);
      if (mounted && fbStation) {
        setActiveStation(fbStation);
      }
    }

    loadStation();
    return () => { mounted = false; };
  }, [station?.id, station?.slug, stationId]);

  const st = localizeStation(activeStation || station, locale);
  const img = heroImageFor(activeStation || station, stationId);
  const sid = st?.id || stationId;
  const checkinSlug = st?.slug || st?.id || stationId;
  const expectedQrValue = `SAC-CODO:${sid}`;

  useEffect(() => {
    let active = true;

    async function loadQrUnlock() {
      if (!sid || authLoading) return;

      setIsQrUnlockLoading(true);
      try {
        const unlocked = user && db
          ? await hasStationQrUnlock({ db, uid: user.uid, stationId: sid })
          : hasLocalStationQrUnlock(sid);
        if (active) setIsQrUnlocked(unlocked);
      } catch (error) {
        console.warn("Could not load QR unlock:", error);
        if (active) setIsQrUnlocked(false);
      } finally {
        if (active) setIsQrUnlockLoading(false);
      }
    }

    loadQrUnlock();
    return () => { active = false; };
  }, [authLoading, db, sid, user]);

  const openCheckin = useCallback(() => {
    router.push(`/checkin/${checkinSlug}`);
  }, [checkinSlug, router]);

  const handleCheckinCta = useCallback(() => {
    if (isQrUnlocked) {
      openCheckin();
      return;
    }
    setShowQrDialog(true);
  }, [isQrUnlocked, openCheckin]);

  const saveQrUnlockAndOpenCheckin = useCallback(async () => {
    if (isSavingQrUnlockRef.current) return;
    isSavingQrUnlockRef.current = true;

    try {
      if (user && db) {
        await saveStationQrUnlock({ db, uid: user.uid, stationId: sid, stationName: st?.name });
      } else {
        saveLocalStationQrUnlock(sid);
      }
      setIsQrUnlocked(true);
    } catch (error) {
      console.warn("Could not save QR unlock:", error);
      showToast(tj("detail.toast.qrSavedOffline"), "info");
    }

    openCheckin();
  }, [db, openCheckin, showToast, sid, st?.name, user]);

  // ── Camera / QR scan using html5-qrcode ──
  useEffect(() => {
    if (!showQrDialog) return;
    let html5QrCode;
    let active = true;

    const timer = setTimeout(async () => {
      try {
        setCameraError("");
        const { Html5Qrcode } = await import("html5-qrcode");
        
        const container = document.getElementById("journey-qr-reader");
        if (!container || !active) return;

        html5QrCode = new Html5Qrcode("journey-qr-reader");

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            const raw = decodedText.trim();
            const isCorrectQr = raw === checkinSlug || raw === expectedQrValue || raw.includes(`/checkin/${checkinSlug}`);
            
            if (isCorrectQr) {
              if (!active) return;
              
              // Close dialog
              setShowQrDialog(false);

              showToast(tj("detail.toast.qrMatchSuccess"), "success");
              saveQrUnlockAndOpenCheckin();
            } else {
              // Mismatched or invalid QR scanned
              if (!active) return;
              showToast(tj("detail.toast.qrMismatch"), "error");
            }
          },
          () => {
            // silent fail for frame decoding
          }
        );
      } catch (err) {
        console.warn("Failed to initialize html5-qrcode:", err);
        if (active) {
          setCameraError(tj("detail.cameraError"));
        }
      }
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [showQrDialog, expectedQrValue, checkinSlug, router, showToast, saveQrUnlockAndOpenCheckin]);

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero Banner — style như trang hanh-trinh */}
        <section className="page-title-banner">
          <img src={img} alt={st?.name || ""} />
          <div>
            <p className="eyebrow">{st?.tag || tj("detail.defaultTag")}</p>
            <h1>{st?.name || tj("detail.defaultName")}</h1>
            <p>{st?.description || ""}</p>
          </div>
        </section>

        <div className="page-shell">
          {/* CTA Check-in Button at the top */}
          <button
            type="button"
            className="qr-cta"
            onClick={handleCheckinCta}
            disabled={isQrUnlockLoading}
            style={{ margin: "10px 0 32px 0" }}
          >
            <Smartphone size={36} className="qr-cta-icon" strokeWidth={1.6} />
            <span className="qr-cta-text">
              <strong>{isQrUnlocked ? tj("detail.ctaUnlockedTitle") : tj("detail.ctaLockedTitle")}</strong>
              <small>{isQrUnlocked ? tj("detail.ctaUnlockedNote") : tj("detail.ctaLockedNote")}</small>
            </span>
            <ArrowRight size={28} className="qr-cta-arrow" strokeWidth={2.4} />
          </button>

          {/* Thông tin nhanh */}
          <div className="qr-grid-3">
            <div className="qr-info-item">
              <Clock size={18} className="qr-info-icon" />
              <strong>{tj("detail.openHoursLabel")}</strong>
              <span>{st?.hours || tj("detail.defaultHours")}</span>
            </div>
            <div className="qr-info-item">
              <MapPin size={18} className="qr-info-icon" />
              <strong>{tj("detail.areaLabel")}</strong>
              <span>{st?.tag || tj("detail.defaultArea")}</span>
            </div>
            <div className="qr-info-item">
              <TagIcon size={18} className="qr-info-icon" />
              <strong>{tj("detail.stampLabel")}</strong>
              <span>{st?.stamp || tj("detail.defaultStamp")}</span>
            </div>
          </div>

          {/* Bước 1: Vị trí đặt QR */}
          <section className="qr-section">
            <h2>{tj("detail.findQrHeading")}</h2>
            <p className="qr-subtitle">
              {tj("detail.findQrSubtitle")}
            </p>

            <div className="qr-location-layout">
              <div className="qr-location-copy">
                <div className="qr-location-main">
                  <QrCode size={32} className="qr-location-icon" strokeWidth={1.8} />
                  <div>
                    <strong>{tj("detail.qrLocationLabel")}</strong>
                    <p>{guide.qrLocation}</p>
                  </div>
                </div>
                <p className="qr-location-desc">{guide.qrDescription}</p>
                <ul className="qr-detail-list">
                  {guide.qrDetails.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>

              <div className="qr-media-row">
                <img
                  className="qr-location-photo"
                  src={galleryImageFor(st, sid)}
                  alt={`${tj("detail.qrPhotoAltPrefix")} ${st?.name}`}
                  loading="lazy"
                />
              </div>
            </div>
          </section>

          {/* Bước 2: Cách tìm QR */}
          <section className="qr-section">
            <h2>{tj("detail.howToFindHeading")}</h2>
            <p className="qr-subtitle">
              {tj("detail.howToFindSubtitle")}
            </p>

            <div className="qr-step-map" aria-label={tj("detail.routeMapAria")}>
              <svg className="qr-step-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {guide.hints.slice(0, -1).map((_, i) => {
                  const y1 = 12 + i * (76 / Math.max(guide.hints.length - 1, 1));
                  const y2 = 12 + (i + 1) * (76 / Math.max(guide.hints.length - 1, 1));
                  const x1 = i % 2 === 0 ? 24 : 76;
                  const x2 = (i + 1) % 2 === 0 ? 24 : 76;
                  return (
                    <path
                      key={`route-${i}`}
                      className="qr-step-route-line"
                      d={`M${x1} ${y1} C50 ${y1 + 3}, 50 ${y2 - 3}, ${x2} ${y2}`}
                    />
                  );
                })}
              </svg>

              {guide.hints.map((hint, i) => {
                const y = 12 + i * (76 / Math.max(guide.hints.length - 1, 1));
                const x = i % 2 === 0 ? 24 : 76;
                return (
                  <article
                    key={i}
                    className={`qr-step-map-node ${i % 2 === 0 ? "align-right" : "align-left"}`}
                    style={{ "--route-x": `${x}%`, "--route-y": `${y}%` }}
                  >
                    <span className="qr-step-num">{i + 1}</span>
                    <img
                      className="qr-step-image"
                      src={stepImageFor(st, sid, i)}
                      alt={`${tj("detail.stepImageAltPrefix")} ${i + 1} ${tj("detail.stepImageAltInfix")} ${st?.name}`}
                      loading="lazy"
                    />
                    <span className="qr-step-label">{hint}</span>
                  </article>
                );
              })}
            </div>

            <div className="qr-map-note">
              <MapPin size={18} strokeWidth={2.4} />
              <strong>{tj("detail.quickMapLabel")}</strong>
              <span>{tj("detail.quickMapNote")}</span>
            </div>
          </section>

          {/* Lưu ý + CTA */}
          <section className="qr-section">
            <span className="qr-badge">{tj("detail.rememberBadge")}</span>
            <h2>{tj("detail.tipsHeading")}</h2>

            <div className="qr-tips-content">
              <Lightbulb size={20} className="qr-tips-icon" />
              <p>{guide.tips}</p>
              <p className="qr-tip-extra">
                <strong>{tj("detail.openHoursLabel")}:</strong> {st?.hours || tj("detail.defaultHours")}
                {" — "}{tj("detail.openHoursNote")}
              </p>
            </div>

          </section>
        </div>
      </main>
      {showQrDialog ? (
        <div className="qr-scan-dialog" role="dialog" aria-modal="true" aria-labelledby="qr-scan-title">
          <div className="qr-scan-backdrop" onClick={() => setShowQrDialog(false)} />
          <div className="qr-scan-panel">
            <button className="qr-scan-close" type="button" onClick={() => setShowQrDialog(false)} aria-label={tj("detail.closeAria")}>
              <X size={20} />
            </button>
            <div className="qr-scan-copy">
              <span className="qr-badge">{tj("detail.verifyBadge")}</span>
              <h2 id="qr-scan-title">{tj("detail.scanTitlePrefix")} {st?.name}</h2>
              <p>{tj("detail.scanInstruction")}</p>
            </div>
            <div className="qr-scan-view">
              <div id="journey-qr-reader" />
              {cameraError ? <p className="qr-scan-error" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "90%", textAlign: "center", margin: 0, zIndex: 10 }}>{cameraError}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
      <SiteFooter />
    </>
  );
}
