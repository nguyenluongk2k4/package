"use client";

import { useState } from "react";
import Link from "next/link";
import TemplateFrame from "./TemplateFrame";
import { packages } from "../../data/sac-co-do";
import { addToCart, formatPrice } from "../../lib/db";

export default function ProductPage() {
  const [selectedPack, setSelectedPack] = useState(packages[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState("/assets/images/destinations/style1/pic1.jpg");
  const [showModal, setShowModal] = useState(false);

  const images = [
    "/assets/images/destinations/style1/pic1.jpg",
    "/assets/images/destinations/style1/pic2.jpg",
    "/assets/images/destinations/style1/pic3.jpg",
    "/assets/images/destinations/style1/pic4.jpg",
  ];

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = () => {
    addToCart(selectedPack, quantity);
    setShowModal(true);
  };

  const totalPrice = selectedPack.price * quantity;
  const totalPriceFormatted = formatPrice(totalPrice);

  return (
    <TemplateFrame>
      <InnerBanner />
      <section className="bg-white py-20 relative">
        <div className="container">
          <div className="grid grid-cols-12 gap-10">
            {/* Gallery Column */}
            <div className="lg:col-span-6 col-span-12">
              <div className="sticky top-28">
                <div className="rounded-3xl overflow-hidden border border-paleaqua mb-5 shadow-sm max-h-135 bg-paleaqua/20 flex items-center justify-center">
                  <img
                    src={activeImg}
                    alt="Sản phẩm chính"
                    className="w-full h-full object-cover max-h-135 duration-500 hover:scale-105"
                  />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(img)}
                      className={`rounded-xl overflow-hidden border-2 duration-300 ${
                        activeImg === img ? "border-citrusyellow shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-20 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Meta & Details Column */}
            <div className="lg:col-span-6 col-span-12 text-primary">
              <span className="text-secondary font-bold text-sm tracking-wider uppercase bg-secondary/10 px-3 py-1 rounded-full inline-block mb-3.75">
                Pop-up Passport
              </span>
              <h2 className="!font-display text-4xl font-bold leading-snug mb-2.5">
                Sổ tay Pop-up Sắc Cố Đô Ninh Bình
              </h2>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex text-citrusyellow text-base">
                  <i className="fa-solid fa-star" />
                  <i className="fa-solid fa-star" />
                  <i className="fa-solid fa-star" />
                  <i className="fa-solid fa-star" />
                  <i className="fa-solid fa-star" />
                </div>
                <span className="text-sm font-semibold text-primary/60">(48 đánh giá của người đi phượt)</span>
              </div>

              <p className="text-base text-primary/80 mb-7.5 leading-relaxed">
                Cuốn passport du lịch Ninh Bình độc nhất vô nhị. Thiết kế bìa cứng cao cấp dập chìm họa tiết, mở ra 6 trang sách nổi 3D (pop-up) tái dựng 6 thắng cảnh Ninh Bình tinh xảo. Mỗi cuốn sổ đi kèm một mã kích hoạt độc nhất in riêng giúp số hóa hành trình check-in qua QR code của bạn tại điểm đến thực tế.
              </p>

              {/* 3 Packages Selector */}
              <div className="mb-7.5">
                <h3 className="text-xl font-bold mb-3.75">Chọn gói sản phẩm:</h3>
                <div className="space-y-4">
                  {packages.map((pack) => {
                    const isActive = selectedPack.id === pack.id;
                    return (
                      <div
                        key={pack.id}
                        onClick={() => setSelectedPack(pack)}
                        className={`p-4 border-2 rounded-2xl cursor-pointer duration-300 flex items-center justify-between shadow-[0px_4px_15px_rgba(41,137,145,0.02)] ${
                          isActive
                            ? "border-primary bg-lightturquoise/30"
                            : "border-primary/10 bg-white hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`size-6 rounded-full border-2 flex items-center justify-center ${
                            isActive ? "border-primary bg-primary text-white" : "border-primary/20"
                          }`}>
                            {isActive && <i className="fa-solid fa-check text-2xs" />}
                          </span>
                          <div>
                            <span className="font-bold block text-lg">{pack.name}</span>
                            <span className="text-xs text-primary/60">
                              {pack.id === "combo" ? "2 cuốn sổ + 2 mã" : pack.id === "gift" ? "Đóng hộp quà tặng" : "1 cuốn sổ + 1 mã"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {pack.badge && (
                            <span className="bg-citrusyellow text-primary font-bold text-2xs px-2 py-0.5 rounded-full inline-block mb-1">
                              {pack.badge}
                            </span>
                          )}
                          <span className="text-xl font-black block">{pack.priceFormatted}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Selector & Realtime Price */}
              <div className="bg-paleaqua/20 p-5 rounded-2xl border border-paleaqua flex items-center justify-between flex-wrap gap-5 mb-8.75">
                <div>
                  <span className="text-xs font-semibold uppercase text-primary/60 block mb-1">Số lượng:</span>
                  <div className="flex items-center bg-white rounded-xl border border-primary/10 overflow-hidden size-fit">
                    <button
                      onClick={handleDecrement}
                      className="px-4 py-2 hover:bg-paleaqua/30 font-bold text-lg duration-300"
                    >
                      -
                    </button>
                    <span className="px-5 font-bold text-lg">{quantity}</span>
                    <button
                      onClick={handleIncrement}
                      className="px-4 py-2 hover:bg-paleaqua/30 font-bold text-lg duration-300"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold uppercase text-primary/60 block mb-1">Tổng cộng:</span>
                  <span className="text-3xl font-black text-secondary">{totalPriceFormatted}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleAddToCart}
                  className="site-button butn-bg-shape flex-1 max-sm:w-full !py-4 text-center justify-center font-bold flex items-center gap-2"
                >
                  <i className="fa-solid fa-shopping-cart" /> Thêm vào giỏ hàng
                </button>
                <Link
                  href="/gio-hang"
                  onClick={() => addToCart(selectedPack, quantity)}
                  className="sac-outline-button flex-1 max-sm:w-full py-4 text-center justify-center font-bold"
                >
                  Mua ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details Section (mượn từ tour-detail.html) */}
      <section className="bg-paleaqua/30 py-20 border-t border-paleaqua text-primary">
        <div className="container">
          <div className="max-w-200 mx-auto">
            <h3 className="text-2xl font-bold mb-5 border-b border-primary/10 pb-3">Chi tiết gói sản phẩm</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {selectedPack.features.map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-base">
                  <i className="fa-solid fa-circle-check text-citrusyellow text-lg" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <h3 className="text-2xl font-bold mb-5 border-b border-primary/10 pb-3">Thông số kỹ thuật</h3>
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr className="border-b border-primary/5">
                  <th className="py-3 font-semibold text-primary/70">Kích thước</th>
                  <td className="py-3 font-medium">Khổ A5 (148 x 210 mm) - Vừa vặn ba lô đi phượt</td>
                </tr>
                <tr className="border-b border-primary/5">
                  <th className="py-3 font-semibold text-primary/70">Chất liệu bìa</th>
                  <td className="py-3 font-medium">Bìa cứng ép kim dập nhám nghệ thuật, màu xanh ngọc bích cổ kính</td>
                </tr>
                <tr className="border-b border-primary/5">
                  <th className="py-3 font-semibold text-primary/70">Ruột pop-up</th>
                  <td className="py-3 font-medium">6 trang dựng hình nổi 3D lập thể chi tiết, giấy mỹ thuật 250gsm nhập khẩu</td>
                </tr>
                <tr className="border-b border-primary/5">
                  <th className="py-3 font-semibold text-primary/70">Ngôn ngữ</th>
                  <td className="py-3 font-medium">Song ngữ Việt - Anh (Bản dịch chuẩn văn hóa di sản)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Success Animated Modal */}
      {showModal && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]">
          <div className="bg-white rounded-3xl p-8 max-w-115 w-full text-center shadow-2xl relative animate-scale-up text-primary">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 text-primary/40 hover:text-primary transition-colors text-xl"
            >
              <i className="fa-solid fa-xmark" />
            </button>
            <div className="size-20 bg-lightturquoise/40 text-primary rounded-full flex items-center justify-center text-4xl mx-auto mb-5 animate-pulse">
              <i className="fa-solid fa-cart-arrow-down animate-bounce" />
            </div>
            <h4 className="text-2xl font-bold mb-2">Đã thêm vào giỏ hàng!</h4>
            <p className="text-primary/75 mb-6.25">
              Bạn vừa thêm <b>{quantity}x {selectedPack.name}</b> vào giỏ hàng của Sắc Cố Đô.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/gio-hang"
                className="site-button butn-bg-shape py-3 font-bold block text-center"
              >
                Đi đến Giỏ hàng
              </Link>
              <button
                onClick={() => setShowModal(false)}
                className="text-primary font-bold hover:underline"
              >
                Tiếp tục xem sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
    </TemplateFrame>
  );
}

function InnerBanner() {
  return (
    <div className="relative bg-cover bg-center w-full bg-white bg-[url(../images/background/inr-banner.jpg)] overflow-hidden sac-inner-banner">
      <div className="flex w-full lg:h-160 md:h-135 h-100 pb-10 items-baseline mx-auto">
        <div className="relative md:mt-60 mt-45 flex items-center justify-center w-full flex-col z-5">
          <div>
            <h1 className="lg:text-60 md:text-52 text-28 relative">Mua Sổ Sắc Cố Đô</h1>
          </div>
          <div>
            <ul className="inline-block">
              <li className="text-base pr-7.5 relative inline-block font-semibold text-primary after:content-['-'] after:absolute after:right-2 after:-top-1.5 after:text-primary after:text-26 after:font-normal">
                <Link href="/">Trang chủ</Link>
              </li>
              <li className="relative inline-block text-base font-semibold text-primary">Sản phẩm & Các gói mua</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="h-50 w-full absolute top-50 left-0 z-1">
        <div className="inline-block whitespace-nowrap animate-moveCloud">
          <img src="/assets/images/inr-banner-cloud.png" alt="" className="h-47.5" />
        </div>
      </div>
      <div className="absolute w-1/2 right-0 top-0 bottom-0 z-1">
        <div className="mt-60 animate-slide-right">
          <img src="/assets/images/airplane.png" alt="" className="animate-slide-top-fast" width="378" height="146" />
        </div>
      </div>
      <div className="absolute right-11.25 bottom-16.25 animate-slide-top2">
        <img src="/assets/images/hotballon-Left.png" alt="" className="md:w-21 w-10" width="84" height="121" />
      </div>
      <div className="absolute md:-right-15 -right-10 top-41.25 animate-slide-top">
        <img src="/assets/images/hotballon-right.png" alt="" className="md:w-37.5 w-20" width="230" height="333" />
      </div>
    </div>
  );
}
