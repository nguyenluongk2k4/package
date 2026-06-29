"use client";

import { collection, doc, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { hardcodedProducts } from "../../data/products";
import { useI18n } from "./I18nProvider";
import { useToast } from "./ToastProvider";

export default function PassportVersionSection({ className = "" }) {
  const { t } = useI18n();
  const { user, db } = useFirebaseAuth();
  const { showToast } = useToast();
  const [activeIndex, setActiveIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [hasProductModel, setHasProductModel] = useState(false);
  const [cartState, setCartState] = useState("idle");
  const activeProduct = hardcodedProducts[activeIndex] || hardcodedProducts[0];
  const activeProductVisual = activeProduct?.homeImage || activeProduct?.image;

  useEffect(() => {
    let mounted = true;

    fetch(activeProduct.model3d.glbUrl, { method: "HEAD" })
      .then((response) => {
        if (mounted) setHasProductModel(response.ok);
      })
      .catch(() => {
        if (mounted) setHasProductModel(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeProduct.model3d.glbUrl]);

  function goToProduct(direction) {
    setActiveIndex((index) => (index + direction + hardcodedProducts.length) % hardcodedProducts.length);
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
          <div className="passport-version-ribbon">6 lựa chọn nổi bật</div>
          <div className="passport-active-card">
            {activeProduct.badge ? <span className="passport-active-badge">{activeProduct.badge}</span> : null}
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
                src={activeProduct.model3d.glbUrl}
                ios-src={activeProduct.model3d.usdzUrl}
                poster={activeProductVisual}
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
                src={activeProductVisual}
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
            {hardcodedProducts.map((item, index) => (
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
