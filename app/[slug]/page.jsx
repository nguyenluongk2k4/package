import { notFound } from "next/navigation";
import StaticPage from "../../components/StaticPage";
import { getPage, getPageMetadata, pageSlugs } from "../../lib/static-pages";

export function generateStaticParams() {
  return pageSlugs
    .filter((slug) => slug !== "index")
    .map((slug) => ({
      slug,
    }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  return getPageMetadata(slug);
}

export default async function HtmlPage({ params }) {
  const { slug } = await params;
  const page = getPage(slug);

  if (!page) {
    notFound();
  }

  return <StaticPage html={page.html} />;
}
