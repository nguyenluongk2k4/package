"use client";

import { useState } from "react";
import { useI18n } from "./I18nProvider";

const passportOptions = [
  {
    number: "01",
    badgeKey: "home.passport.option1.badge",
    titleKey: "home.passport.option1.title",
    descriptionKey: "home.passport.option1.description",
    price: "150.000đ",
    icon: "/assets/passport_icon.svg",
  },
  {
    number: "02",
    badgeKey: "home.passport.option2.badge",
    titleKey: "home.passport.option2.title",
    descriptionKey: "home.passport.option2.description",
    price: "270.000đ",
    icon: "/assets/combo_passport_icon.svg",
  },
  {
    number: "03",
    badgeKey: "home.passport.option3.badge",
    titleKey: "home.passport.option3.title",
    descriptionKey: "home.passport.option3.description",
    price: "200.000đ",
    icon: "/assets/gift_box_icon.svg",
  },
];

const productBenefitKeys = [
  "home.passport.benefit1",
  "home.passport.benefit2",
  "home.passport.benefit3",
];

export default function PassportVersionSection({ className = "" }) {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const activeProduct = passportOptions[activeIndex] || passportOptions[0];

  function goToProduct(direction) {
    setActiveIndex((index) => (index + direction + passportOptions.length) % passportOptions.length);
    setRotation(0);
  }

  return (
    <section className={`passport-version-section ${className}`.trim()} id="san-pham-noi-bat">
      <div className="passport-version-copy">
        <p className="passport-version-eyebrow">{t("home.passport.eyebrow")}</p>
        <h2>
          {t("home.passport.titlePrefix")}{" "}
          <span>{t("home.passport.titleHighlight")}</span>
        </h2>
        <div className="passport-version-ribbon">{t("home.passport.ribbon")}</div>
        <p className="passport-version-lead">{t("home.passport.lead")}</p>

        <div className="passport-active-card">
          <span className="passport-active-badge">{t(activeProduct.badgeKey)}</span>
          <p className="passport-active-label">Giá</p>
          <strong className="passport-active-price">{activeProduct.price}</strong>
          <h3>{t(activeProduct.titleKey)}</h3>
          <p>{t(activeProduct.descriptionKey)}</p>
          <a className="passport-active-link" href="/san-pham">
            Xem chi tiết
            <img src="/assets/ic-next.svg" alt="" aria-hidden="true" />
          </a>
        </div>

        <div className="passport-option-tabs" aria-label="Chọn phiên bản passport">
          {passportOptions.map((item) => (
            <button
              className={item.number === activeProduct.number ? "is-active" : ""}
              type="button"
              key={item.number}
              onClick={() => {
                setActiveIndex(passportOptions.indexOf(item));
                setRotation(0);
              }}
            >
              <span>{item.number}</span>
              <strong>{t(item.titleKey)}</strong>
              <div aria-hidden="true">
                <img src={item.icon} alt="" loading="lazy" decoding="async" />
              </div>
            </button>
          ))}
        </div>

        <div className="passport-benefit-strip">
          {productBenefitKeys.map((benefitKey) => (
            <span key={benefitKey}>{t(benefitKey)}</span>
          ))}
        </div>
      </div>

      <div className="passport-version-visual" aria-label={t("home.passport.visualAria")}>
        <div className="passport-rotate-hint">
          <span>Hỗ trợ xoay do sản phẩm là 3D</span>
          <div>
            <button type="button" onClick={() => setRotation((value) => value - 32)} aria-label="Xoay sản phẩm sang trái">
              ↶
            </button>
            <button type="button" onClick={() => setRotation((value) => value + 32)} aria-label="Xoay sản phẩm sang phải">
              ↷
            </button>
          </div>
        </div>

        <button className="passport-product-arrow previous" type="button" onClick={() => goToProduct(-1)} aria-label="Phiên bản trước">
          <span aria-hidden="true">‹</span>
        </button>

        <div className="passport-product-stage">
          <img
            className="passport-product-platform"
            src="/assets/san-pham/buc-de-san-pham.png"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
          />
          <img
            className="passport-product-image"
            src="/assets/san-pham.png"
            alt={t("home.passport.visualAlt")}
            loading="eager"
            decoding="async"
            style={{ "--passport-rotation": `${rotation}deg` }}
          />
        </div>

        <button className="passport-product-arrow next" type="button" onClick={() => goToProduct(1)} aria-label="Phiên bản tiếp theo">
          <span aria-hidden="true">›</span>
        </button>

        <div className="passport-product-dots" aria-label="Chọn phiên bản">
          {passportOptions.map((item, index) => (
            <button
              className={index === activeIndex ? "is-active" : ""}
              type="button"
              key={item.number}
              onClick={() => {
                setActiveIndex(index);
                setRotation(0);
              }}
              aria-label={`Xem ${t(item.titleKey)}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
