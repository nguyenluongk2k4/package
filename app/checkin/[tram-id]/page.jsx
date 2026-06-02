import CheckinExperiencePage from "../../../components/sac-co-do/CheckinExperiencePage";
import { stations } from "../../../data/sac-co-do";

export const metadata = {
  title: "AR Check-in | Sắc Cố Đô",
};

export function generateStaticParams() {
  return stations.map((station) => ({ "tram-id": station.id }));
}

export default async function Page({ params }) {
  const { "tram-id": stationId } = await params;

  return <CheckinExperiencePage stationId={stationId} />;
}
