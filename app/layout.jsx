import "./globals.css";
import ScrollReveal from "../components/sac-co-do/ScrollReveal";
import { FirebaseAuthProvider } from "../components/sac-co-do/FirebaseAuthProvider";
import { ToastProvider } from "../components/sac-co-do/ToastProvider";

export const metadata = {
  metadataBase: new URL("https://www.knguyen.shop"),
  title: "Sắc Cố Đô | Pop-up passport Ninh Bình",
  description:
    "Sổ pop-up passport kết hợp hành trình đóng dấu, check-in QR và photobooth tại 6 điểm văn hóa Ninh Bình.",
  icons: {
    icon: "/assets/anh-new/logo.png",
    shortcut: "/assets/anh-new/logo.png",
    apple: "/assets/anh-new/logo.png",
  },
  openGraph: {
    title: "Sắc Cố Đô",
    description:
      "Sổ pop-up passport kết hợp hành trình đóng dấu, check-in QR và photobooth tại 6 điểm văn hóa Ninh Bình.",
    images: ["/assets/anh-new/cover photo.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js" async></script>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <FirebaseAuthProvider>
          <ToastProvider>
            {children}
            <ScrollReveal />
          </ToastProvider>
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
