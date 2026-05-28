/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: false },
      { source: "/index-4.html", destination: "/", permanent: false },
      { source: "/shop.html", destination: "/san-pham", permanent: false },
      { source: "/product-details.html", destination: "/san-pham", permanent: false },
      { source: "/tour.html", destination: "/hanh-trinh", permanent: false },
      { source: "/tour-details.html", destination: "/hanh-trinh", permanent: false },
      { source: "/destination.html", destination: "/hanh-trinh", permanent: false },
      { source: "/destination-details.html", destination: "/hanh-trinh", permanent: false },
      { source: "/events.html", destination: "/hanh-trinh", permanent: false },
      { source: "/gallery.html", destination: "/photobooth", permanent: false },
      { source: "/about.html", destination: "/ve-chung-toi", permanent: false },
      { source: "/contact.html", destination: "/ve-chung-toi", permanent: false },
    ];
  },
};

module.exports = nextConfig;
