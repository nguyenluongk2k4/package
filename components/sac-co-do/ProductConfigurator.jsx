"use client";

import { useEffect, useMemo, useState } from "react";
import { getProductBySlugOrId } from "../../lib/firebase/catalog";
import { loadCommerceSettings } from "../../lib/firebase/appSettings";
import ProductContactActions from "./ProductContactActions";
import { translate, useI18n } from "./I18nProvider";
import productDetailDict from "../../locales/product-detail.json";
import { localizeProduct } from "./productLocalization";

const fallbackImages = [
  { src: "/assets/anh-new/frame-1.png", label: "Khung nhận diện Sắc Cố Đô" },
  { src: "/assets/anh-new/cover photo.jpg", label: "Cover Sắc Cố Đô" },
  { src: "/assets/anh-new/AVT.jpg", label: "Biểu tượng Sắc Cố Đô" },
  { src: "/assets/anh-new/vvv.jpg", label: "Bảng màu và logo Sắc Cố Đô" },
];

const PRODUCT_OPTIONS = {
  passport: [{ label: "Cuốn Passport", label_en: "Passport booklet", price: 150000, priceFormatted: "150.000đ" }],
  "com-chay-dang-tui": [{ label: "Túi 216g", label_en: "216g pouch", price: 59000, priceFormatted: "59.000đ" }],
  "com-chay-ruoc-dam-vi": [{ label: "Túi 300g", label_en: "300g pouch", price: 65000, priceFormatted: "65.000đ" }],
  "com-chay-vuong-lut": [{ label: "Túi 200g", label_en: "200g pouch", price: 54000, priceFormatted: "54.000đ" }],
  "thit-chung-mam-tep-thanh-nguyen": [
    { label: "Hũ 275g", label_en: "275g jar", price: 175000, priceFormatted: "175.000đ" },
    { label: "Hũ 90g", label_en: "90g jar", price: 65000, priceFormatted: "65.000đ", compareAtPrice: 69000 },
  ],
  "ruoc-ca-ro-tong-truong": [{ label: "Hộp 100g", label_en: "100g box", price: 239000, priceFormatted: "239.000đ" }],
};

function formatVnd(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function getPricePresentation(product, option) {
  const price = Number(option?.price ?? product?.price ?? 0);
  const compareAtPrice = Number(option?.compareAtPrice ?? product?.compareAtPrice ?? 0);
  const hasDiscount = compareAtPrice > price;
  const discountPercent = hasDiscount ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

  return {
    price,
    compareAtPrice,
    hasDiscount,
    discountPercent,
    saleLabel: option?.saleLabel || product?.saleLabel || "",
    saleNote: option?.saleNote || product?.saleNote || "",
  };
}

function toProductOption(product, td) {
  if (!product) return null;

  return {
    ...product,
    id: product.id,
    shortName: product.shortName || product.name,
    subtitle: product.category || product.badge || product.weight || td("defaultSubtitle"),
    price: Number(product.price || 0),
    priceFormatted: product.priceFormatted || formatVnd(product.price),
  };
}

function getImages(product, td) {
  const images = product?.detailImages?.length ? product.detailImages : product?.images;
  return (images?.length ? images : [product?.image].filter(Boolean)).map((image, index) => {
    if (typeof image === "string") {
      return { src: image, label: `${product?.name || td("defaultName")} ${index + 1}` };
    }

    return {
      src: image?.src || image?.url || product?.image || fallbackImages[0].src,
      label: image?.label || image?.alt || `${product?.name || td("defaultName")} ${index + 1}`,
    };
  });
}

function isFallbackProductImage(src) {
  return typeof src === "string" && src.includes("/remove-bg/");
}

export default function ProductConfigurator({ productId }) {
  const { locale } = useI18n();
  const td = (key) => translate(productDetailDict, locale, key);
  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [activeImage, setActiveImage] = useState(fallbackImages[0]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [commerceSettings, setCommerceSettings] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      setLoadingProduct(true);
      const nextProduct = await getProductBySlugOrId(productId);
      if (!mounted) return;
      setProduct(nextProduct);
      setLoadingProduct(false);
    }

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [productId]);

  useEffect(() => {
    let mounted = true;

    loadCommerceSettings().then((settings) => {
      if (mounted) setCommerceSettings(settings);
    }).catch((error) => {
      console.warn("Load product contact settings failed:", error);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const selected = useMemo(() => localizeProduct(toProductOption(product, td), locale), [product, locale]);

  const optionsList = useMemo(() => {
    if (selected && Array.isArray(selected.variants) && selected.variants.length > 0) {
      return selected.variants;
    }
    const fallback = selected ? PRODUCT_OPTIONS[selected.id] || [] : [];
    return fallback.map((option) => (locale === "en" && option.label_en ? { ...option, label: option.label_en } : option));
  }, [selected, locale]);

  useEffect(() => {
    if (optionsList.length > 0) {
      setSelectedOption(optionsList[0]);
    } else {
      setSelectedOption(null);
    }
  }, [optionsList]);

  useEffect(() => {
    setActiveImage(getImages(selected, td)[0] || fallbackImages[0]);
  }, [selected]);

  const detailImages = useMemo(() => {
    const images = getImages(selected, td);
    return images.length ? images : fallbackImages;
  }, [selected]);

  const pricePresentation = useMemo(
    () => getPricePresentation(selected, selectedOption),
    [selected, selectedOption]
  );

  const activeImageModeClass = isFallbackProductImage(activeImage?.src) ? "is-contain" : "is-cover";

  const specificationFacts = useMemo(
    () =>
      [
        { label: td("netWeightLabel"), value: selectedOption ? selectedOption.label : selected?.weight },
        { label: td("ingredientsLabel"), value: selected?.ingredients },
      ].filter((item) => item.value),
    [selected, selectedOption, locale]
  );

  const usageFacts = useMemo(
    () =>
      [
        { label: td("usageLabel"), value: selected?.usage },
        { label: td("shelfLifeLabel"), value: selected?.shelfLife },
        { label: td("storageLabel"), value: selected?.storage },
        { label: td("noteLabel"), value: selected?.note },
      ].filter((item) => item.value),
    [selected, selectedOption, locale]
  );

  if (loadingProduct) {
    return (
      <section className="product-detail" aria-label={td("loadingAria")}>
        <div className="product-buy-panel">
          <h1>{td("loadingTitle")}</h1>
        </div>
      </section>
    );
  }

  if (!selected) {
    return (
      <section className="product-detail" aria-label={td("notFoundAria")}>
        <div className="product-buy-panel">
          <h1>{td("notFoundTitle")}</h1>
          <p>{td("notFoundDesc")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="product-detail" aria-label={td("detailAria")}>
      <div className="product-detail-top">
        <div className="product-gallery-panel">
        <div className={`product-main-image ${activeImageModeClass}`}>
          <img src={activeImage.src} alt={activeImage.label} loading="eager" decoding="async" />
        </div>

        <div className="product-thumbs" aria-label={td("thumbsAria")}>
          {detailImages.map((image) => (
            <button
              className={`${image.src === activeImage.src ? "active" : ""} ${isFallbackProductImage(image.src) ? "is-contain" : "is-cover"}`.trim()}
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
        <span className="product-kicker">{selected.category || td("defaultCategory")}</span>
        <h1>{selected.name || td("defaultName")}</h1>
        <div className="rating-row">
          <span aria-label={td("ratingAria")}>★★★★★</span>
          <small>{td("reviewCount")}</small>
        </div>

        <div className={`product-price-panel ${pricePresentation.hasDiscount ? "has-discount" : ""}`}>
          {pricePresentation.hasDiscount ? (
            <div className="product-sale-banner">
              <span>{pricePresentation.saleLabel || td("defaultSaleLabel")}</span>
              <strong>{td("discountPrefix")} {pricePresentation.discountPercent}%</strong>
            </div>
          ) : null}
          <div className="product-price-row">
            <div>
              <span className="product-price-label">{pricePresentation.hasDiscount ? td("salePriceLabel") : td("regularPriceLabel")}</span>
              <strong>{formatVnd(pricePresentation.price)}</strong>
            </div>
            {pricePresentation.hasDiscount ? (
              <div className="product-compare-price">
                <span>{td("listPriceLabel")}</span>
                <del>{formatVnd(pricePresentation.compareAtPrice)}</del>
              </div>
            ) : null}
          </div>
          {pricePresentation.hasDiscount && pricePresentation.saleNote ? (
            <p className="product-sale-note">{pricePresentation.saleNote}</p>
          ) : null}
        </div>

        {specificationFacts.length ? (
          <section className="product-specification-block" aria-labelledby="product-specification-heading">
            <span id="product-specification-heading" className="product-specification-heading">{td("specHeading")}</span>
            <dl className="product-specification-line">
              {specificationFacts.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {optionsList.length > 1 ? (
          <div style={{ marginTop: "16px", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", color: "#5d6768", fontWeight: "bold", display: "block", marginBottom: "8px" }}>{td("chooseVariantLabel")}</span>
            <div className="product-option-pills">
              {optionsList.map((option) => (
                <button
                  key={option.label}
                  className={`option-pill-btn ${selectedOption?.label === option.label ? "active" : ""}`}
                  type="button"
                  onClick={() => {
                    setSelectedOption(option);
                    const matchingThumb = detailImages.find((image) => image.src === option.image);
                    if (matchingThumb) {
                      setActiveImage(matchingThumb);
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <p>{selected.description || td("defaultDescription")}</p>

        <ProductContactActions
          product={selected}
          option={selectedOption}
          facebookUrl={commerceSettings?.facebookUrl}
          zaloUrl={commerceSettings?.zaloUrl}
        />

        </div>
      </div>

      {usageFacts.length ? (
        <section className="product-information-section" aria-labelledby="product-information-heading">
          <div className="product-information-heading">
            <span className="product-section-kicker">{td("usageKicker")}</span>
            <h2 id="product-information-heading">{td("usageHeading")}</h2>
          </div>
          <dl className="product-facts-list">
            {usageFacts.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {selected.story ? (
        <section className="product-story-section" aria-labelledby="product-story-heading">
          <div className="product-information-heading">
            <span className="product-section-kicker">{td("storyKicker")}</span>
            <h2 id="product-story-heading">{selected.storyTitle || td("defaultStoryTitle")}</h2>
          </div>
          <p>{selected.story}</p>
        </section>
      ) : null}
    </section>
  );
}
