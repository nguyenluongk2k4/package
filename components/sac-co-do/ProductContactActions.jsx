"use client";

import { MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

const FACEBOOK_PAGE_URL = "https://www.facebook.com/saccodo.official";

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;

  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function buildContext(product, option, quantity = 1) {
  const parts = [product?.name, option?.label, quantity > 1 ? `Số lượng ${quantity}` : "Số lượng 1"].filter(Boolean);
  return parts.join(" · ");
}

export default function ProductContactActions({ product, option = null, quantity = 1, facebookUrl = "", zaloUrl = "", compact = false }) {
  const [open, setOpen] = useState(false);
  const [useMessenger, setUseMessenger] = useState(false);
  const context = buildContext(product, option, quantity);
  const resolvedFacebookUrl = facebookUrl ? (useMessenger ? facebookUrl : FACEBOOK_PAGE_URL) : "";
  const availableLinks = [resolvedFacebookUrl, zaloUrl].filter(Boolean);

  useEffect(() => {
    setUseMessenger(isMobileDevice());
  }, []);

  if (!availableLinks.length) {
    return <small className="product-contact-note">Kênh liên hệ đang được cập nhật.</small>;
  }

  if (!compact) {
    return (
      <div className="product-contact-actions is-direct" aria-label="Kênh liên hệ">
        {resolvedFacebookUrl ? (
          <a href={resolvedFacebookUrl} target="_blank" rel="noreferrer" className="product-contact-button facebook" aria-label={`Nhắn Facebook về ${context}`}>
            <img src="/assets/icons/ic-facebook.webp" alt="" aria-hidden="true" />
            <span>Liên hệ qua Facebook</span>
          </a>
        ) : null}
        {zaloUrl ? (
          <a href={zaloUrl} target="_blank" rel="noreferrer" className="product-contact-button zalo" aria-label={`Nhắn Zalo về ${context}`}>
            <img src="/assets/icons/ic-zalo.webp" alt="" aria-hidden="true" />
            <span>Liên hệ qua Zalo</span>
          </a>
        ) : null}
      </div>
    );
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
        {resolvedFacebookUrl ? (
          <a href={resolvedFacebookUrl} target="_blank" rel="noreferrer" className="product-contact-button facebook" onClick={(event) => event.stopPropagation()} aria-label={`Nhắn Facebook về ${context}`} title="Facebook">
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
