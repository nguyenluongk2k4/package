"use client";

import { useMemo, useState } from "react";
import { packages } from "../../data/sac-co-do";

const productImages = [
  { src: "/assets/anh-new/frame-1.png", label: "Khung nhận diện Sắc Cố Đô" },
  { src: "/assets/anh-new/cover photo.jpg", label: "Cover Sắc Cố Đô" },
  { src: "/assets/anh-new/AVT.jpg", label: "Biểu tượng Sắc Cố Đô" },
  { src: "/assets/anh-new/vvv.jpg", label: "Bảng màu và logo Sắc Cố Đô" },
];

function formatVnd(value) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

export default function ProductConfigurator() {
  const [selectedId, setSelectedId] = useState(packages[0].id);
  const [activeImage, setActiveImage] = useState(productImages[0]);
  const [quantity, setQuantity] = useState(1);
  const selected = packages.find((item) => item.id === selectedId) || packages[0];
  const total = useMemo(() => selected.price * quantity, [selected.price, quantity]);

  return (
    <section className="product-detail" aria-label="Chi tiết sản phẩm Sắc Cố Đô">
      <div className="product-gallery-panel">
        <div className="product-main-image">
          <img src={activeImage.src} alt={activeImage.label} loading="eager" decoding="async" />
        </div>
        <div className="product-thumbs" aria-label="Ảnh sản phẩm">
          {productImages.map((image) => (
            <button
              className={image.src === activeImage.src ? "active" : ""}
              type="button"
              key={image.src}
              onClick={() => setActiveImage(image)}
              aria-label={image.label}
            >
              <img src={image.src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      </div>

      <div className="product-buy-panel">
        <span className="product-kicker">Sản phẩm du lịch</span>
        <h1>Sổ tay Pop-up Sắc Cố Đô Ninh Bình</h1>
        <div className="rating-row">
          <span aria-label="5 sao">★★★★★</span>
          <small>(48 đánh giá của người đi phượt)</small>
        </div>
        <p>
          Cuốn sổ tay du lịch Ninh Bình độc nhất vô nhị. Thiết kế bìa cứng cao cấp, đậm họa tiết,
          mở ra 6 trang sách nổi 3D tương ứng 6 thắng cảnh Ninh Bình tinh xảo. Mỗi cuốn sổ đi kèm
          mã dịch vụ riêng để kích hoạt các tiện ích hành trình sau khi mua sản phẩm.
        </p>

        <div className="option-group">
          <p>Chọn gói sản phẩm:</p>
          {packages.map((item) => {
            const active = item.id === selectedId;
            return (
              <button
                className={`product-option ${active ? "active" : ""}`}
                type="button"
                key={item.id}
                onClick={() => setSelectedId(item.id)}
              >
                <span className="option-radio" aria-hidden="true" />
                <span className="option-copy">
                  <strong>{item.shortName || item.name}</strong>
                  <small>{item.subtitle}</small>
                </span>
                {item.badge ? <em>{item.badge}</em> : null}
                <b>{item.priceFormatted}</b>
              </button>
            );
          })}
        </div>

        <div className="purchase-box">
          <div>
            <small>Số lượng:</small>
            <div className="quantity-control">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Giảm số lượng">
                -
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Tăng số lượng">
                +
              </button>
            </div>
          </div>
          <div className="total-box">
            <small>Tổng cộng:</small>
            <strong>{formatVnd(total)}</strong>
          </div>
        </div>

        <button className="add-cart-button" type="button">
          <span className="cart-glyph" aria-hidden="true" />
          Thêm vào giỏ hàng
        </button>
      </div>
    </section>
  );
}
