"use client";

import { useState } from "react";
import { stations } from "../../data/sac-co-do";

const mapMarkers = [
  { number: "1", name: "Chùa Bái Đính", id: "bai-dinh", x: 47, y: 15, checkX: 86.8, checkY: 20.4, mobileX: 61, mobileY: 45 },
  { number: "2", name: "Tràng An", id: "trang-an", x: 31, y: 36, checkX: 86.8, checkY: 31.2, mobileX: 30, mobileY: 43 },
  { number: "3", name: "Hang Múa", id: "hang-mua", x: 63, y: 41, checkX: 86.8, checkY: 42.6, mobileX: 24, mobileY: 72 },
  { number: "4", name: "Tam Cốc", id: "tam-coc", x: 51, y: 59, checkX: 86.8, checkY: 53.6, mobileX: 45, mobileY: 56 },
  { number: "5", name: "Hoa Lư", id: "hoa-lu", x: 33, y: 78, checkX: 86.8, checkY: 65.6, mobileX: 55, mobileY: 82 },
  { number: "6", name: "Phố Cổ Hoa Lư", id: "pho-co-hoa-lu", x: 58, y: 77, checkX: 86.8, checkY: 76.7, mobileX: 54, mobileY: 29 },
];

export default function JourneyMapSection() {
  const [activeMarker, setActiveMarker] = useState(null);

  return (
    <section className="journey-map-section" aria-label="Bản đồ hành trình Sắc Cố Đô">
      <div className="journey-travel-desk">
        <div className="journey-map-frame">
          <picture>
            <source media="(max-width: 760px)" srcSet="/assets/dia-danh/ban-do-mobile.png" />
            <img src="/assets/dia-danh/ban-do.png" alt="Bản đồ di sản Ninh Bình" loading="lazy" decoding="async" />
          </picture>
          
          {mapMarkers.map((marker, index) => {
            const stationDetails = stations.find((s) => s.id === marker.id) || {};
            const isActive = activeMarker === marker.id;

            return (
              <a
                key={marker.number}
                className="journey-map-marker"
                href={`/hanh-trinh/${marker.id}`}
                style={{
                  "--marker-x": `${marker.x}%`,
                  "--marker-y": `${marker.y}%`,
                  "--marker-mobile-x": `${marker.mobileX}%`,
                  "--marker-mobile-y": `${marker.mobileY}%`,
                  "--marker-delay": `${160 + index * 90}ms`,
                  zIndex: isActive ? 100 : 3,
                }}
                onMouseEnter={() => setActiveMarker(marker.id)}
                onMouseLeave={() => setActiveMarker(null)}
                aria-label={`${marker.number}. ${marker.name}`}
              >
                <span className="map-flag" aria-hidden="true">
                  <span>{marker.number}</span>
                </span>
                <span className="map-flag-label">{marker.name}</span>

                {/* Popover Card inside the marker */}
                <div 
                  className={`marker-popover-card ${isActive ? "active" : ""}`}
                  style={{
                    position: "absolute",
                    bottom: "120%",
                    left: "50%",
                    transform: isActive ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(10px)",
                    width: "240px",
                    background: "#ffffff",
                    border: "1px solid var(--line)",
                    borderRadius: "12px",
                    boxShadow: "var(--shadow)",
                    padding: "12px",
                    zIndex: 100,
                    opacity: isActive ? 1 : 0,
                    visibility: isActive ? "visible" : "hidden",
                    transition: "opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease",
                    color: "var(--ink)",
                    whiteSpace: "normal",
                  }}
                  onClick={(e) => {
                    // Prevent click bubble inside card triggering immediately
                    e.stopPropagation();
                  }}
                >
                  <img 
                    src={stationDetails.image} 
                    alt={marker.name} 
                    style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px", marginBottom: "8px" }}
                  />
                  <h4 style={{ fontFamily: "Baloo 2", fontSize: "16px", margin: "0 0 4px", fontWeight: "800" }}>
                    {stationDetails.name}
                  </h4>
                  <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 8px", lineHeight: "1.4" }}>
                    {stationDetails.description}
                  </p>
                  <span 
                    className="marker-popover-btn" 
                    style={{
                      display: "block",
                      textAlign: "center",
                      background: "var(--brand)",
                      color: "#ffffff",
                      padding: "6px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "800"
                    }}
                  >
                    Khám phá địa điểm
                  </span>
                </div>
              </a>
            );
          })}
          
          {mapMarkers.map((marker, index) => (
            <label
              key={`check-${marker.number}`}
              className="journey-map-check"
              style={{ "--check-x": `${marker.checkX}%`, "--check-y": `${marker.checkY}%`, "--check-delay": `${420 + index * 70}ms` }}
            >
              <input type="checkbox" aria-label={`Đánh dấu đã qua ${marker.name}`} />
              <span aria-hidden="true" />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
