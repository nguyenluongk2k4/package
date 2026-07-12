"use client";

import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

function buildContext(product, option, quantity = 1) {
  const parts = [product?.name, option?.label, quantity > 1 ? `Số lượng ${quantity}` : "Số lượng 1"].filter(Boolean);
  return parts.join(" · ");
}

export default function ProductContactActions({ product, option = null, quantity = 1, facebookUrl = "", zaloUrl = "", compact = false }) {
  const [open, setOpen] = useState(false);
  const context = buildContext(product, option, quantity);
  const availableLinks = [facebookUrl, zaloUrl].filter(Boolean);

  if (!availableLinks.length) {
    return <small className="product-contact-note">Kênh liên hệ đang được cập nhật.</small>;
  }

  return (
    <div className={`product-contact-actions ${compact ? "is-compact" : ""} ${open ? "is-open" : ""}`.trim()}>
      <button
        type="button"
        className="product-contact-toggle"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-label={open ? "Đóng lựa chọn liên hệ" : `Liên hệ đặt hàng ${context}`}
        aria-expanded={open}
        title="Liên hệ đặt hàng"
      >
        {open ? <X size={18} aria-hidden="true" /> : <MessageCircle size={18} aria-hidden="true" />}
        {!compact ? <span>Liên hệ</span> : null}
      </button>
      <div className="product-contact-links" aria-label="Kênh liên hệ">
        {facebookUrl ? (
          <a href={facebookUrl} target="_blank" rel="noreferrer" className="product-contact-button facebook" onClick={(event) => event.stopPropagation()} aria-label={`Nhắn Facebook về ${context}`} title="Facebook">
            <img src="/assets/icons/ic-facebook.webp" alt="" aria-hidden="true" />
            <span>Liên hệ qua Facebook</span>
          </a>
        ) : null}
        {zaloUrl ? (
          <a href={zaloUrl} target="_blank" rel="noreferrer" className="product-contact-button zalo" onClick={(event) => event.stopPropagation()} aria-label={`Nhắn Zalo về ${context}`} title="Zalo">
            <img src="/assets/icons/ic-zalo.webp" alt="" aria-hidden="true" />
            <span>Liên hệ qua Zalo</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}
