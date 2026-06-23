"use client";

import { useEffect, useRef, useState } from "react";
import { stations, steps } from "../../data/sac-co-do";
import { getPublicStations } from "../../lib/firebase/catalog";
import JourneyMapSection from "./JourneyMapSection";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import StationCard from "./StationCard";
import Lottie from "lottie-react";

export default function JourneyPage() {
  const [journeyStations, setJourneyStations] = useState(stations);
  const [nibiData, setNibiData] = useState(null);
  const lottieRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadStations() {
      const nextStations = await getPublicStations();
      if (mounted) {
        setJourneyStations(nextStations);
      }
    }

    loadStations();

    // Load nibi.json
    fetch("/ar/nibi.json")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setNibiData(data);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <section className="page-title-banner">
          <img src="/assets/anh-new/cover photo.jpg" alt="" aria-hidden="true" />
          <div>
            <p className="eyebrow">Hành trình</p>
            <h1>Bản đồ 6 trạm văn hóa Ninh Bình</h1>
            <p>Mỗi trạm được thiết kế để người dùng có lý do dừng lại, quét QR và ghi dấu vào passport.</p>
          </div>
        </section>

        {/* Nibi guide + Lottie */}
        <div className="nibi-guide">
          <div className="nibi-guide-lottie">
            {nibiData ? (
              <Lottie
                lottieRef={lottieRef}
                animationData={nibiData}
                loop={true}
                autoplay={true}
                style={{ width: "100%", height: "100%", background: "#ffffff" }}
              />
            ) : (
              <div className="nibi-guide-placeholder" />
            )}
          </div>
          <div className="nibi-guide-text">
            <p>
              <strong>Nibi:</strong> &ldquo;Hãy theo sát lộ trình 3 bước dưới đây để kết nối trọn vẹn di sản
              Ninh Bình và mở khóa các phần quà hấp dẫn!&rdquo;
            </p>
          </div>
        </div>

        <div className="timeline">
          {steps.map((step) => (
            <article key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
        <JourneyMapSection />
        <div className="station-grid">
          {journeyStations.map((station) => (
            <StationCard key={station.id} station={station} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
