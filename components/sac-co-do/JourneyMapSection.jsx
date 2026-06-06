const mapMarkers = [
  { number: "1", name: "Bai Dinh", id: "bai-dinh", x: 47, y: 15, checkX: 86.8, checkY: 20.4, mobileX: 61, mobileY: 45 },
  { number: "2", name: "Trang An", id: "trang-an", x: 31, y: 36, checkX: 86.8, checkY: 31.2, mobileX: 30, mobileY: 43 },
  { number: "3", name: "Hang Mua", id: "hang-mua", x: 63, y: 41, checkX: 86.8, checkY: 42.6, mobileX: 24, mobileY: 72 },
  { number: "4", name: "Tam Coc", id: "tam-coc", x: 51, y: 59, checkX: 86.8, checkY: 53.6, mobileX: 45, mobileY: 56 },
  { number: "5", name: "Hoa Lu", id: "hoa-lu", x: 33, y: 78, checkX: 86.8, checkY: 65.6, mobileX: 55, mobileY: 82 },
  { number: "6", name: "Pho Co Hoa Lu", id: "pho-co-hoa-lu", x: 58, y: 77, checkX: 86.8, checkY: 76.7, mobileX: 54, mobileY: 29 },
];

export default function JourneyMapSection() {
  return (
    <section className="journey-map-section" aria-label="Ban do hanh trinh Sac Co Do">
      <div className="journey-travel-desk">
        <div className="journey-map-frame">
          <picture>
            <source media="(max-width: 760px)" srcSet="/assets/dia-danh/ban-do-mobile.png" />
            <img src="/assets/dia-danh/ban-do.png" alt="Ban do cac dia danh trong hanh trinh Sac Co Do" loading="lazy" decoding="async" />
          </picture>
          {mapMarkers.map((marker, index) => (
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
              }}
              aria-label={`${marker.number}. ${marker.name}`}
            >
              <span className="map-flag" aria-hidden="true">
                <span>{marker.number}</span>
              </span>
              <span className="map-flag-label">{marker.name}</span>
            </a>
          ))}
          {mapMarkers.map((marker, index) => (
            <label
              key={`check-${marker.number}`}
              className="journey-map-check"
              style={{ "--check-x": `${marker.checkX}%`, "--check-y": `${marker.checkY}%`, "--check-delay": `${420 + index * 70}ms` }}
            >
              <input type="checkbox" aria-label={`Danh dau da qua ${marker.name}`} />
              <span aria-hidden="true" />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
