"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { stations } from "../../data/sac-co-do";
import { getDefaultArCharacter, getStationBySlugOrId } from "../../lib/firebase/catalog";
import { saveArExperience, saveJourneyProgress } from "../../lib/firebase/userData";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { uploadToCloudinary } from "../../lib/cloudinary/client";
import { useToast } from "./ToastProvider";

const viewArBase = "/assets/view-ar";
const fallbackArModelSrc = "/ar/sac-co-do-guide-v2.glb";
const fallbackArIosModelSrc = "/ar/sac-co-do-guide-v2.usdz";
const modelGreetingAnimation = "WaveOnceThenIdle";
const sheetPositions = ["expanded", "middle", "collapsed"];

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
  const fallbackStation = useMemo(() => getStation(stationId), [stationId]);
  const [station, setStation] = useState(fallbackStation);
  const [arCharacter, setArCharacter] = useState({
    glbUrl: fallbackArModelSrc,
    usdzUrl: fallbackArIosModelSrc,
    posterUrl: "",
  });
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const modelViewerRef = useRef(null);
  const playedGreetingRef = useRef(false);
  const dragStartRef = useRef(null);
  
  const [isTracking, setIsTracking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isStamped, setIsStamped] = useState(false);
  const [arStatus, setArStatus] = useState("idle");
  const [arMessage, setArMessage] = useState("");
  const [hasMounted, setHasMounted] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [isIosQuickLook, setIsIosQuickLook] = useState(false);
  const [sheetPosition, setSheetPosition] = useState("middle");

  // AR Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadArConfig() {
      const firebaseStation = await getStationBySlugOrId(stationId);
      const nextStation = firebaseStation || fallbackStation;
      const character = await getDefaultArCharacter(nextStation?.arGuide?.modelId);

      if (!mounted) return;
      setStation(nextStation);
      setArCharacter({
        glbUrl: character?.glbUrl || fallbackArModelSrc,
        usdzUrl: character?.usdzUrl || fallbackArIosModelSrc,
        posterUrl: character?.posterUrl || "",
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
      setArMessage("Trình duyệt này chưa hỗ trợ mở camera.");
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
      setArMessage("Không mở được camera. Hãy cấp quyền camera cho trình duyệt rồi thử lại.");
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

    if (!quickLookDevice) {
      openCamera();
    }

    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    playedGreetingRef.current = false;
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const playGreetingOnce = () => {
      if (playedGreetingRef.current) return;
      playedGreetingRef.current = true;
      viewer.animationName = modelGreetingAnimation;
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
  }, [hasMounted, arCharacter.glbUrl]);

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
      setArMessage("Thiết bị hoặc trình duyệt chưa hỗ trợ mở AR thật. Camera vẫn chạy ở chế độ mô phỏng tracking.");
      return;
    }

    try {
      setArStatus("launching");
      await viewer.activateAR();
      setArStatus("tracking");
    } catch (error) {
      console.error("Native AR launch error:", error);
      setArStatus("failed");
      setArMessage("Không mở được AR thật trên môi trường hiện tại. Camera vẫn chạy ở chế độ mô phỏng tracking.");
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
          modelId: station.arGuide?.modelId,
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

      // Play Confetti Celebration
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

      showToast(`Chúc mừng! Bạn đã hoàn thành check-in tại ${station.name} và đóng dấu mộc thành công!`, "success");
    } catch (err) {
      console.error("Cloudinary stamp upload failed:", err);
      showToast("Không thể đăng tải hình ảnh kỷ niệm. Vui lòng thử lại.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  function handleNarration() {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setArMessage("Trình duyệt này chưa hỗ trợ phát thuyết minh.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `Chào mừng bạn đến với ${station.name}. Hãy lia camera xuống nền phẳng để hệ thống nhận diện mặt đất, sau đó đặt hướng dẫn viên ảo vào không gian di sản.`
    );
    utterance.lang = "vi-VN";
    utterance.rate = 0.94;
    window.speechSynthesis.speak(utterance);
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
      ? "Đang mở AR thật..."
      : isTracking
        ? "Mở lại AR thật để track mặt đất"
        : "Mở AR thật để track mặt đất";

  return (
    <main className="ar-live-page">
      <img className="ar-live-background" src={station.image} alt={station.name} loading="eager" decoding="async" />
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
          animation-name={modelGreetingAnimation}
        />
      ) : null}

      <header className="ar-live-header">
        <div>
          <a className="ar-live-station" href={`/hanh-trinh/${station.id}`} aria-label={`Quay lại ${station.name}`}>
            <img src="/assets/anh-new/AVT.jpg" alt="" aria-hidden="true" />
            <span>{station.name}</span>
          </a>
          <p className="ar-live-status">
            <span aria-hidden="true" />
            AR Live Session
          </p>
        </div>
        <a className="ar-live-close" href={`/hanh-trinh/${station.id}`} aria-label="Đóng AR">
          <img src={`${viewArBase}/mobile-app/btn-close.svg`} alt="" aria-hidden="true" />
        </a>
      </header>

      <div className={`ar-live-reticle ${isTracking ? "is-tracking" : ""}`} aria-hidden="true">
        <span />
      </div>

      <section
        className={`ar-live-sheet is-${sheetPosition}`}
        aria-label="Điều khiển AR"
        onPointerDown={handleSheetPointerDown}
        onPointerUp={handleSheetPointerUp}
      >
        <button className="ar-live-sheet-handle" type="button" aria-label="Kéo bảng điều khiển AR" />
        <p>Lia camera xuống nền phẳng.</p>
        <h1>
          {isTracking
            ? "Đã nhận diện mặt đất, chạm để đặt hướng dẫn viên ảo."
            : "Khi hệ thống nhận diện mặt đất, chạm để đặt hướng dẫn viên ảo."}
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
          <button className="ar-live-secondary" type="button" onClick={handleNarration}>
            <img src={`${viewArBase}/mobile-app/ic-phat-thuyet-minh.svg`} alt="" aria-hidden="true" />
            Phát thuyết minh
          </button>
          <button className={`ar-live-icon-button ${isMuted ? "is-active" : ""}`} type="button" onClick={() => setIsMuted((value) => !value)} aria-label="Bật tắt âm thanh">
            <img src={`${viewArBase}/mobile-app/ic-mute-voice.svg`} alt="" aria-hidden="true" />
          </button>
        </div>

        <button className="ar-live-stamp" type="button" disabled={!isTracking} onClick={handleStamp}>
          <img src={`${viewArBase}/mobile-app/ic-dong-dau-passport-so.svg`} alt="" aria-hidden="true" />
          {isStamped ? "Đã đóng dấu passport số" : "Đóng dấu passport số"}
        </button>

        <span className={`ar-live-bottom-dot ${isTracking ? "is-active" : ""}`} aria-hidden="true" />
      </section>

      {/* Dynamic iOS QuickLook Upload Modal */}
      {showUploadModal && (
        <div className="ar-upload-modal-backdrop">
          <div className="ar-upload-modal-content">
            <h3>Đăng Tải Kỷ Niệm AR</h3>
            <p>Chọn và đăng tải bức ảnh chụp cùng hướng dẫn viên ảo bạn vừa chụp bằng camera iPhone để ghi nhận dấu mộc!</p>
            
            <div className="ar-upload-preview">
              {previewUrl ? (
                <img src={previewUrl} alt="Ảnh chụp AR" />
              ) : (
                <div className="ar-upload-placeholder font-baloo">Chưa chọn ảnh kỷ niệm</div>
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
                {selectedFile ? "Thay đổi ảnh chọn" : "Chọn ảnh từ Thư viện"}
              </label>
            </div>

            {isUploading && (
              <div className="ar-upload-progress-container">
                <div className="ar-upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                <span>Đang tải lên máy chủ: {uploadProgress}%</span>
              </div>
            )}

            <div className="ar-upload-modal-actions">
              <button 
                type="button" 
                className="ar-upload-submit-btn" 
                onClick={handleUploadAndStamp}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? "Đang lưu..." : "Đóng dấu mộc hành trình"}
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
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
