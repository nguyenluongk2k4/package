const fs = require("fs");
const path = require("path");

const htmlDir = path.join(__dirname, "src");

function listHtmlPages() {
  if (!fs.existsSync(htmlDir)) {
    return [];
  }

  return fs
    .readdirSync(htmlDir)
    .filter((file) => file.endsWith(".html"))
    .map((file) => file.replace(/\.html$/, ""));
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async redirects() {
    return listHtmlPages().map((slug) => ({
      source: `/${slug}.html`,
      destination: slug === "index" ? "/" : `/${slug}`,
      permanent: false,
    }));
  },
};

module.exports = nextConfig;
