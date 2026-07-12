"use client";

import { useEffect, useMemo, useState } from "react";
import { hardcodedProducts as fallbackProducts } from "../../data/products";
import { useI18n } from "./I18nProvider";

function productHref(product) {
  return product?.href || `/san-pham/${product?.slug || product?.id}`;
}

export default function PassportVersionSection({ className = "", products = [] }) {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const [rotation, setRotation] = useState(0);

  const displayProducts = useMemo(() => {
    return products.length ? products : fallbackProducts;
  }, [products]);

  const activeProduct = displayProducts[activeIndex] || displayProducts[0];
  const activeProductVisual = activeProduct?.homeImage || activeProduct?.image;
  const activeProductVisualStyle = {
    "--passport-rotation": `${rotation}deg`,
    "--passport-offset-x": activeProduct?.homeVisualOffsetX || "0px",
    "--passport-offset-y": activeProduct?.homeVisualOffsetY || "-34px",
  };

  useEffect(() => {
    if (activeIndex >= displayProducts.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, displayProducts.length]);

  function goToProduct(direction) {
    setActiveIndex((index) => (index + direction + displayProducts.length) % displayProducts.length);
    setRotation(0);
  }

  if (!activeProduct) {
    return null;
  }

  return (
    <section className={`passport-version-section ${className}`.trim()} id="san-pham-noi-bat">
      <div className="passport-version-inner">
        <div className="passport-version-copy">
          <p className="passport-version-eyebrow">Sản phẩm</p>
          <h2>
            Quà mang về
            <span>từ Cố Đô</span>
          </h2>
          <div className="passport-version-ribbon">{displayProducts.length} lựa chọn nổi bật</div>
          <div className="passport-active-card">
            {activeProduct.badge ? <span className="passport-active-badge">{activeProduct.badge}</span> : null}
            <strong className="passport-active-price">{activeProduct.priceFormatted}</strong>
            <h3>{activeProduct.name}</h3>
            <div className="passport-active-actions">
              <a className="passport-active-link" href={productHref(activeProduct)}>
                Xem chi tiết
                <img src="/assets/ic-next.svg" alt="" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="passport-version-visual" aria-label={t("home.passport.visualAria")}>
          <button className="passport-product-arrow previous" type="button" onClick={() => goToProduct(-1)} aria-label="Sản phẩm trước">
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
              src={activeProductVisual}
              alt={activeProduct.name}
              loading="eager"
              decoding="async"
              style={activeProductVisualStyle}
            />
          </div>

          <button className="passport-product-arrow next" type="button" onClick={() => goToProduct(1)} aria-label="Sản phẩm tiếp theo">
            <span aria-hidden="true">›</span>
          </button>

          <div className="passport-product-dots" aria-label="Chọn sản phẩm">
            {displayProducts.map((item, index) => (
              <button
                className={index === activeIndex ? "is-active" : ""}
                type="button"
                key={item.id}
                onClick={() => {
                  setActiveIndex(index);
                  setRotation(0);
                  setCartState("idle");
                }}
                aria-label={`Xem ${item.name}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
