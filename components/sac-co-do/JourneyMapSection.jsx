"use client";

import { useState, useEffect, useRef } from "react";
import { CarFront } from "lucide-react";
import { stations } from "../../data/sac-co-do";
import { translate, useI18n } from "./I18nProvider";
import journeyDict from "../../locales/journey.json";

function stationById(id) {
  return stations.find((station) => station.id === id) || {};
}

const nodeLayout = [
  { id: "trang-an", x: 50, y: 10, align: "bottom" },
  { id: "tam-coc", x: 20, y: 32, align: "left" },
  { id: "hoa-lu", x: 80, y: 32, align: "right" },
  { id: "pho-co-hoa-lu", x: 50, y: 48, featured: true, align: "bottom" },
  { id: "hang-mua", x: 25, y: 86, align: "left" },
  { id: "bai-dinh", x: 75, y: 86, align: "right" },
];

const groupLayout = [
  { key: "route1", x: 50, y: 3, tone: "green" },
  { key: "route2", x: 50, y: 66, tone: "brown" },
];

const assetLayout = [
  // Route 1 assets
  { key: "sun", src: "/assets/ban-do/mat-troi.png", className: "asset-sun", x: 85, y: 12, width: 10 },
  { key: "gate", src: "/assets/ban-do/co-do-asset.png", className: "asset-gate-left", x: 15, y: 15, width: 15 },
  { key: "boat1", src: "/assets/ban-do/thuyen-dang-cho-khach.png", className: "asset-boat-1", x: 6, y: 56, width: 8.5 },
  { key: "boat2", src: "/assets/ban-do/thuyen-cho-1-nguoi-canh-go-dat.png", className: "asset-boat-2", x: 12, y: 50, width: 7.5 },
  { key: "boat3", src: "/assets/ban-do/thuyen-lai-don.png", className: "asset-boat-3", x: 7, y: 44, width: 6.5 },

  // Route 2 assets (placed on the right to avoid overlapping Bai Dinh Pagoda)
  { key: "mountainBack", src: "/assets/ban-do/nui-2.png", className: "asset-mountain-back", x: 76, y: 64, width: 15 },
  { key: "mountainFront", src: "/assets/ban-do/nui.png", className: "asset-mountain-front", x: 89, y: 68, width: 15 },
];

const routePaths = [
  // ROUTE 1 (green)
  { id: "trang-an-tam-coc", d: "M50 10 C35 15 25 24 20 32", distance: "5 km", time: 12, x: 28, y: 20, tone: "green" },
  { id: "trang-an-hoa-lu", d: "M50 10 C65 15 75 24 80 32", distance: "12 km", time: 20, x: 72, y: 20, tone: "green" },
  { id: "tam-coc-pho-co", d: "M20 32 C25 40 35 48 50 48", distance: "6 km", time: 15, x: 28, y: 44, tone: "green" },
  { id: "hoa-lu-pho-co", d: "M80 32 C75 40 65 48 50 48", distance: "8 km", time: 20, x: 72, y: 44, tone: "green" },

  // ROUTE 2 connector (brown)
  { id: "pho-co-to-split", d: "M50 63 L50 72", distance: "", time: null, x: -100, y: -100, tone: "brown" },

  // Branches from the split point to Hang Mua and Bai Dinh Pagoda
  { id: "split-to-hang-mua", d: "M50 72 C40 76 30 80 25 86", distance: "5 km", time: 12, x: 33, y: 77, tone: "brown" },
  { id: "split-to-bai-dinh", d: "M50 72 C60 76 70 80 75 86", distance: "12 km", time: 20, x: 67, y: 77, tone: "brown" },
];

function MapNode({ node, visitedIds = [], visitedAriaLabel }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const station = stationById(node.id);
  const isVisited = visitedIds.includes(node.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "60px" } // Slight delay until the node nears the viewport
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
            {isVisited && (
              <span className="node-visited-badge" aria-label={visitedAriaLabel}>✓</span>
            )}
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

export default function JourneyMapSection({ visitedIds = [] }) {
  const { locale } = useI18n();
  const tj = (key) => translate(journeyDict, locale, key);
  const mapText = journeyDict[locale]?.map || journeyDict.vi.map;

  const routeNodes = nodeLayout.map((layout) => ({ ...layout, ...(mapText.nodes[layout.id] || {}) }));
  const routeGroups = groupLayout.map((layout) => ({ ...layout, label: mapText.groups[layout.key] }));
  const mapAssets = assetLayout.map((layout) => ({ ...layout, alt: mapText.assets[layout.key] }));

  // Find the node to place the tracking avatar
  const visitedNodesInOrder = routeNodes.filter(n => visitedIds.includes(n.id));
  const currentTrackingNode = visitedNodesInOrder.length > 0
    ? visitedNodesInOrder[visitedNodesInOrder.length - 1] // The last visited one!
    : routeNodes[0]; // If none visited, default to the first one (Trang An)

  return (
    <section className="journey-route-map-section" aria-label={tj("map.ariaLabel")}>
      <div className="journey-route-heading">
        <p>{tj("map.eyebrow")}</p>
        <h2>{tj("map.title")}</h2>
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
              key={group.key}
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
                <small>{path.time} {mapText.minutesSuffix}</small>
                <CarFront className="journey-route-car" aria-hidden="true" strokeWidth={2.4} />
              </span>
            );
          })}

          {routeNodes.map((node) => (
            <MapNode key={node.id} node={node} visitedIds={visitedIds} visitedAriaLabel={tj("map.visitedAria")} />
          ))}

          {currentTrackingNode && (
            <div
              className="nibi-tracking-avatar"
              style={{
                "--route-x": `${currentTrackingNode.x}%`,
                "--route-y": `${currentTrackingNode.y}%`,
              }}
            >
              <div className="nibi-tracking-tooltip font-baloo">{tj("map.trackingLabel")}</div>
              <div className="nibi-tracking-img-wrapper animate-bounce">
                <img
                  src="/ar/avt-nibi-no-bg.png"
                  alt="Nibi tracking"
                />
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="journey-route-footnote">
        <strong>{tj("map.footnoteLabel")}</strong>
        <span>{tj("map.footnoteText")}</span>
      </div>
    </section>
  );
}
