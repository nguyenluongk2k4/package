"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPublicProducts } from "../../lib/firebase/catalog";
import { loadCommerceSettings } from "../../lib/firebase/appSettings";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import ProductContactActions from "./ProductContactActions";
import { translate, useI18n } from "./I18nProvider";
import productsDict from "../../locales/products.json";
import { localizeProduct } from "./productLocalization";
import { Eye } from "lucide-react";

function productHref(product) {
  return product?.href || `/san-pham/${product?.slug || product?.id}`;
}

function formatVnd(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function getProductOptions(product, locale) {
  if (!product) return [];
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants;
  }

  const label = (vi, en) => (locale === "en" ? en : vi);

  switch (product.id) {
    case "passport":
      return [{ label: label("Cuốn Passport", "Passport booklet"), price: 150000, priceFormatted: "150.000đ" }];
    case "com-chay-dang-tui":
      return [{ label: label("Túi 216g", "216g pouch"), price: 59000, priceFormatted: "59.000đ" }];
    case "com-chay-ruoc-dam-vi":
      return [{ label: label("Túi 300g", "300g pouch"), price: 65000, priceFormatted: "65.000đ" }];
    case "com-chay-vuong-lut":
      return [{ label: label("Túi 200g", "200g pouch"), price: 54000, priceFormatted: "54.000đ" }];
    case "thit-chung-mam-tep-thanh-nguyen":
      return [
        { label: label("Hũ 275g", "275g jar"), price: 175000, priceFormatted: "175.000đ" },
        { label: label("Hũ 90g", "90g jar"), price: 65000, priceFormatted: "65.000đ", compareAtPrice: 69000 },
      ];
    case "ruoc-ca-ro-tong-truong":
      return [{ label: label("Hộp 100g", "100g box"), price: 239000, priceFormatted: "239.000đ" }];
    default:
      return [
        {
          label: product.weight ? `${label("Túi", "Pack")} ${product.weight}` : label("Tiêu chuẩn", "Standard"),
          price: Number(product.price || 0),
          priceFormatted: product.priceFormatted,
          image: product.image,
        },
      ];
  }
}

export default function ProductPage() {
  const { db } = useFirebaseAuth();
  const router = useRouter();
  const { locale } = useI18n();
  const tp = (key) => translate(productsDict, locale, key);

  const [activeTab, setActiveTab] = useState("all");
  const [products, setProducts] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [commerceSettings, setCommerceSettings] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      const nextProducts = await getPublicProducts();
      if (!mounted) return;
      setProducts(nextProducts);
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    loadCommerceSettings(db).then((settings) => {
      if (mounted) setCommerceSettings(settings);
    }).catch((error) => {
      console.warn("Load product contact settings failed:", error);
    });

    return () => {
      mounted = false;
    };
  }, [db]);

  useEffect(() => {
    const initial = {};
    products.forEach((rawProduct) => {
      const product = localizeProduct(rawProduct, locale);
      const options = getProductOptions(product, locale);
      if (options.length > 0) {
        initial[product.id] = options[0];
      }
    });
    setSelectedOptions(initial);
  }, [products, locale]);

  const getFilteredProducts = useCallback(() => {
    if (activeTab === "all") return products;
    if (activeTab === "tourism") {
      return products.filter((product) => product.category === "Sản phẩm du lịch");
    }
    if (activeTab === "specialty") {
      return products.filter((product) => product.category === "Đặc sản Ninh Bình");
    }
    return products;
  }, [activeTab, products]);

  const filteredProducts = getFilteredProducts();
  const marqueeItems = products.flatMap((rawProduct) => {
    const product = localizeProduct(rawProduct, locale);
    const images = product.detailImages?.length
      ? product.detailImages
      : product.images?.length
        ? product.images
        : [product.image].filter(Boolean);

    return [...new Set(images)].map((image, imageIndex) => ({
      product,
      image,
      imageIndex,
    }));
  });

  function handleCardClick(product) {
    router.push(productHref(product));
  }

  return (
    <>
      <SiteHeader />
      <main className="product-list-page" style={{ position: "relative", minHeight: "100vh" }}>
        <section className="souvenir-products" aria-labelledby="souvenir-products-title">
          <div className="souvenir-products-heading">
            <p className="souvenir-products-kicker">{tp("kicker")}</p>
            <h1 id="souvenir-products-title">{tp("title")}</h1>
            <p>{tp("description")}</p>
          </div>

          <div className="heritage-category-tabs-container">
            <div className="heritage-category-tabs">
              <button className={`category-tab-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
                {tp("tabs.all")}
              </button>
              <button className={`category-tab-btn ${activeTab === "tourism" ? "active" : ""}`} onClick={() => setActiveTab("tourism")}>
                {tp("tabs.tourism")}
              </button>
              <button className={`category-tab-btn ${activeTab === "specialty" ? "active" : ""}`} onClick={() => setActiveTab("specialty")}>
                {tp("tabs.specialty")}
              </button>
            </div>
          </div>

          <div className="souvenir-products-grid" data-count={filteredProducts.length} style={{ marginTop: "40px" }}>
            {filteredProducts.map((rawProduct) => {
              const product = localizeProduct(rawProduct, locale);
              const optionsList = getProductOptions(product, locale);
              const currentOption = selectedOptions[product.id] || optionsList[0];
              const displayedImage =
                hoveredCard === product.id && product.images && product.images[1] ? product.images[1] : currentOption?.image || product.image;
              const currentPrice = Number(currentOption?.price ?? product.price ?? 0);
              const compareAtPrice = Number(
                currentOption?.compareAtPrice || (currentPrice === Number(product.price || 0) ? product.compareAtPrice : 0)
              );
              const hasDiscount = compareAtPrice > currentPrice;
              const discountPercent = hasDiscount ? Math.round(((compareAtPrice - currentPrice) / compareAtPrice) * 100) : 0;

              return (
                <div
                  className="souvenir-product-card"
                  key={product.id}
                  onMouseEnter={() => setHoveredCard(product.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => handleCardClick(product)}
                >
                  <div className={`souvenir-product-media ${product.image?.includes("/remove-bg/") ? "is-contain" : "is-cover"}`} style={{ cursor: "pointer" }}>
                    {product.badge ? <span className="souvenir-product-badge">{product.badge}</span> : null}

                    <img src={displayedImage} alt={product.name} loading="eager" decoding="async" style={{ transition: "all 0.5s ease" }} />

                    <div className="product-card-hover-panel">
                      <button
                        className="hover-action-btn quick-view"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push(productHref(product));
                        }}
                        aria-label={tp("quickViewAria")}
                      >
                        <Eye size={16} />
                        <span>{tp("quickViewLabel")}</span>
                      </button>
                      <ProductContactActions
                        product={product}
                        option={currentOption}
                        facebookUrl={commerceSettings?.facebookUrl}
                        zaloUrl={commerceSettings?.zaloUrl}
                        compact
                      />
                    </div>
                  </div>

                  <div className="souvenir-product-body" style={{ cursor: "pointer" }}>
                    {optionsList.length > 0 ? (
                      <div className="product-option-pills" onClick={(event) => event.stopPropagation()}>
                        {optionsList.map((option) => (
                          <button
                            key={option.label}
                            className={`option-pill-btn ${currentOption?.label === option.label ? "active" : ""}`}
                            onClick={() => {
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [product.id]: option,
                              }));
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <h2>{product.name}</h2>
                    <div className="souvenir-product-footer-info">
                      <span className="product-card-cat">{product.category}</span>
                      <div className="product-card-price-stack">
                        {hasDiscount ? (
                          <span className="product-card-sale-meta">
                            <b>-{discountPercent}%</b>
                            <del>{formatVnd(compareAtPrice)}</del>
                          </span>
                        ) : null}
                        <strong className="product-card-price">{formatVnd(currentPrice)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="souvenir-products-marquee-images" aria-hidden="true" style={{ marginTop: "60px", marginBottom: "40px" }}>
          <div className="souvenir-products-marquee-images-track">
            {[...marqueeItems, ...marqueeItems].map(({ product, image, imageIndex }, index) => (
              <a href={productHref(product)} className="marquee-image-item" key={`${product.id}-${imageIndex}-${index}`}>
                <div className="marquee-image-wrapper">
                  <img src={image} alt={product.name} loading="lazy" decoding="async" />
                </div>
                <div className="marquee-image-meta">
                  <span className="font-baloo">{product.shortName || product.name}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
