import { notFound } from "next/navigation";
import JourneyDetailPage, { getStationById } from "../../../components/sac-co-do/JourneyDetailPage";
import { stations } from "../../../data/sac-co-do";

export function generateStaticParams() {
  return stations.map((station) => ({
    "dia-diem": station.id,
  }));
}

export async function generateMetadata({ params }) {
  const { "dia-diem": stationId } = await params;
  const station = getStationById(stationId);

  if (!station) {
    return {
      title: "Hành trình | Sắc Cố Đô",
    };
  }

  return {
    title: `${station.name} | Hành trình Sắc Cố Đô`,
    description: station.description,
  };
}

export default async function Page({ params }) {
  const { "dia-diem": stationId } = await params;
  const station = getStationById(stationId);

  if (!station) {
    notFound();
  }

  return <JourneyDetailPage station={station} />;
}
