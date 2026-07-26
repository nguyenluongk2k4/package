"use client";

import { useEffect, useRef, useState } from "react";
import { stations } from "../../data/sac-co-do";
import { getPublicStations } from "../../lib/firebase/catalog";
import JourneyMapSection from "./JourneyMapSection";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import StationCard from "./StationCard";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { translate, useI18n } from "./I18nProvider";
import journeyDict from "../../locales/journey.json";
import { Lock } from "lucide-react";
import Lottie from "lottie-react";

export default function JourneyPage() {
  const { user, db, profile, loading } = useFirebaseAuth();
  const { locale } = useI18n();
  const tj = (key) => translate(journeyDict, locale, key);
  const steps = journeyDict[locale]?.steps || journeyDict.vi.steps;
  const [journeyStations, setJourneyStations] = useState(stations);
  const [nibiData, setNibiData] = useState(null);
  const [visitedIds, setVisitedIds] = useState([]);
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

  // Load visited stations progress
  useEffect(() => {
    let active = true;

    async function loadProgress() {
      const validStationIds = new Set(journeyStations.map((station) => station.id));
      let guestVisited = [];
      if (typeof window !== "undefined") {
        try {
          guestVisited = JSON.parse(localStorage.getItem("scd_visited_stations") || "[]").filter((id) =>
            validStationIds.has(id)
          );
        } catch (_) {}
      }

      if (!db || !user) {
        if (active) setVisitedIds(guestVisited);
        return;
      }

      try {
        const { getDocs, collection } = await import("firebase/firestore");
        const querySnapshot = await getDocs(collection(db, "users", user.uid, "journeyProgress"));
        if (!active) return;
        const dbVisited = [];
        querySnapshot.forEach((docSnapshot) => {
          if (validStationIds.has(docSnapshot.id)) {
            dbVisited.push(docSnapshot.id);
          }
        });
        setVisitedIds(dbVisited);
      } catch (err) {
        console.warn("⚠️ [JourneyPage] Lỗi tải tiến trình:", err);
        if (active) setVisitedIds(guestVisited);
      }
    }

    if (!loading) {
      loadProgress();
    }
    
    return () => {
      active = false;
    };
  }, [user, db, loading, journeyStations]);

  // Mặc định là Khóa (isLocked = true) khi đang trong trạng thái loading để bảo mật tuyệt đối,
  // tránh hiển thị chớp nhoáng (flash) dữ liệu hành trình và không bị treo ở màn hình loading.
  const isLocked = loading || !user || !profile?.isActivated;

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <section className="page-title-banner">
          <img src="/assets/anh-new/cover photo.jpg" alt="" aria-hidden="true" />
          <div>
            <p className="eyebrow">{tj("banner.eyebrow")}</p>
            <h1>{tj("banner.title")}</h1>
            <p>{tj("banner.description")}</p>
          </div>
        </section>

        {isLocked ? (
          <div className="journey-locked-wrapper">
            <div className="journey-content-blur">
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
                    <strong>{tj("nibi.label")}</strong> &ldquo;{tj("nibi.text")}&rdquo;
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
              <JourneyMapSection visitedIds={visitedIds} />
              <div className="station-grid">
                {journeyStations.map((station) => (
                  <StationCard key={station.id} station={station} />
                ))}
              </div>
            </div>

            <div className="journey-lock-overlay-panel">
              <div className="journey-lock-card">
                <div className="lock-icon-container">
                  <Lock />
                </div>
                <h2>{tj("lock.title")}</h2>
                <p>
                  {tj("lock.text")}
                </p>
                <div className="journey-lock-actions">
                  <a href="/kich-hoat" className="btn primary">
                    {tj("lock.activateCta")}
                  </a>
                  {!user && (
                    <a href="/dang-nhap" className="btn secondary">
                      {tj("lock.loginCta")}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                  <strong>{tj("nibi.label")}</strong> &ldquo;{tj("nibi.text")}&rdquo;
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
            <JourneyMapSection visitedIds={visitedIds} />
            <div className="station-grid">
              {journeyStations.map((station) => (
                <StationCard key={station.id} station={station} />
              ))}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
