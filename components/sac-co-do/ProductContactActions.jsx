"use client";

import { MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { translate, useI18n } from "./I18nProvider";
import productDetailDict from "../../locales/product-detail.json";

const FACEBOOK_PAGE_URL = "https://www.facebook.com/saccodo.official";

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;

  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function buildContext(product, option, quantity = 1, quantityPrefix = "Số lượng") {
  const parts = [product?.name, option?.label, `${quantityPrefix} ${quantity > 1 ? quantity : 1}`].filter(Boolean);
  return parts.join(" · ");
}

export default function ProductContactActions({ product, option = null, quantity = 1, facebookUrl = "", zaloUrl = "", compact = false }) {
  const [open, setOpen] = useState(false);
  const [useMessenger, setUseMessenger] = useState(false);
  const { locale } = useI18n();
  const td = (key) => translate(productDetailDict, locale, key);
  const context = buildContext(product, option, quantity, td("contact.quantityPrefix"));
  const resolvedFacebookUrl = facebookUrl ? (useMessenger ? facebookUrl : FACEBOOK_PAGE_URL) : "";
  const availableLinks = [resolvedFacebookUrl, zaloUrl].filter(Boolean);

  useEffect(() => {
    setUseMessenger(isMobileDevice());
  }, []);

  if (!availableLinks.length) {
    return <small className="product-contact-note">{td("contact.unavailable")}</small>;
  }

  if (!compact) {
    return (
      <div className="product-contact-actions is-direct" aria-label={td("contact.channelsAria")}>
        {resolvedFacebookUrl ? (
          <a href={resolvedFacebookUrl} target="_blank" rel="noreferrer" className="product-contact-button facebook" aria-label={`${td("contact.facebookAriaPrefix")} ${context}`}>
            <img src="/assets/icons/ic-facebook.webp" alt="" aria-hidden="true" />
            <span>{td("contact.facebookMessage")}</span>
          </a>
        ) : null}
        {zaloUrl ? (
          <a href={zaloUrl} target="_blank" rel="noreferrer" className="product-contact-button zalo" aria-label={`${td("contact.zaloAriaPrefix")} ${context}`}>
            <img src="/assets/icons/ic-zalo.webp" alt="" aria-hidden="true" />
            <span>{td("contact.zaloMessage")}</span>
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
        aria-label={open ? td("contact.toggleClose") : `${td("contact.toggleOpenPrefix")} ${context}`}
        aria-expanded={open}
        title={td("contact.toggleTitle")}
      >
        {open ? <X size={18} aria-hidden="true" /> : <MessageCircle size={18} aria-hidden="true" />}
        {!compact ? <span>{td("contact.toggleLabel")}</span> : null}
      </button>
      <div className="product-contact-links" aria-label={td("contact.channelsAria")}>
        {resolvedFacebookUrl ? (
          <a href={resolvedFacebookUrl} target="_blank" rel="noreferrer" className="product-contact-button facebook" onClick={(event) => event.stopPropagation()} aria-label={`${td("contact.facebookAriaPrefix")} ${context}`} title="Facebook">
            <img src="/assets/icons/ic-facebook.webp" alt="" aria-hidden="true" />
            <span>{td("contact.facebookMessage")}</span>
          </a>
        ) : null}
        {zaloUrl ? (
          <a href={zaloUrl} target="_blank" rel="noreferrer" className="product-contact-button zalo" onClick={(event) => event.stopPropagation()} aria-label={`${td("contact.zaloAriaPrefix")} ${context}`} title="Zalo">
            <img src="/assets/icons/ic-zalo.webp" alt="" aria-hidden="true" />
            <span>{td("contact.zaloMessage")}</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}
