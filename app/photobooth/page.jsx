import { Suspense } from "react";
import PhotoboothPage from "../../components/sac-co-do/PhotoboothPage";

export const metadata = {
  title: "Photobooth Di Sản Ninh Bình | Sắc Cố Đô",
  description:
    "Bật camera điện thoại hoặc tải ảnh lên để ghép khung hình văn hóa Sắc Cố Đô cho các trạm di sản bạn đã check-in.",
};

export default function PhotoboothRoute() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-emeraldblue">Đang tải Photobooth...</div>}>
      <PhotoboothPage />
    </Suspense>
  );
}
