import StaticPage from "../components/StaticPage";
import { getPage } from "../lib/static-pages";

export default function NotFound() {
  const page = getPage("error-404");

  return page ? <StaticPage html={page.html} /> : null;
}
