import "./globals.css";

export const metadata = {
  title: "Sắc Cố Đô | Pop-up passport Ninh Bình",
  description:
    "Sổ pop-up passport kết hợp hành trình đóng dấu, check-in QR và photobooth tại 6 điểm văn hóa Ninh Bình.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
