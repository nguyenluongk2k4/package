"use client";

import { collection, doc, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useI18n } from "./I18nProvider";
import { useToast } from "./ToastProvider";

const productModelBase = "/assets/san-pham/models";

const featuredProducts = [
  {
    id: "passport",
    slug: "single",
    name: "Pop-up Passport Ninh Bình",
    price: 150000,
    priceFormatted: "150.000đ",
    badge: "Sản phẩm chính",
    description: "Cuốn sổ pop-up lưu giữ hành trình đóng dấu, check-in QR và kỷ niệm tại các điểm văn hóa tiêu biểu của Ninh Bình.",
    image: "/assets/san-pham/remove-bg/passport.png",
    href: "/san-pham/single",
  },
  {
    id: "com-chay-dang-tui",
    slug: "com-chay-dang-tui",
    name: "Cơm Cháy Cố Đô Dạng Túi",
    price: 59000,
    priceFormatted: "59.000đ",
    badge: "Bán chạy",
    weight: "180g",
    description: "Miếng cơm cháy giòn rụm, vị mộc dễ ăn, gói gọn hương vị quà quê Ninh Bình cho những chuyến đi ngắn ngày.",
    image: "/assets/san-pham/remove-bg/Cơm cháy cố đô dạng túi 180g - 59k_goi-Photoroom.png",
    href: "/san-pham/com-chay-dang-tui",
  },
  {
    id: "com-chay-ruoc-dam-vi",
    slug: "com-chay-ruoc-dam-vi",
    name: "Cơm Cháy Cố Đô Ruốc Đậm Vị",
    price: 65000,
    priceFormatted: "65.000đ",
    badge: "Đậm vị",
    weight: "300g",
    description: "Lớp ruốc bông mặn ngọt phủ đều trên nền cơm cháy vàng giòn, phù hợp mua làm quà hoặc dùng chung trong nhóm.",
    image: "/assets/san-pham/remove-bg/Cơm cháy cố đô ruốc đậm vị 300g 65k_goi-Photoroom.png",
    href: "/san-pham/com-chay-ruoc-dam-vi",
  },
  {
    id: "com-chay-vuong-lut",
    slug: "com-chay-vuong-lut",
    name: "Cơm Cháy Cố Đô Vuông Lứt",
    price: 54000,
    priceFormatted: "54.000đ",
    badge: "Gạo lứt",
    weight: "210g",
    description: "Phiên bản vuông gọn với gạo lứt thơm bùi, giữ được độ giòn đặc trưng và cảm giác nhẹ nhàng khi thưởng thức.",
    image: "/assets/san-pham/remove-bg/Cơm cháy cố đô vuông lứt 210g 54k_ goi-Photoroom.png",
    href: "/san-pham/com-chay-vuong-lut",
  },
].map((product) => ({
  ...product,
  modelSrc: `${productModelBase}/${product.id}.glb`,
  iosModelSrc: `${productModelBase}/${product.id}.usdz`,
}));

export default function PassportVersionSection({ className = "" }) {
  const { t } = useI18n();
  const { user, db } = useFirebaseAuth();
  const { showToast } = useToast();
  const [activeIndex, setActiveIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [hasProductModel, setHasProductModel] = useState(false);
  const [cartState, setCartState] = useState("idle");
  const activeProduct = featuredProducts[activeIndex] || featuredProducts[0];

  useEffect(() => {
    let mounted = true;

    fetch(activeProduct.modelSrc, { method: "HEAD" })
      .then((response) => {
        if (mounted) setHasProductModel(response.ok);
      })
      .catch(() => {
        if (mounted) setHasProductModel(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeProduct.modelSrc]);

  function goToProduct(direction) {
    setActiveIndex((index) => (index + direction + featuredProducts.length) % featuredProducts.length);
    setRotation(0);
    setCartState("idle");
  }

  async function addToCart() {
    if (!user || !db || !activeProduct) {
      setCartState("auth");
      showToast("Đăng nhập để lưu giỏ hàng vào tài khoản.", "info");
      return;
    }

    setCartState("saving");
    try {
      const cartRef = doc(collection(db, "users", user.uid, "cart"), activeProduct.id);

      await setDoc(
        cartRef,
        {
          productId: activeProduct.id,
          slug: activeProduct.slug,
          quantity: increment(1),
          updatedAt: serverTimestamp(),
          snapshot: {
            name: activeProduct.name,
            price: Number(activeProduct.price || 0),
            image: activeProduct.image,
            badge: activeProduct.badge || "",
            weight: activeProduct.weight || "",
          },
        },
        { merge: true }
      );

      setCartState("saved");
      showToast("Đã thêm vào giỏ hàng.", "success");
    } catch (error) {
      console.error("Add featured product to cart failed:", error);
      setCartState("idle");
      showToast(error.message || "Không thể thêm vào giỏ hàng.", "error");
    }
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
          <div className="passport-version-ribbon">4 lựa chọn nổi bật</div>
          <div className="passport-active-card">
            {activeProduct.badge ? <span className="passport-active-badge">{activeProduct.badge}</span> : null}
            <p className="passport-active-label">Giá</p>
            <strong className="passport-active-price">{activeProduct.priceFormatted}</strong>
            <h3>{activeProduct.name}</h3>
            <p>{activeProduct.description}</p>
            <div className="passport-active-actions">
              <a className="passport-active-link" href={activeProduct.href}>
                Xem chi tiết
                <img src="/assets/ic-next.svg" alt="" aria-hidden="true" />
              </a>
              <button className="passport-cart-button" type="button" onClick={addToCart} disabled={cartState === "saving"}>
                {cartState === "saving" ? "Đang thêm..." : cartState === "saved" ? "Đã thêm" : "Thêm vào giỏ"}
              </button>
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
            {hasProductModel ? (
              <model-viewer
                class="passport-product-model"
                src={activeProduct.modelSrc}
                ios-src={activeProduct.iosModelSrc}
                poster={activeProduct.image}
                camera-controls
                auto-rotate
                interaction-prompt="none"
                shadow-intensity="0.65"
                exposure="1"
                ar
              />
            ) : (
              <img
                className="passport-product-image"
                src={activeProduct.image}
                alt={activeProduct.name}
                loading="eager"
                decoding="async"
                style={{ "--passport-rotation": `${rotation}deg` }}
              />
            )}
          </div>

          <button className="passport-product-arrow next" type="button" onClick={() => goToProduct(1)} aria-label="Sản phẩm tiếp theo">
            <span aria-hidden="true">›</span>
          </button>

          <div className="passport-product-dots" aria-label="Chọn sản phẩm">
            {featuredProducts.map((item, index) => (
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
