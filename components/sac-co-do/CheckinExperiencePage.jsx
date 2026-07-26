"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { stations } from "../../data/sac-co-do";
import { getDefaultArCharacter, getStationArCharacter, getStationBySlugOrId } from "../../lib/firebase/catalog";
import { saveArExperience, saveJourneyProgress } from "../../lib/firebase/userData";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { uploadToCloudinary } from "../../lib/cloudinary/client";
import { useToast } from "./ToastProvider";
import { ArOnboardingGuide } from "./UtilityPages";
import { translate, useI18n } from "./I18nProvider";
import checkinDict from "../../locales/checkin.json";
import { localizeStation } from "./stationLocalization";

const viewArBase = "/assets/view-ar";
const fallbackArModelSrc = "/ar/sac-co-do-guide-v3.glb";
const fallbackArIosModelSrc = "/ar/sac-co-do-guide-v3.usdz";
const fallbackArCharacterId = "default-guide";
const modelGreetingAnimation = "WaveOnceThenIdle";
const sheetPositions = ["expanded", "middle", "collapsed"];
const stationNarrationAudio = {
  "trang-an": "/assets/am-thanh/TM%20Tr%C3%A0ng%20An.MP3",
  "hoa-lu": "/assets/am-thanh/TM%20C%E1%BB%91%20%C4%90%C3%B4%20Hoa%20L%C6%B0.MP3",
  "bai-dinh": "/assets/am-thanh/TM%20chua%20Bai%20Dinh.MP3",
  "tam-coc": "/assets/am-thanh/TM%20Tam%20Coc%20-%20Bich%20Dong.MP3",
  "pho-co-hoa-lu": "/assets/am-thanh/TM%20Ph%E1%BB%91%20c%E1%BB%95%20Hoa%20L%C6%B0.MP3",
  "hang-mua": "/assets/am-thanh/TM%20Hang%20M%C3%BAa.MP3",
};

const stationNarrationAudioEn = {
  "trang-an": "/assets/am-thanh/eng/trang-an2.mp3",
  "hoa-lu": "/assets/am-thanh/eng/co-do-hoa-lu2.mp3",
  "bai-dinh": "/assets/am-thanh/eng/bai-dinh2.mp3",
  "tam-coc": "/assets/am-thanh/eng/tam-coc-2.mp3",
  "pho-co-hoa-lu": "/assets/am-thanh/eng/pho-co-hoa-lu2.mp3",
  "hang-mua": "/assets/am-thanh/eng/hang-mua2.mp3",
};

function getStation(stationId) {
  return stations.find((station) => station.id === stationId) || stations[0];
}

function isQuickLookDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export default function CheckinExperiencePage({ stationId }) {
  const { user, db } = useFirebaseAuth();
  const { showToast } = useToast();
  const { locale } = useI18n();
  const tc = (key) => translate(checkinDict, locale, key);
  const fallbackStation = useMemo(() => getStation(stationId), [stationId]);
  const [station, setStation] = useState(fallbackStation);
  // Display-only localized copy — keep `station` itself raw (Vietnamese) since its fields are written to Firestore/localStorage.
  const displayStation = localizeStation(station, locale);
  const [arCharacter, setArCharacter] = useState({
    id: fallbackArCharacterId,
    glbUrl: fallbackArModelSrc,
    usdzUrl: fallbackArIosModelSrc,
    posterUrl: "",
  });
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const modelViewerRef = useRef(null);
  const playedGreetingRef = useRef(false);
  const dragStartRef = useRef(null);
  const narrationAudioRef = useRef(null);
  
  const [isTracking, setIsTracking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [isStamped, setIsStamped] = useState(false);
  const [arStatus, setArStatus] = useState("idle");
  const [arMessage, setArMessage] = useState("");
  const [hasMounted, setHasMounted] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [isIosQuickLook, setIsIosQuickLook] = useState(false);
  const [sheetPosition, setSheetPosition] = useState("middle");
  const [showArGuide, setShowArGuide] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hasCompletedAllStops, setHasCompletedAllStops] = useState(false);

  // AR Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  async function checkAllStationsCompleted() {
    const completedStationIds = new Set();

    if (user && db) {
      try {
        const progressSnapshot = await getDocs(collection(db, "users", user.uid, "journeyProgress"));
        progressSnapshot.forEach((progressDoc) => completedStationIds.add(progressDoc.id));
      } catch (error) {
        console.warn("Could not read cloud journey progress:", error);
      }
    } else if (typeof window !== "undefined") {
      try {
        const visitedStations = JSON.parse(localStorage.getItem("scd_visited_stations") || "[]");
        visitedStations.forEach((id) => completedStationIds.add(id));
      } catch (error) {
        console.warn("Could not read local journey progress:", error);
      }
    }

    return stations.every((item) => completedStationIds.has(item.id));
  }

  useEffect(() => {
    let mounted = true;

    async function loadArConfig() {
      const firebaseStation = await getStationBySlugOrId(stationId);
      const nextStation = firebaseStation || fallbackStation;
      const stationCharacter = getStationArCharacter(nextStation?.id || stationId);
      const character = await getDefaultArCharacter(nextStation?.arGuide?.modelId || stationCharacter.id);

      if (!mounted) return;
      setStation(nextStation);
      setArCharacter({
        id: character?.id || stationCharacter.id || fallbackArCharacterId,
        glbUrl: character?.glbUrl || stationCharacter.glbUrl || fallbackArModelSrc,
        usdzUrl: character?.usdzUrl || stationCharacter.usdzUrl || fallbackArIosModelSrc,
        posterUrl: character?.posterUrl || "",
        defaultAnimation: character?.defaultAnimation || "",
      });
    }

    loadArConfig();

    return () => {
      mounted = false;
    };
  }, [fallbackStation, stationId]);

  async function openCamera() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setHasCamera(false);
      setArMessage(tc("errors.cameraUnsupported"));
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setHasCamera(true);
      setArMessage("");
      return true;
    } catch (error) {
      console.error("Camera access error:", error);
      setHasCamera(false);
      setArMessage(tc("errors.cameraFailed"));
      return false;
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setHasCamera(false);
  }

  useEffect(() => {
    const quickLookDevice = isQuickLookDevice();
    setHasMounted(true);
    setIsIosQuickLook(quickLookDevice);

    if (typeof window !== "undefined") {
      const guideCompleted = localStorage.getItem("scd_ar_guide_completed");
      if (guideCompleted !== "true") {
        setShowArGuide(true);
      } else {
        if (!quickLookDevice) {
          openCamera();
        }
      }
    } else {
      if (!quickLookDevice) {
        openCamera();
      }
    }

    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (narrationAudioRef.current) {
        narrationAudioRef.current.pause();
        narrationAudioRef.current = null;
      }
    };
  }, []);

  // Stop narration if the user switches language mid-playback so the wrong-language audio doesn't keep playing.
  useEffect(() => {
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.currentTime = 0;
      narrationAudioRef.current = null;
    }
    setIsNarrating(false);
  }, [locale]);

  useEffect(() => {
    playedGreetingRef.current = false;
    const viewer = modelViewerRef.current;
    if (!viewer || !arCharacter.defaultAnimation) return;

    const playGreetingOnce = () => {
      if (playedGreetingRef.current) return;
      playedGreetingRef.current = true;
      viewer.animationName = arCharacter.defaultAnimation;
      viewer.currentTime = 0;
      viewer.pause?.();
      requestAnimationFrame(() => {
        const playResult = viewer.play?.({ repetitions: 1 });
        if (playResult?.catch) {
          playResult.catch(() => viewer.pause?.());
        }
      });
    };
    const handleFinished = () => viewer.pause?.();

    viewer.addEventListener("load", playGreetingOnce);
    viewer.addEventListener("finished", handleFinished);

    if (viewer.loaded) {
      playGreetingOnce();
    }

    return () => {
      viewer.removeEventListener("load", playGreetingOnce);
      viewer.removeEventListener("finished", handleFinished);
    };
  }, [hasMounted, arCharacter.defaultAnimation, arCharacter.glbUrl]);

  // Monitor focus/visibility change to open upload modal when returning from iOS AR Quick Look
  useEffect(() => {
    const handleReturnFromQuickLook = () => {
      if (typeof window !== "undefined") {
        const pendingId = localStorage.getItem("scd_pending_ar_upload");
        if (pendingId === (station.id || stationId)) {
          localStorage.removeItem("scd_pending_ar_upload");
          setShowUploadModal(true);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleReturnFromQuickLook();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleReturnFromQuickLook);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleReturnFromQuickLook);
    };
  }, [station, stationId]);

  async function handleLaunchAr() {
    setArMessage("");
    setIsTracking(true);

    if (!hasCamera) {
      await openCamera();
    }

    const viewer = modelViewerRef.current;
    if (!viewer || typeof viewer.activateAR !== "function") {
      setArStatus("unsupported");
      setArMessage(tc("errors.arUnsupported"));
      return;
    }

    try {
      setArStatus("launching");
      await viewer.activateAR();
      setArStatus("tracking");
    } catch (error) {
      console.error("Native AR launch error:", error);
      setArStatus("failed");
      setArMessage(tc("errors.arLaunchFailed"));
    }
  }

  function handleQuickLookTap() {
    setArMessage("");
    setIsTracking(true);
    setArStatus("tracking");
    stopCamera();

    // Mark pending upload session in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("scd_pending_ar_upload", station.id || stationId);
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadProgress(0);
  };

  const handleUploadAndStamp = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload to Cloudinary using raw progress tracking
      const res = await uploadToCloudinary(selectedFile, "journey-stamps", (percent) => {
        setUploadProgress(percent);
      });

      // 2. Update Firestore if user is authenticated
      if (user && db) {
        await saveJourneyProgress({
          db,
          uid: user.uid,
          stationId: station.id || stationId,
          stationName: station.name,
          source: "ios-ar-quicklook",
          photoUrl: res.url,
        });

        await saveArExperience({
          db,
          uid: user.uid,
          stationId: station.id || stationId,
          stationName: station.name,
          modelId: arCharacter.id || station.arGuide?.modelId || fallbackArCharacterId,
          status: "completed",
        });
      }

      // 3. Keep fallback state locally for guest authentication sessions
      if (typeof window !== "undefined") {
        const visitedList = JSON.parse(localStorage.getItem("scd_visited_stations") || "[]");
        if (!visitedList.includes(station.id)) {
          visitedList.push(station.id);
          localStorage.setItem("scd_visited_stations", JSON.stringify(visitedList));
        }
        const photosMap = JSON.parse(localStorage.getItem("scd_station_photos") || "{}");
        photosMap[station.id] = res.url;
        localStorage.setItem("scd_station_photos", JSON.stringify(photosMap));
      }

      setIsStamped(true);
      setShowUploadModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setHasCompletedAllStops(await checkAllStationsCompleted());

      showToast(`${tc("toast.stampSuccessPrefix")} ${displayStation.name} ${tc("toast.stampSuccessSuffix")}`, "success");

      // Play Confetti Celebration and show success dialog
      if (typeof window !== "undefined") {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
        script.onload = () => {
          window.confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
          });
        };
        document.body.appendChild(script);
      }
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Cloudinary stamp upload failed:", err);
      showToast(tc("errors.uploadFailed"), "error");
    } finally {
      setIsUploading(false);
    }
  };

  function handleNarration() {
    const sid2 = station.id || stationId;
    const narrationUrl = locale === "en" ? stationNarrationAudioEn[sid2] || stationNarrationAudio[sid2] : stationNarrationAudio[sid2];
    if (!narrationUrl) {
      setArMessage(tc("errors.noNarration"));
      return;
    }

    if (narrationAudioRef.current && !narrationAudioRef.current.paused) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.currentTime = 0;
      setIsNarrating(false);
      return;
    }

    const audio = new Audio(narrationUrl);
    audio.preload = "auto";
    audio.muted = isMuted;
    audio.onended = () => setIsNarrating(false);
    audio.onerror = () => {
      setIsNarrating(false);
      setArMessage(tc("errors.narrationPlayFailed"));
    };
    narrationAudioRef.current = audio;

    audio.play()
      .then(() => {
        setArMessage("");
        setIsNarrating(true);
      })
      .catch(() => setArMessage(tc("errors.narrationPlayFailed")));
  }

  function toggleNarrationMute() {
    setIsMuted((currentMuted) => {
      const nextMuted = !currentMuted;
      if (narrationAudioRef.current) narrationAudioRef.current.muted = nextMuted;
      return nextMuted;
    });
  }

  async function handleStamp() {
    if (!isTracking) {
      return;
    }

    setIsStamped(true);
    if (typeof window !== "undefined") {
      const visited = JSON.parse(localStorage.getItem("scd_visited_stations") || "[]");
      if (!visited.includes(station.id)) {
        localStorage.setItem("scd_visited_stations", JSON.stringify([...visited, station.id]));
      }
    }

    try {
      await saveJourneyProgress({
        db,
        uid: user?.uid,
        stationId: station.id || stationId,
        stationName: station.name,
        source: "ar-live",
      });
      await saveArExperience({
        db,
        uid: user?.uid,
        stationId: station.id || stationId,
        stationName: station.name,
        modelId: station.arGuide?.modelId,
      });
      setHasCompletedAllStops(await checkAllStationsCompleted());

      showToast(`${tc("toast.stampSuccessPrefix")} ${displayStation.name} ${tc("toast.stampSuccessSuffix")}`, "success");

      // Play confetti and show success dialog
      if (typeof window !== "undefined") {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
        script.onload = () => {
          window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        };
        document.body.appendChild(script);
      }
      setShowSuccessModal(true);
    } catch (e) {
      console.error("AR live stamp saving failed:", e);
      showToast(tc("errors.stampFailed"), "error");
    }
  }

  function handleSheetPointerDown(event) {
    dragStartRef.current = { y: event.clientY, position: sheetPosition };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleSheetPointerUp(event) {
    if (!dragStartRef.current) {
      return;
    }

    const deltaY = event.clientY - dragStartRef.current.y;
    const currentIndex = sheetPositions.indexOf(dragStartRef.current.position);
    const nextIndex = deltaY > 36 ? currentIndex + 1 : deltaY < -36 ? currentIndex - 1 : currentIndex;
    const boundedIndex = Math.min(sheetPositions.length - 1, Math.max(0, nextIndex));

    setSheetPosition(sheetPositions[boundedIndex]);
    dragStartRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  const arButtonLabel =
    arStatus === "launching"
      ? tc("arButton.launching")
      : isTracking
        ? tc("arButton.relaunch")
        : tc("arButton.launch");

  return (
    <main className="ar-live-page">
      <img className="ar-live-background" src={station.image} alt={displayStation.name} loading="eager" decoding="async" />
      {hasMounted ? <video ref={videoRef} className="ar-live-camera" autoPlay playsInline muted aria-hidden="true" /> : null}
      <div className="ar-live-vignette" aria-hidden="true" />

      {hasMounted ? (
        <model-viewer
          ref={modelViewerRef}
          class="ar-live-model-viewer"
          src={arCharacter.glbUrl}
          ios-src={arCharacter.usdzUrl}
          poster={arCharacter.posterUrl || undefined}
          alt="AR guide model"
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-placement="floor"
          camera-controls
          shadow-intensity="0.2"
          animation-name={arCharacter.defaultAnimation || undefined}
        />
      ) : null}

      <header className="ar-live-header">
        <div>
          <a className="ar-live-station" href={`/hanh-trinh/${station.id}`} aria-label={`${tc("backAriaPrefix")} ${displayStation.name}`}>
            <img src="/assets/anh-new/AVT.jpg" alt="" aria-hidden="true" />
            <span>{displayStation.name}</span>
          </a>
          <p className="ar-live-status">
            <span aria-hidden="true" />
            {tc("sessionLabel")}
          </p>
        </div>
        <div className="ar-live-header-right">
          <button
            type="button"
            className="ar-live-help"
            onClick={() => {
              stopCamera();
              setShowArGuide(true);
            }}
            aria-label={tc("helpAria")}
          >
            ?
          </button>
          <a className="ar-live-close" href={`/hanh-trinh/${station.id}`} aria-label={tc("closeArAria")}>
            <img src={`${viewArBase}/mobile-app/btn-close.svg`} alt="" aria-hidden="true" />
          </a>
        </div>
      </header>

      <div className={`ar-live-reticle ${isTracking ? "is-tracking" : ""}`} aria-hidden="true">
        <span />
      </div>

      <section
        className={`ar-live-sheet is-${sheetPosition}`}
        aria-label={tc("sheetAria")}
        onPointerDown={handleSheetPointerDown}
        onPointerUp={handleSheetPointerUp}
      >
        <button className="ar-live-sheet-handle" type="button" aria-label={tc("sheetHandleAria")} />
        <p>{tc("sheetHint")}</p>
        <h1>
          {isTracking
            ? tc("sheetTitleTracking")
            : tc("sheetTitleIdle")}
        </h1>

        {arMessage ? <p className="ar-live-message">{arMessage}</p> : null}

        {isIosQuickLook ? (
          <a
            className="ar-live-primary ar-live-primary-quicklook"
            href={arCharacter.usdzUrl || fallbackArIosModelSrc}
            rel="ar"
            aria-label={arButtonLabel}
            data-label={arButtonLabel}
            onClick={handleQuickLookTap}
          >
            <img className="ar-live-quicklook-hit-image" src={`${viewArBase}/mobile-app/ic-mo-ar-de-track-khuon-mat.svg`} alt="" aria-hidden="true" />
          </a>
        ) : (
          <button className="ar-live-primary" type="button" onClick={handleLaunchAr} disabled={arStatus === "launching"}>
            <img src={`${viewArBase}/mobile-app/ic-mo-ar-de-track-khuon-mat.svg`} alt="" aria-hidden="true" />
            {arButtonLabel}
          </button>
        )}

        <div className="ar-live-secondary-row">
          <button className={`ar-live-secondary ${isNarrating ? "is-playing" : ""}`} type="button" onClick={handleNarration}>
            <img src={`${viewArBase}/mobile-app/ic-phat-thuyet-minh.svg`} alt="" aria-hidden="true" />
            {isNarrating ? tc("narration.stop") : tc("narration.play")}
          </button>
          <button className={`ar-live-icon-button ${isMuted ? "is-active" : ""}`} type="button" onClick={toggleNarrationMute} aria-label={tc("narration.muteAria")}>
            <img src={`${viewArBase}/mobile-app/ic-mute-voice.svg`} alt="" aria-hidden="true" />
          </button>
        </div>

        <button className="ar-live-stamp" type="button" disabled={!isTracking} onClick={handleStamp}>
          <img src={`${viewArBase}/mobile-app/ic-dong-dau-passport-so.svg`} alt="" aria-hidden="true" />
          {isStamped ? tc("stamp.done") : tc("stamp.action")}
        </button>

        <span className={`ar-live-bottom-dot ${isTracking ? "is-active" : ""}`} aria-hidden="true" />
      </section>

      {/* Dynamic iOS QuickLook Upload Modal */}
      {showUploadModal && (
        <div className="ar-upload-modal-backdrop">
          <div className="ar-upload-modal-content">
            <h3>{tc("uploadModal.title")}</h3>
            <p>{tc("uploadModal.description")}</p>

            <div className="ar-upload-preview">
              {previewUrl ? (
                <img src={previewUrl} alt={tc("uploadModal.photoAlt")} />
              ) : (
                <div className="ar-upload-placeholder font-baloo">{tc("uploadModal.noPhoto")}</div>
              )}
            </div>

            <div className="ar-upload-input-group">
              <input
                type="file"
                accept="image/*"
                id="ar-photo-file-input"
                onChange={handleFileChange}
                style={{ display: "none" }}
                disabled={isUploading}
              />
              <label htmlFor="ar-photo-file-input" className="ar-upload-file-label">
                {selectedFile ? tc("uploadModal.changePhoto") : tc("uploadModal.choosePhoto")}
              </label>
            </div>

            {isUploading && (
              <div className="ar-upload-progress-container">
                <div className="ar-upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                <span>{tc("uploadModal.uploadingPrefix")} {uploadProgress}%</span>
              </div>
            )}

            <div className="ar-upload-modal-actions">
              <button
                type="button"
                className="ar-upload-submit-btn"
                onClick={handleUploadAndStamp}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? tc("uploadModal.saving") : tc("uploadModal.submit")}
              </button>
              <button
                type="button"
                className="ar-upload-cancel-btn"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                disabled={isUploading}
              >
                {tc("uploadModal.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showArGuide && (
        <ArOnboardingGuide 
          onClose={() => {
            setShowArGuide(false);
            if (!isIosQuickLook) {
              openCamera();
            }
          }} 
          onStart={() => {
            setShowArGuide(false);
            if (!isIosQuickLook) {
              openCamera();
            }
          }} 
        />
      )}

      {showSuccessModal && (
        <div className="checkin-success-overlay" role="dialog" aria-modal="true">
          <div className="checkin-success-backdrop" />
          <div className="checkin-success-card">
            <div className="checkin-success-icon-wrapper">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3>{hasCompletedAllStops ? tc("success.allDoneTitle") : tc("success.stationDoneTitle")}</h3>
            <p>
              {hasCompletedAllStops ? (
                <>{tc("success.allDoneText")}</>
              ) : (
                <>{tc("success.stationDonePrefix")} <strong>{displayStation.name}</strong> {tc("success.stationDoneSuffix")}</>
              )}
            </p>

            <div className="checkin-success-buttons">
              <button
                type="button"
                className="checkin-success-btn-primary"
                onClick={() => {
                  window.location.href = "/ho-chieu";
                }}
              >
                {tc("success.viewPassport")}
              </button>

              {!hasCompletedAllStops && (
                <button
                  type="button"
                  className="checkin-success-btn-secondary"
                  onClick={() => {
                    window.location.href = "/hanh-trinh";
                  }}
                >
                  {tc("success.backToMap")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
