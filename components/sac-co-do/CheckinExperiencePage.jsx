"use client";

import { useMemo, useState } from "react";
import { stations } from "../../data/sac-co-do";

const viewArBase = "/assets/view-ar";

function getStation(stationId) {
  return stations.find((station) => station.id === stationId) || stations[0];
}

export default function CheckinExperiencePage({ stationId }) {
  const station = useMemo(() => getStation(stationId), [stationId]);
  const [isTracking, setIsTracking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isStamped, setIsStamped] = useState(false);

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

  return (
    <main className="ar-live-page">
      <img className="ar-live-background" src={station.image} alt={station.name} loading="eager" decoding="async" />
      <div className="ar-live-vignette" aria-hidden="true" />

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

      <section className="ar-live-sheet" aria-label="Điều khiển AR">
        <span className="ar-live-sheet-handle" aria-hidden="true" />
        <p>Lia camera xuống nền phẳng.</p>
        <h1>{isTracking ? "Đã nhận diện mặt đất, chạm để đặt hướng dẫn viên ảo." : "Khi hệ thống nhận diện mặt đất, chạm để đặt hướng dẫn viên ảo."}</h1>

        <button className="ar-live-primary" type="button" onClick={() => setIsTracking(true)}>
          <img src={`${viewArBase}/mobile-app/ic-mo-ar-de-track-khuon-mat.svg`} alt="" aria-hidden="true" />
          {isTracking ? "Đã bật tracking mặt đất" : "Mở AR thật để track mặt đất"}
        </button>

        <div className="ar-live-secondary-row">
          <button className="ar-live-secondary" type="button">
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
