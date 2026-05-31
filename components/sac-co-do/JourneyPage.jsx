import { stations, steps } from "../../data/sac-co-do";
import SectionTitle from "./SectionTitle";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import StationCard from "./StationCard";

const mapMarkers = [
  { number: "1", name: "Bái Đính", x: 47, y: 15, checkX: 86.8, checkY: 20.4 },
  { number: "2", name: "Tràng An", x: 31, y: 36, checkX: 86.8, checkY: 31.2 },
  { number: "3", name: "Hang Múa", x: 63, y: 41, checkX: 86.8, checkY: 42.6 },
  { number: "4", name: "Tam Cốc", x: 51, y: 59, checkX: 86.8, checkY: 53.6 },
  { number: "5", name: "Tuyệt Tình Cốc", x: 33, y: 78, checkX: 86.8, checkY: 65.6 },
  { number: "6", name: "Thung Nham", x: 58, y: 77, checkX: 86.8, checkY: 76.7 },
];

export default function JourneyPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <SectionTitle
          eyebrow="Hành trình"
          title="Bản đồ 6 trạm văn hóa Ninh Bình"
          description="Mỗi trạm được thiết kế để người dùng có lý do dừng lại, quét QR và ghi dấu vào passport."
        />
        <div className="timeline">
          {steps.map((step) => (
            <article key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
        <section className="journey-map" aria-label="Bản đồ hành trình Sắc Cố Đô">
          <div className="journey-map-frame">
            <img src="/assets/dia-danh/ban-do.png" alt="Bản đồ các địa danh trong hành trình Sắc Cố Đô" loading="lazy" decoding="async" />
            {mapMarkers.map((marker, index) => (
              <span
                key={marker.number}
                className="journey-map-marker"
                style={{ "--marker-x": `${marker.x}%`, "--marker-y": `${marker.y}%`, "--marker-delay": `${720 + index * 140}ms` }}
                aria-label={`${marker.number}. ${marker.name}`}
              >
                <span className="map-flag" aria-hidden="true">
                  <span>{marker.number}</span>
                </span>
                <span className="map-flag-label">{marker.name}</span>
              </span>
            ))}
            {mapMarkers.map((marker, index) => (
              <label
                key={`check-${marker.number}`}
                className="journey-map-check"
                style={{ "--check-x": `${marker.checkX}%`, "--check-y": `${marker.checkY}%`, "--check-delay": `${1180 + index * 90}ms` }}
              >
                <input type="checkbox" aria-label={`Đánh dấu đã qua ${marker.name}`} />
                <span aria-hidden="true" />
              </label>
            ))}
          </div>
        </section>
        <div className="station-grid">
          {stations.map((station) => (
            <StationCard key={station.id} station={station} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
