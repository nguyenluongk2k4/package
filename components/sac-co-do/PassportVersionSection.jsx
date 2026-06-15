"use client";

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

        <div className="passport-option-list">
          {passportOptions.map((item) => (
            <article className="passport-option-card" key={item.number}>
              <div className="passport-option-number">{item.number}</div>
              <div className="passport-option-icon" aria-hidden="true">
                <img src={item.icon} alt="" loading="lazy" decoding="async" />
              </div>
              <div className="passport-option-copy">
                <span>{t(item.badgeKey)}</span>
                <h3>{t(item.titleKey)}</h3>
                <p>{t(item.descriptionKey)}</p>
              </div>
              <strong>{item.price}</strong>
            </article>
          ))}
        </div>

        <div className="passport-benefit-strip">
          {productBenefitKeys.map((benefitKey) => (
            <span key={benefitKey}>{t(benefitKey)}</span>
          ))}
        </div>
      </div>

      <div className="passport-version-visual" aria-label={t("home.passport.visualAria")}>
        <div className="passport-product-platform" aria-hidden="true" />
        <img
          className="passport-product-image"
          src="/assets/san-pham.png"
          alt={t("home.passport.visualAlt")}
          loading="eager"
          decoding="async"
        />
      </div>
    </section>
  );
}
