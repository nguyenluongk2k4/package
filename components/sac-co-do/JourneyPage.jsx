import { stations, steps } from "../../data/sac-co-do";
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
        <section className="journey-map" aria-label="Bản đồ hành trình Sắc Cố Đô">
          <div>
            <span className="pill">Bản đồ trải nghiệm</span>
            <h3>Đi qua 6 điểm, mở khóa đủ bộ dấu mộc</h3>
            <p>
              Bản đồ giúp người dùng hình dung hành trình trước khi đến từng trạm, quét QR và mở trải nghiệm AR tại địa điểm thật.
            </p>
          </div>
          <img src="/assets/dia-danh/ban-do.png" alt="Bản đồ các địa danh trong hành trình Sắc Cố Đô" loading="lazy" decoding="async" />
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
