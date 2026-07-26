"use client";

import { useMemo, useState } from "react";
import { translate, useI18n } from "./I18nProvider";
import journeyDict from "../../locales/journey.json";
import { localizeStation } from "./stationLocalization";

export default function StationCard({ station: rawStation, variant = "default" }) {
  const { locale } = useI18n();
  const tj = (key) => translate(journeyDict, locale, key);
  const station = localizeStation(rawStation, locale);
  const images = useMemo(() => {
    const gallery = station.gallery || [];
    return [station.image, ...gallery].filter((image, index, list) => image && list.indexOf(image) === index);
  }, [station.gallery, station.image]);
  const [activeImage, setActiveImage] = useState(images[0]);
  const previewImages = images.slice(0, 4);
  const detailHref = `/hanh-trinh/${station.slug || station.id}`;

  function openDetail() {
    window.location.href = detailHref;
  }

  return (
    <article
      className={`station-card station-card-clickable ${variant === "overlay" ? "station-card-overlay" : ""}`}
      role="link"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail();
        }
      }}
    >
      <div className="station-card-media">
        <img src={activeImage} alt={station.name} loading="lazy" decoding="async" />
      </div>
      <div className="station-card-body">
        <span className="pill">{station.tag}</span>
        <h3>{station.name}</h3>
        <p>{station.description}</p>
        {previewImages.length > 0 && (
          <div className="station-card-thumbs" aria-label={`${tj("stationCard.chooseImageAria")} ${station.name}`}>
            {previewImages.map((image) => (
              <button
                className={image === activeImage ? "is-active" : ""}
                key={image}
                type="button"
                aria-label={`${tj("stationCard.viewImageAria")} ${station.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveImage(image);
                }}
              >
                <img src={image} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
        <dl>
          <div>
            <dt>{tj("stationCard.hoursLabel")}</dt>
            <dd>{station.hours}</dd>
          </div>
          <div>
            <dt>{tj("stationCard.stampLabel")}</dt>
            <dd>{station.stamp}</dd>
          </div>
        </dl>
        <a className="station-checkin-link" href={detailHref} onClick={(event) => event.stopPropagation()}>
          {tj("stationCard.viewDetail")}
        </a>
      </div>
    </article>
  );
}
