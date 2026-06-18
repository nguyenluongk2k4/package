"use client";

import { useState, useEffect, useRef } from "react";
import { CarFront } from "lucide-react";
import { stations } from "../../data/sac-co-do";

function stationById(id) {
  return stations.find((station) => station.id === id) || {};
}

const routeNodes = [
  { id: "trang-an", label: "Tràng An", note: "Non nước", x: 50, y: 10, align: "bottom" },
  { id: "tam-coc", label: "Tam Cốc - Bích Động", note: "Dòng sông di sản", x: 20, y: 32, align: "left" },
  { id: "hoa-lu", label: "Cố Đô Hoa Lư", note: "Kinh đô xưa", x: 80, y: 32, align: "right" },
  { id: "pho-co-hoa-lu", label: "Phố Cổ Hoa Lư", note: "Trung tâm hành trình", x: 50, y: 48, featured: true, align: "bottom" },
  { id: "hang-mua", label: "Hang Múa", note: "Điểm ngắm toàn cảnh", x: 25, y: 86, align: "left" },
  { id: "bai-dinh", label: "Chùa Bái Đính", note: "Tâm linh", x: 75, y: 86, align: "right" },
];

const routeGroups = [
  { label: "Hành trình 1", x: 50, y: 3, tone: "green" },
  { label: "Hành trình 2", x: 50, y: 66, tone: "brown" },
];

const mapAssets = [
  // Asset cho Hành trình 1
  { src: "/assets/ban-do/mat-troi.png", alt: "Mặt trời", className: "asset-sun", x: 85, y: 12, width: 10 },
  { src: "/assets/ban-do/co-do-asset.png", alt: "Cổ đô Ninh Bình", className: "asset-gate-left", x: 15, y: 15, width: 15 },
  { src: "/assets/ban-do/thuyen-dang-cho-khach.png", alt: "Thuyền du lịch", className: "asset-boat-1", x: 6, y: 56, width: 8.5 },
  { src: "/assets/ban-do/thuyen-cho-1-nguoi-canh-go-dat.png", alt: "Thuyền chở khách", className: "asset-boat-2", x: 12, y: 50, width: 7.5 },
  { src: "/assets/ban-do/thuyen-lai-don.png", alt: "Người lái đò", className: "asset-boat-3", x: 7, y: 44, width: 6.5 },
  
  // Asset cho Hành trình 2 (Đặt bên phải, tránh đè lên Chùa Bái Đính)
  { src: "/assets/ban-do/nui-2.png", alt: "Núi đá Ninh Bình", className: "asset-mountain-back", x: 76, y: 64, width: 15 },
  { src: "/assets/ban-do/nui.png", alt: "Dãy núi đá vôi", className: "asset-mountain-front", x: 89, y: 68, width: 15 },
];

const routePaths = [
  // HÀNH TRÌNH 1 (Màu xanh lục - Green)
  { id: "trang-an-tam-coc", d: "M50 10 C35 15 25 24 20 32", distance: "5 km", time: "12 phút", x: 28, y: 20, tone: "green" },
  { id: "trang-an-hoa-lu", d: "M50 10 C65 15 75 24 80 32", distance: "12 km", time: "20 phút", x: 72, y: 20, tone: "green" },
  { id: "tam-coc-pho-co", d: "M20 32 C25 40 35 48 50 48", distance: "6 km", time: "15 phút", x: 28, y: 44, tone: "green" },
  { id: "hoa-lu-pho-co", d: "M80 32 C75 40 65 48 50 48", distance: "8 km", time: "20 phút", x: 72, y: 44, tone: "green" },

  // ĐƯỜNG NỐI HÀNH TRÌNH 2 (Màu nâu đỏ - Brown)
  // Đi thẳng từ dưới chân của Phố Cổ Hoa Lư (50, 63) xuống Điểm phân nhánh (50, 72)
  { id: "pho-co-to-split", d: "M50 63 L50 72", distance: "", time: "", x: -100, y: -100, tone: "brown" },
  
  // Rẽ nhánh từ Điểm phân nhánh (50, 72) sang hai bên Hang Múa và Chùa Bái Đính
  { id: "split-to-hang-mua", d: "M50 72 C40 76 30 80 25 86", distance: "5 km", time: "12 phút", x: 33, y: 77, tone: "brown" },
  { id: "split-to-bai-dinh", d: "M50 72 C60 76 70 80 75 86", distance: "12 km", time: "20 phút", x: 67, y: 77, tone: "brown" },
];

function MapNode({ node }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const station = stationById(node.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "60px" } // Trì hoãn nhẹ cho đến khi đi gần vào khung nhìn
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <a
      ref={ref}
      className={`journey-route-node align-${node.align || "bottom"}${node.featured ? " is-featured" : ""}${isVisible ? " is-loaded" : " is-placeholder"}`}
      href={`/hanh-trinh/${node.id}`}
      style={{ "--route-x": `${node.x}%`, "--route-y": `${node.y}%` }}
    >
      {isVisible ? (
        <>
          <span className="journey-route-photo animate-fade-in">
            <img src={station.image} alt={node.label} loading="lazy" decoding="async" />
          </span>
          <span className="journey-route-text-group animate-slide-up">
            <span className="journey-route-label">{node.label}</span>
            <span className="journey-route-note">{node.note}</span>
          </span>
        </>
      ) : (
        <span className="journey-route-node-placeholder">
          <span className="placeholder-pulse" />
        </span>
      )}
    </a>
  );
}

export default function JourneyMapSection() {
  return (
    <section className="journey-route-map-section" aria-label="Lộ trình khám phá Ninh Bình">
      <div className="journey-route-heading">
        <p>Lộ trình khám phá Ninh Bình</p>
        <h2>Khám phá 6 điểm đến nổi bật</h2>
      </div>

      <div className="journey-route-map-card card-ht-combined">
        <div className="journey-route-stage">
          <div className="journey-map-asset-layer" aria-hidden="true">
            {mapAssets.map((asset) => (
              <img
                key={`${asset.src}-${asset.x}-${asset.y}`}
                className={`journey-map-asset ${asset.className}`}
                src={asset.src}
                alt={asset.alt}
                loading="lazy"
                decoding="async"
                style={{
                  "--asset-x": `${asset.x}%`,
                  "--asset-y": `${asset.y}%`,
                  "--asset-width": `${asset.width}%`,
                }}
              />
            ))}
          </div>

          <svg className="journey-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            {routePaths.map((path) => (
              <path 
                key={path.id} 
                className={`journey-route-path journey-route-path-${path.tone || "green"}`} 
                d={path.d} 
              />
            ))}
          </svg>

          {routeGroups.map((group) => (
            <span
              key={group.label}
              className={`journey-route-group journey-route-group-${group.tone}`}
              style={{ "--route-x": `${group.x}%`, "--route-y": `${group.y}%` }}
            >
              {group.label}
            </span>
          ))}

          {routePaths.map((path) => {
            if (!path.distance) return null;
            return (
              <span
                key={path.id}
                className="journey-route-chip"
                style={{ "--route-x": `${path.x}%`, "--route-y": `${path.y}%` }}
              >
                <strong>{path.distance}</strong>
                <small>{path.time}</small>
                <CarFront className="journey-route-car" aria-hidden="true" strokeWidth={2.4} />
              </span>
            );
          })}

          {routeNodes.map((node) => (
            <MapNode key={node.id} node={node} />
          ))}

        </div>
      </div>

      {/* Ghi chú chung ở cuối cùng */}
      <div className="journey-route-footnote">
        <strong>Ghi chú</strong>
        <span>Thứ tự gợi ý có thể đổi theo thời gian lưu trú, thời tiết và điểm xuất phát.</span>
      </div>
    </section>
  );
}
