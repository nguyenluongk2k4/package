export default function StaticPage({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
