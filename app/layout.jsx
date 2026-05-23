import "./globals.css";
import LegacyScripts from "../components/LegacyScripts";

export const metadata = {
  title: "Travlla - Travel & Tour Tailwind CSS Template",
  description:
    "Travlla is a responsive Travel & Tour Tailwind CSS template designed for travel agencies, tour operators, holiday planners, and booking websites.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <link rel="icon" type="image/png" href="/assets/images/favicon.png" />
        <link
          rel="stylesheet"
          type="text/css"
          href="/assets/icons/line-awesome/css/line-awesome.min.css"
        />
        <link
          rel="stylesheet"
          type="text/css"
          href="/assets/icons/flaticon/flaticon.css"
        />
        <link
          rel="stylesheet"
          type="text/css"
          href="/assets/icons/fontawesome/css/all.min.css"
        />
        <link
          rel="stylesheet"
          type="text/css"
          href="/assets/icons/themify-icons/css/themify-icons.css"
        />
        <link
          rel="stylesheet"
          type="text/css"
          href="/assets/icons/feather/css/feather.css"
        />
        <link rel="stylesheet" href="/assets/vendor/swiper/swiper-bundle.min.css" />
        <link rel="stylesheet" href="/assets/vendor/flatpickr/css/flatpicker.css" />
        <link rel="stylesheet" href="/assets/css/lc_lightbox.css" />
        <link rel="stylesheet" href="/assets/vendor/magnific-popup/magnific-popup.css" />
        <link rel="stylesheet" href="/assets/vendor/nouislider/nouislider.min.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Afacad:ital,wght@0,400..700;1,400..700&family=Figtree:ital,wght@0,300..900;1,300..900&family=Kaushan+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body id="bg" className="selection:bg-[#484848] selection:text-white">
        {children}
        <LegacyScripts />
      </body>
    </html>
  );
}
