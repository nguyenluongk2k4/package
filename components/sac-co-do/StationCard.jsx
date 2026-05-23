import Link from "next/link";

export default function StationCard({ station, compact = false }) {
  return (
    <div className={compact ? "" : "xl:col-span-3 lg:col-span-4 md:col-span-6 col-span-12 mb-7.5"} id={station.id}>
      <div className="relative z-1 group sac-station-card">
        <div className="rounded-3xl overflow-hidden">
          <Link href={`/hanh-trinh#${station.id}`}>
            <div className={`sac-station-illustration sac-station-${station.id} w-full h-125`}>
              <span>{station.tag}</span>
              <strong>{station.name}</strong>
              <em>{station.hours}</em>
            </div>
          </Link>
        </div>
        <div>
          <h3 className="text-28">
            <Link
              href={`/hanh-trinh#${station.id}`}
              className="block text-primary bg-white text-center p-5 rounded-3xl absolute left-0 right-0 -bottom-px duration-500 group-hover:text-white group-hover:bg-primary"
            >
              {station.name}
            </Link>
          </h3>
        </div>
        <div className="absolute -z-1 top-0 left-1/2 -translate-x-1/2 duration-500 group-hover:-top-7.5">
          <img
            src="/assets/images/destinations/hotballon-right.png"
            alt=""
            className="w-full max-w-75 mx-auto block duration-500"
            width="150"
            height="226"
            loading="lazy"
          />
        </div>
        <div className="sac-station-meta">
          <span>{station.tag}</span>
          <small>{station.hours}</small>
        </div>
      </div>
    </div>
  );
}
