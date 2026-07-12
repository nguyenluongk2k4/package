"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPublicProducts } from "../../lib/firebase/catalog";
import { loadCommerceSettings } from "../../lib/firebase/appSettings";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import ProductContactActions from "./ProductContactActions";
import { Eye } from "lucide-react";

function productHref(product) {
  return product?.href || `/san-pham/${product?.slug || product?.id}`;
}

function getProductOptions(product) {
  if (!product) return [];
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants;
  }

  switch (product.id) {
    case "passport":
      return [{ label: "Cuốn Passport", price: 150000, priceFormatted: "150.000đ" }];
    case "com-chay-dang-tui":
      return [{ label: "Túi 216g", price: 59000, priceFormatted: "59.000đ" }];
    case "com-chay-ruoc-dam-vi":
      return [{ label: "Túi 300g", price: 65000, priceFormatted: "65.000đ" }];
    case "com-chay-vuong-lut":
      return [{ label: "Túi 200g", price: 54000, priceFormatted: "54.000đ" }];
    case "thit-chung-mam-tep-thanh-nguyen":
      return [
        { label: "Hũ 275g", price: 175000, priceFormatted: "175.000đ" },
        { label: "Hũ 90g", price: 65000, priceFormatted: "65.000đ" },
      ];
    case "ruoc-ca-ro-tong-truong":
      return [{ label: "Hộp 100g", price: 239000, priceFormatted: "239.000đ" }];
    default:
      return [
        {
          label: product.weight ? `Túi ${product.weight}` : "Tiêu chuẩn",
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
    products.forEach((product) => {
      const options = getProductOptions(product);
      if (options.length > 0) {
        initial[product.id] = options[0];
      }
    });
    setSelectedOptions(initial);
  }, [products]);

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

  function handleCardClick(product) {
    router.push(productHref(product));
  }

  return (
    <>
      <SiteHeader />
      <main className="product-list-page" style={{ position: "relative", minHeight: "100vh" }}>
        <section className="souvenir-products" aria-labelledby="souvenir-products-title">
          <div className="souvenir-products-heading">
            <p className="souvenir-products-kicker">Sản phẩm</p>
            <h1 id="souvenir-products-title">Sắc Cố Đô</h1>
            <p>Khám phá bộ sưu tập quà tặng văn hóa độc quyền và ẩm thực nổi tiếng mang trọn tinh hoa vùng đất Cố Đô Ninh Bình.</p>
          </div>

          <div className="heritage-category-tabs-container">
            <div className="heritage-category-tabs">
              <button className={`category-tab-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
                Tất cả sản phẩm
              </button>
              <button className={`category-tab-btn ${activeTab === "tourism" ? "active" : ""}`} onClick={() => setActiveTab("tourism")}>
                Hành lý du lịch
              </button>
              <button className={`category-tab-btn ${activeTab === "specialty" ? "active" : ""}`} onClick={() => setActiveTab("specialty")}>
                Đặc sản Ninh Bình
              </button>
            </div>
          </div>

          <div className="souvenir-products-grid" data-count={filteredProducts.length} style={{ marginTop: "40px" }}>
            {filteredProducts.map((product) => {
              const optionsList = getProductOptions(product);
              const currentOption = selectedOptions[product.id] || optionsList[0];
              const displayedImage =
                hoveredCard === product.id && product.images && product.images[1] ? product.images[1] : currentOption?.image || product.image;

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
                        aria-label="Xem chi tiết"
                      >
                        <Eye size={16} />
                        <span>Chi tiết</span>
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
                      <strong className="product-card-price">{currentOption ? currentOption.priceFormatted : product.priceFormatted}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="souvenir-products-marquee-images" aria-hidden="true" style={{ marginTop: "60px", marginBottom: "40px" }}>
          <div className="souvenir-products-marquee-images-track">
            {[...products, ...products].map((product, index) => (
              <a href={productHref(product)} className="marquee-image-item" key={`${product.id}-${index}`}>
                <div className="marquee-image-wrapper">
                  <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
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
