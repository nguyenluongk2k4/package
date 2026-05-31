export default function StationCard({ station, variant = "default" }) {
  return (
    <article className={`station-card ${variant === "overlay" ? "station-card-overlay" : ""}`}>
      <img src={station.image} alt={station.name} loading="lazy" decoding="async" />
      <div>
        <span className="pill">{station.tag}</span>
        <h3>{station.name}</h3>
        <p>{station.description}</p>
        <dl>
          <div>
            <dt>Giờ mở</dt>
            <dd>{station.hours}</dd>
          </div>
          <div>
            <dt>Dấu mộc</dt>
            <dd>{station.stamp}</dd>
          </div>
        </dl>
        <a className="station-checkin-link" href={`/checkin/${station.id}`}>
          Quét QR / mở AR
        </a>
      </div>
    </article>
  );
}
