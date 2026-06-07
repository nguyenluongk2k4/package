import JourneyDetailPage from "../../../components/sac-co-do/JourneyDetailPage";
import { stations } from "../../../data/sac-co-do";

export function generateStaticParams() {
  return stations.map((station) => ({
    "dia-diem": station.id,
  }));
}

export async function generateMetadata({ params }) {
  const { "dia-diem": stationId } = await params;
  const station = stations.find((item) => item.id === stationId || item.slug === stationId);

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
  const station = stations.find((item) => item.id === stationId || item.slug === stationId) || stations[0];

  return <JourneyDetailPage station={station} stationId={stationId} />;
}
