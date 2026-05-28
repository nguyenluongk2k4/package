"use client";

import { useMemo, useState } from "react";
import { packages } from "../../data/sac-co-do";

function formatVnd(value) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

export default function ProductConfigurator() {
  const [selectedId, setSelectedId] = useState(packages[0].id);
  const [quantity, setQuantity] = useState(1);
  const selected = packages.find((item) => item.id === selectedId) || packages[0];
  const total = useMemo(() => selected.price * quantity, [selected.price, quantity]);

  return (
    <section className="product-detail">
      <div className="product-gallery-panel">
        <div className="product-main-image">496x810</div>
        <div className="product-thumbs" aria-label="Ảnh sản phẩm">
          {[0, 1, 2, 3].map((item) => (
            <button className={item === 0 ? "active" : ""} type="button" key={item}>
              496x810
            </button>
          ))}
        </div>
      </div>

      <div className="product-buy-panel">
        <span className="product-kicker">Pop-up passport</span>
        <h1>Sổ tay Pop-up Sắc Cố Đô Ninh Bình</h1>
        <div className="rating-row">
          <span aria-label="5 sao">★★★★★</span>
          <small>(48 đánh giá của người đi phượt)</small>
        </div>
        <p>
          Cuốn passport du lịch Ninh Bình độc nhất vô nhị. Thiết kế bìa cứng cao cấp,
          đậm họa tiết, mở ra 6 trang sách nổi 3D tương ứng 6 thắng cảnh Ninh Bình
          tinh xảo. Mỗi cuốn sổ đi kèm một mã kích hoạt độc nhất in riêng giúp số hóa
          hành trình check-in qua QR code của bạn tại điểm đến thực tế.
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
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                -
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((value) => value + 1)}>
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
          <span aria-hidden="true">▾</span>
          Thêm vào giỏ hàng
        </button>
      </div>
    </section>
  );
}
