import fs from "node:fs";
import path from "node:path";

const pagesDir = path.join(process.cwd(), "src");

export const pageSlugs = fs
  .readdirSync(pagesDir)
  .filter((file) => file.endsWith(".html"))
  .map((file) => file.replace(/\.html$/, ""))
  .sort();

function readHtml(slug) {
  if (!pageSlugs.includes(slug)) {
    return null;
  }

  return fs.readFileSync(path.join(pagesDir, `${slug}.html`), "utf8");
}

function extractBody(html) {
  const match = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const body = match ? match[1] : html;

  return body.replace(/<script\b[\s\S]*?<\/script>/gi, "");
}

function extractTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);

  return match ? stripTags(match[1]).trim() : undefined;
}

function extractMetaContent(html, name) {
  const pattern = new RegExp(
    `<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["'][^>]*>`,
    "i",
  );
  const match = html.match(pattern);

  return match ? match[1] : undefined;
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, "");
}

function routeForHtmlFile(fileName) {
  const slug = fileName.replace(/\.html$/i, "");

  return slug === "index" ? "/" : `/${slug}`;
}

function normalizeLinksAndAssets(html) {
  return html
    .replace(
      /(href|src|poster|data-src|data-thumb|data-background|data-background-image)=(["'])assets\//gi,
      "$1=$2/assets/",
    )
    .replace(/url\((["']?)assets\//gi, "url($1/assets/")
    .replace(
      /href=(["'])(?!https?:|mailto:|tel:|javascript:|#|\/)(?:\.\/)?([^"']+?\.html)(#[^"']*)?\1/gi,
      (_match, quote, fileName, hash = "") =>
        `href=${quote}${routeForHtmlFile(fileName)}${hash}${quote}`,
    );
}

export function getPage(slug = "index") {
  const html = readHtml(slug);

  if (!html) {
    return null;
  }

  return {
    html: normalizeLinksAndAssets(extractBody(html)),
  };
}

export function getPageMetadata(slug = "index") {
  const html = readHtml(slug);

  if (!html) {
    return {};
  }

  return {
    title: extractTitle(html),
    description: extractMetaContent(html, "description"),
  };
}
