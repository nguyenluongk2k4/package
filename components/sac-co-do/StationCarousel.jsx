"use client";

import { useMemo, useState } from "react";
import StationCard from "./StationCard";

export default function StationCarousel({ stations }) {
  const [index, setIndex] = useState(0);
  const total = stations.length;
  const visibleStations = useMemo(() => {
    return [0, 1, 2].map((offset) => stations[(index + offset) % total]);
  }, [index, stations, total]);

  function previous() {
    setIndex((value) => (value - 1 + total) % total);
  }

  function next() {
    setIndex((value) => (value + 1) % total);
  }

  return (
    <div className="station-carousel">
      <div className="carousel-actions" aria-label="Điều hướng trạm">
        <button type="button" onClick={previous}>
          Previous
        </button>
        <span>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <button type="button" onClick={next}>
          Next
        </button>
      </div>
      <div className="station-grid station-grid-overlay">
        {visibleStations.map((station) => (
          <StationCard key={station.id} station={station} variant="overlay" />
        ))}
      </div>
    </div>
  );
}
