"use client";

import { useEffect, useState } from "react";
import { stations, steps } from "../../data/sac-co-do";
import { getPublicStations } from "../../lib/firebase/catalog";
import JourneyMapSection from "./JourneyMapSection";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import StationCard from "./StationCard";

export default function JourneyPage() {
  const [journeyStations, setJourneyStations] = useState(stations);

  useEffect(() => {
    let mounted = true;

    async function loadStations() {
      const nextStations = await getPublicStations();
      if (mounted) {
        setJourneyStations(nextStations);
      }
    }

    loadStations();

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
