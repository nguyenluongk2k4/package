import StaticPage from "../components/StaticPage";
import { getPage, getPageMetadata } from "../lib/static-pages";

export function generateMetadata() {
  return getPageMetadata("index");
}

export default function HomePage() {
  const page = getPage("index");

  return <StaticPage html={page.html} />;
}
