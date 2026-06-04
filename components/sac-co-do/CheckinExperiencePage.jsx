"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { stations } from "../../data/sac-co-do";

const viewArBase = "/assets/view-ar";
const arModelSrc = "/api/ar/sac-co-do-guide.glb";
const arIosModelSrc = "/api/ar/sac-co-do-guide.usdz";
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
  const station = useMemo(() => getStation(stationId), [stationId]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const modelViewerRef = useRef(null);
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

  useEffect(() => {
    setHasMounted(true);
    setIsIosQuickLook(isQuickLookDevice());
    openCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

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
  }

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

  function handleStamp() {
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
          src={arModelSrc}
          ios-src={arIosModelSrc}
          alt="AR guide model"
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-placement="floor"
          camera-controls
          shadow-intensity="0.2"
        />
      ) : null}

      <header className="ar-live-header">
        <div>
          <a className="ar-live-station" href={`/hanh-trinh/${station.id}`} aria-label={`Quay lại ${station.name}`}>
            <img src="/assets/logo.png" alt="" aria-hidden="true" />
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
            href={arIosModelSrc}
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
    </main>
  );
}
