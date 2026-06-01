import { stations, steps } from "../../data/sac-co-do";
import JourneyMapSection from "./JourneyMapSection";
import SectionTitle from "./SectionTitle";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import StationCard from "./StationCard";

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
        <JourneyMapSection />
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
