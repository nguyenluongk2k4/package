"use client";

import { useMemo, useState } from "react";

export default function StationCard({ station, variant = "default" }) {
  const images = useMemo(() => {
    const gallery = station.gallery || [];
    return [station.image, ...gallery].filter((image, index, list) => image && list.indexOf(image) === index);
  }, [station.gallery, station.image]);
  const [activeImage, setActiveImage] = useState(images[0]);
  const previewImages = images.slice(0, 4);

  return (
    <article className={`station-card ${variant === "overlay" ? "station-card-overlay" : ""}`}>
      <div className="station-card-media">
        <img src={activeImage} alt={station.name} loading="lazy" decoding="async" />
      </div>
      <div className="station-card-body">
        <span className="pill">{station.tag}</span>
        <h3>{station.name}</h3>
        <p>{station.description}</p>
        {previewImages.length > 0 && (
          <div className="station-card-thumbs" aria-label={`Chọn ảnh ${station.name}`}>
            {previewImages.map((image) => (
              <button
                className={image === activeImage ? "is-active" : ""}
                key={image}
                type="button"
                aria-label={`Xem ảnh ${station.name}`}
                onClick={() => setActiveImage(image)}
              >
                <img src={image} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
        <dl>
          <div>
            <dt>Giờ mở</dt>
            <dd>{station.hours}</dd>
          </div>
          <div>
            <dt>Dấu mốc</dt>
            <dd>{station.stamp}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
