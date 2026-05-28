import { CheckinPage } from "../../../components/sac-co-do/UtilityPages";

export const metadata = {
  title: "Check-in | Sắc Cố Đô",
};

export default async function Page({ params }) {
  const { "tram-id": stationId } = await params;

  return <CheckinPage stationId={stationId} />;
}
