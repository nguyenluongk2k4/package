import { notFound } from "next/navigation";
import HeritageDestinationPage from "../../../components/sac-co-do/HeritageDestinationPage";
import { getHeritageDestination, heritageDestinations } from "../../../components/sac-co-do/heritageDestinations";

export function generateStaticParams() {
  return heritageDestinations.map((destination) => ({
    slug: destination.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const destination = getHeritageDestination(slug);

  if (!destination) {
    return {
      title: "Địa danh | Sắc Cố Đô",
    };
  }

  return {
    title: `${destination.name} | Sắc Cố Đô`,
    description: destination.subtitle,
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const destination = getHeritageDestination(slug);

  if (!destination) {
    notFound();
  }

  return <HeritageDestinationPage destination={destination} />;
}
