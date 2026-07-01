"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { hardcodedProducts } from "../../data/products";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useToast } from "./ToastProvider";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { Eye, ShoppingBag } from "lucide-react";

// Product options mapping with descriptive packaging tags
function getProductOptions(product) {
  if (!product) return [];
  
  switch (product.id) {
    case "passport":
      return [
        { label: "Cuốn Passport", price: 150000, priceFormatted: "150.000đ", image: "/assets/san-pham/remove-bg/passport.png" }
      ];
    case "com-chay-dang-tui":
      return [
        { label: "Túi 216g", price: 59000, priceFormatted: "59.000đ", image: "/assets/san-pham/Cơm cháy cố đô dạng túi 180g - 59k_goi.png" },
        { label: "Combo 3 túi", price: 165000, priceFormatted: "165.000đ", image: "/assets/san-pham/Cơm cháy nhí/cm cháy nhí.png" }
      ];
    case "com-chay-ruoc-dam-vi":
      return [
        { label: "Túi 300g", price: 65000, priceFormatted: "65.000đ", image: "/assets/san-pham/Cơm cháy cố đô ruốc đậm vị 300g 65k_goi.png" },
        { label: "Túi 180g", price: 45000, priceFormatted: "45.000đ", image: "/assets/san-pham/Cơm cháy đậm vị/cm cháy đậm vị ruốc1.png" }
      ];
    case "com-chay-vuong-lut":
      return [
        { label: "Túi 200g", price: 54000, priceFormatted: "54.000đ", image: "/assets/san-pham/Cơm cháy cố đô vuông lứt 210g 54k_ goi.png" }
      ];
    case "thit-chung-mam-tep-thanh-nguyen":
      return [
        { label: "Hũ 275g", price: 175000, priceFormatted: "175.000đ", image: "/assets/san-pham/Mắm tép thanh nguyễn/IMG_7739.JPG" },
        { label: "Hũ 90g", price: 65000, priceFormatted: "65.000đ", image: "/assets/san-pham/Mắm tép thanh nguyễn/IMG_7747.JPG" }
      ];
    case "ruoc-ca-ro-tong-truong":
      return [
        { label: "Hộp 100g", price: 239000, priceFormatted: "239.000đ", image: "/assets/san-pham/ruốc cá rô tổng trường/2.png" }
      ];
    default:
      return [
        { 
          label: product.weight ? `Túi ${product.weight}` : "Tiêu chuẩn", 
          price: product.price, 
          priceFormatted: product.priceFormatted, 
          image: product.image 
        }
      ];
  }
}

export default function ProductPage() {
  const { user, db } = useFirebaseAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("all");
  const [addingState, setAddingState] = useState({}); // itemId -> 'idle' | 'saving' | 'saved'
  
  // Track hovered card for image swapping
  const [hoveredCard, setHoveredCard] = useState(null);

  // Selected Option for each product ID
  const [selectedOptions, setSelectedOptions] = useState({});

  // Initialize options on mount
  useEffect(() => {
    const initial = {};
    hardcodedProducts.forEach((p) => {
      const opts = getProductOptions(p);
      if (opts.length > 0) {
        initial[p.id] = opts[0];
      }
    });
    setSelectedOptions(initial);
  }, []);

  // Filtering products based on category tag
  const getFilteredProducts = useCallback(() => {
    if (activeTab === "all") return hardcodedProducts;
    if (activeTab === "tourism") {
      return hardcodedProducts.filter((p) => p.category === "Sản phẩm du lịch");
    }
    if (activeTab === "specialty") {
      return hardcodedProducts.filter((p) => p.category === "Đặc sản Ninh Bình");
    }
    return hardcodedProducts;
  }, [activeTab]);

  const filteredProducts = getFilteredProducts();

  // ── Quick Add to Cart ──
  const handleQuickAdd = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !db) {
      showToast("Đăng nhập để lưu giỏ hàng vào tài khoản.", "info");
      return;
    }

    const itemId = product.id;
    const currentOpt = selectedOptions[product.id] || getProductOptions(product)[0];
    setAddingState((prev) => ({ ...prev, [itemId]: "saving" }));

    try {
      const { doc, collection, setDoc, increment, serverTimestamp } = await import("firebase/firestore");
      const cartRef = doc(collection(db, "users", user.uid, "cart"), itemId);

      const displayName = currentOpt 
        ? `${product.name} (${currentOpt.label})` 
        : product.name;

      const finalPrice = currentOpt ? currentOpt.price : Number(product.price || 0);

      await setDoc(
        cartRef,
        {
          productId: product.id,
          slug: product.slug || product.id,
          quantity: increment(1),
          updatedAt: serverTimestamp(),
          snapshot: {
            name: displayName,
            price: finalPrice,
            image: currentOpt?.image || product.image || "",
            badge: product.badge || product.category || "",
            weight: currentOpt?.label || product.weight || "",
          },
        },
        { merge: true }
      );

      setAddingState((prev) => ({ ...prev, [itemId]: "idle" }));
      showToast(`Đã thêm 1 ${product.shortName || product.name} (${currentOpt?.label || ""}) vào giỏ hàng.`, "success");
    } catch (error) {
      console.error("Quick add failed:", error);
      setAddingState((prev) => ({ ...prev, [itemId]: "idle" }));
      showToast("Không thể thêm vào giỏ hàng.", "error");
    }
  };

  const handleCardClick = (product) => {
    router.push(product.href);
  };

  return (
    <>
      <SiteHeader />
      <main className="product-list-page" style={{ position: "relative", minHeight: "100vh" }}>
        
        {/* Banner Section */}
        <section className="souvenir-products" aria-labelledby="souvenir-products-title">
          <div className="souvenir-products-heading">
            <p className="souvenir-products-kicker">Sản phẩm</p>
            <h1 id="souvenir-products-title">Sắc Cố Đô</h1>
            <p>Khám phá bộ sưu tập quà tặng văn hóa độc quyền và ẩm thực nổi tiếng mang trọn tinh hoa vùng đất Cố đô Ninh Bình.</p>
          </div>

          {/* Dynamic Heritage Category Tabs */}
          <div className="heritage-category-tabs-container">
            <div className="heritage-category-tabs">
              <button
                className={`category-tab-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                Tất cả sản phẩm
              </button>
              <button
                className={`category-tab-btn ${activeTab === "tourism" ? "active" : ""}`}
                onClick={() => setActiveTab("tourism")}
              >
                Hành lý du lịch
              </button>
              <button
                className={`category-tab-btn ${activeTab === "specialty" ? "active" : ""}`}
                onClick={() => setActiveTab("specialty")}
              >
                Đặc sản Ninh Bình
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div className="souvenir-products-grid" data-count={filteredProducts.length} style={{ marginTop: "40px" }}>
            {filteredProducts.map((product) => {
              const optionsList = getProductOptions(product);
              const currentOpt = selectedOptions[product.id] || optionsList[0];
              const isSaving = addingState[product.id] === "saving";

              // Check if image changes on hover
              const displayedImage = (hoveredCard === product.id && product.images && product.images[1])
                ? product.images[1]
                : (currentOpt?.image || product.image);

              return (
                <div 
                  className="souvenir-product-card" 
                  key={product.id}
                  onMouseEnter={() => setHoveredCard(product.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => handleCardClick(product)}
                >
                  {/* Media Frame & Badges */}
                  <div
                    className={`souvenir-product-media ${product.image?.includes("/remove-bg/") ? "is-contain" : "is-cover"}`}
                    style={{ cursor: "pointer" }}
                  >
                    {product.badge && <span className="souvenir-product-badge">{product.badge}</span>}
                    
                    <img 
                      src={displayedImage} 
                      alt={product.name} 
                      loading="eager" 
                      decoding="async" 
                      style={{ transition: "all 0.5s ease" }}
                    />
                    
                    {/* Hover Actions Panel (Direct link to Detail and Quick Add) */}
                    <div className="product-card-hover-panel">
                      <button 
                        className="hover-action-btn quick-view"
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(product.href);
                        }}
                        aria-label="Xem chi tiết"
                      >
                        <Eye size={16} />
                        <span>Chi tiết</span>
                      </button>
                      <button 
                        className="hover-action-btn quick-add"
                        type="button" 
                        onClick={(e) => handleQuickAdd(e, product)}
                        disabled={isSaving}
                        aria-label="Thêm vào giỏ hàng"
                      >
                        <ShoppingBag size={16} />
                        <span>{isSaving ? "Đang thêm..." : "Thêm giỏ"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="souvenir-product-body" style={{ cursor: "pointer" }}>
                    
                    {/* Dynamic Option Selector */}
                    {optionsList.length > 0 && (
                      <div className="product-option-pills" onClick={(e) => e.stopPropagation()}>
                        {optionsList.map((opt) => (
                          <button
                            key={opt.label}
                            className={`option-pill-btn ${currentOpt?.label === opt.label ? "active" : ""}`}
                            onClick={() => {
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [product.id]: opt,
                              }));
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <h2>{product.name}</h2>
                    <div className="souvenir-product-footer-info">
                      <span className="product-card-cat">{product.category}</span>
                      <strong className="product-card-price">
                        {currentOpt ? currentOpt.priceFormatted : product.priceFormatted}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Marquee Footer Line */}
        <div className="souvenir-products-marquee" aria-hidden="true" style={{ marginTop: "60px" }}>
          <div className="souvenir-products-marquee-track">
            {Array.from({ length: 2 }).map((_, groupIndex) => (
              <span key={groupIndex}>
                Passport Ninh Bình • Cơm cháy dạng túi • Cơm cháy đậm vị • Cơm cháy gạo lứt • Thịt chưng mắm tép • Ruốc cá rô •
              </span>
            ))}
          </div>
        </div>

      </main>
      <SiteFooter />
    </>
  );
}
