"use client";

import { CarFront } from "lucide-react";
import { stations } from "../../data/sac-co-do";

function stationById(id) {
  return stations.find((station) => station.id === id) || {};
}

const map1 = {
  title: "Hành trình 1",
  tone: "green",
  cardClass: "card-ht1",
  nodes: [
    { id: "trang-an", label: "Tràng An", note: "Non nước", x: 50, y: 15 },
    { id: "tam-coc", label: "Tam Cốc - Bích Động", note: "Dòng sông di sản", x: 20, y: 52 },
    { id: "hoa-lu", label: "Cố Đô Hoa Lư", note: "Kinh đô xưa", x: 80, y: 52 },
    { id: "pho-co-hoa-lu", label: "Phố Cổ Hoa Lư", note: "Trung tâm hành trình", x: 50, y: 82, featured: true },
  ],
  paths: [
    { id: "trang-an-tam-coc", d: "M50 15 C35 20 25 35 20 52", distance: "5 km", time: "12 phút", x: 28, y: 28, tone: "green" },
    { id: "trang-an-hoa-lu", d: "M50 15 C65 20 75 35 80 52", distance: "12 km", time: "20 phút", x: 72, y: 28, tone: "green" },
    { id: "tam-coc-pho-co", d: "M20 52 C25 68 35 78 50 82", distance: "6 km", time: "15 phút", x: 28, y: 74, tone: "green" },
    { id: "hoa-lu-pho-co", d: "M80 52 C75 68 65 78 50 82", distance: "8 km", time: "20 phút", x: 72, y: 74, tone: "green" },
  ],
  assets: [
    { src: "/assets/ban-do/mat-troi.png", alt: "Mặt trời", className: "asset-sun", x: 85, y: 12, width: 10 },
    { src: "/assets/ban-do/co-do-asset.png", alt: "Cổ đô Ninh Bình", className: "asset-gate-left", x: 15, y: 15, width: 15 },
    { src: "/assets/ban-do/thuyen-dang-cho-khach.png", alt: "Thuyền du lịch", className: "asset-boat-1", x: 10, y: 80, width: 8.5 },
    { src: "/assets/ban-do/thuyen-cho-1-nguoi-canh-go-dat.png", alt: "Thuyền chở khách", className: "asset-boat-2", x: 16, y: 75, width: 7.5 },
    { src: "/assets/ban-do/thuyen-lai-don.png", alt: "Người lái đò", className: "asset-boat-3", x: 11, y: 68, width: 6.5 },
  ],
};

const map2 = {
  title: "Hành trình 2",
  tone: "brown",
  cardClass: "card-ht2",
  nodes: [
    { id: "hang-mua", label: "Hang Múa", note: "Điểm ngắm toàn cảnh", x: 25, y: 75 },
    { id: "bai-dinh", label: "Chùa Bái Đính", note: "Tâm linh", x: 75, y: 75 },
  ],
  paths: [
    { id: "ht2-trunk", d: "M50 0 L50 45", distance: "", time: "", x: -100, y: -100, tone: "brown" },
    { id: "ht2-to-hang-mua", d: "M50 45 C40 50 30 60 25 75", distance: "5 km", time: "12 phút", x: 33, y: 58, tone: "brown" },
    { id: "ht2-to-bai-dinh", d: "M50 45 C60 50 70 60 75 75", distance: "12 km", time: "20 phút", x: 67, y: 58, tone: "brown" },
  ],
  assets: [
    { src: "/assets/ban-do/nui-2.png", alt: "Núi đá Ninh Bình", className: "asset-mountain-back", x: 78, y: 24, width: 15 },
    { src: "/assets/ban-do/nui.png", alt: "Dãy núi đá vôi", className: "asset-mountain-front", x: 90, y: 28, width: 15 },
  ],
};

const maps = [map1, map2];

export default function JourneyMapSection() {
  return (
    <section className="journey-route-map-section" aria-label="Lộ trình khám phá Ninh Bình">
      <div className="journey-route-heading">
        <p>Lộ trình khám phá Ninh Bình</p>
        <h2>Khám phá 6 điểm đến nổi bật</h2>
      </div>

      {maps.map((map) => (
        <div key={map.title} className={`journey-route-map-card ${map.cardClass}`}>
          {/* Header tĩnh chứa tag tiêu đề hành trình */}
          <div className="journey-route-card-header">
            <span className={`journey-route-group journey-route-group-${map.tone}`}>
              {map.title}
            </span>
          </div>

          <div className="journey-route-stage">
            <div className="journey-map-asset-layer" aria-hidden="true">
              {map.assets.map((asset) => (
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
              {map.paths.map((path) => (
                <path 
                  key={path.id} 
                  className={`journey-route-path journey-route-path-${path.tone || "green"}`} 
                  d={path.d} 
                />
              ))}
            </svg>

            {map.paths.map((path) => {
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

            {map.nodes.map((node) => {
              const station = stationById(node.id);
              return (
                <a
                  key={node.id}
                  className={`journey-route-node${node.featured ? " is-featured" : ""}`}
                  href={`/hanh-trinh/${node.id}`}
                  style={{ "--route-x": `${node.x}%`, "--route-y": `${node.y}%` }}
                >
                  <span className="journey-route-photo">
                    <img src={station.image} alt={node.label} loading="lazy" decoding="async" />
                  </span>
                  <span className="journey-route-label">{node.label}</span>
                  <span className="journey-route-note">{node.note}</span>
                </a>
              );
            })}
          </div>
        </div>
      ))}

      {/* Ghi chú chung ở cuối cùng */}
      <div className="journey-route-footnote">
        <strong>Ghi chú</strong>
        <span>Thứ tự gợi ý có thể đổi theo thời gian lưu trú, thời tiết và điểm xuất phát.</span>
      </div>
    </section>
  );
}
