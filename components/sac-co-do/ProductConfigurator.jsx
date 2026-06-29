"use client";

import { useEffect, useMemo, useState } from "react";
import { getHardcodedProductBySlugOrId } from "../../data/products";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { collection, doc, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { useToast } from "./ToastProvider";

const fallbackImages = [
  { src: "/assets/anh-new/frame-1.png", label: "Khung nhan dien Sac Co Do" },
  { src: "/assets/anh-new/cover photo.jpg", label: "Cover Sac Co Do" },
  { src: "/assets/anh-new/AVT.jpg", label: "Bieu tuong Sac Co Do" },
  { src: "/assets/anh-new/vvv.jpg", label: "Bang mau va logo Sac Co Do" },
];

function formatVnd(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";
}

function toProductOption(product) {
  return {
    ...product,
    id: product.id,
    shortName: product.shortName || product.name,
    subtitle: product.category || product.badge || product.weight || "San pham di san",
    price: Number(product.price || 0),
    priceFormatted: product.priceFormatted || formatVnd(product.price),
  };
}

function getImages(product) {
  const images = product?.detailImages?.length ? product.detailImages : product?.images;
  return (images?.length ? images : [product?.image].filter(Boolean)).map((image, index) => {
    if (typeof image === "string") {
      return { src: image, label: `${product?.name || "San pham"} ${index + 1}` };
    }

    return {
      src: image?.src || image?.url || product?.image || fallbackImages[0].src,
      label: image?.label || image?.alt || `${product?.name || "San pham"} ${index + 1}`,
    };
  });
}

export default function ProductConfigurator({ productId }) {
  const { user, db } = useFirebaseAuth();
  const { showToast } = useToast();
  const [activeImage, setActiveImage] = useState(fallbackImages[0]);
  const [quantity, setQuantity] = useState(1);
  const [cartState, setCartState] = useState("idle");
  const [hasDetailModel, setHasDetailModel] = useState(false);

  const selected = useMemo(() => {
    return toProductOption(getHardcodedProductBySlugOrId(productId));
  }, [productId]);

  useEffect(() => {
    setActiveImage(getImages(selected)[0] || fallbackImages[0]);
  }, [selected]);

  const detailImages = useMemo(() => {
    const images = getImages(selected);
    return images.length ? images : fallbackImages;
  }, [selected]);

  const total = useMemo(() => Number(selected?.price || 0) * quantity, [selected?.price, quantity]);
  const model3d = selected?.model3d || {};
  const detailFacts = useMemo(
    () =>
      [
        { label: "Khối lượng tịnh", value: selected?.weight },
        { label: "Thành phần", value: selected?.ingredients },
        { label: "Hướng dẫn sử dụng", value: selected?.usage },
        { label: "Hạn sử dụng", value: selected?.shelfLife },
        { label: "Bảo quản", value: selected?.storage },
        { label: "Lưu ý", value: selected?.note },
      ].filter((item) => item.value),
    [selected]
  );

  useEffect(() => {
    if (!model3d.glbUrl) {
      setHasDetailModel(false);
      return;
    }

    let mounted = true;
    fetch(model3d.glbUrl, { method: "HEAD" })
      .then((response) => {
        if (mounted) setHasDetailModel(response.ok);
      })
      .catch(() => {
        if (mounted) setHasDetailModel(false);
      });

    return () => {
      mounted = false;
    };
  }, [model3d.glbUrl]);

  async function addToCart() {
    if (!user || !db || !selected) {
      setCartState("auth");
      showToast("Đăng nhập để lưu giỏ hàng vào tài khoản.", "info");
      return;
    }

    setCartState("saving");
    try {
      const itemId = selected.id || selected.slug;
      const cartRef = doc(collection(db, "users", user.uid, "cart"), itemId);

      await setDoc(
        cartRef,
        {
          productId: selected.id,
          slug: selected.slug || selected.id,
          quantity: increment(quantity),
          updatedAt: serverTimestamp(),
          snapshot: {
            name: selected.name,
            price: Number(selected.price || 0),
            image: selected.image || detailImages[0]?.src || "",
            badge: selected.badge || selected.category || "",
            weight: selected.weight || "",
          },
        },
        { merge: true }
      );
      setCartState("saved");
      showToast("Đã thêm vào giỏ hàng.", "success");
    } catch (error) {
      console.error("Add to cart failed:", error);
      setCartState("idle");
      showToast(error.message || "Không thể thêm vào giỏ hàng.", "error");
    }
  }

  return (
    <section className="product-detail" aria-label="Chi tiết sản phẩm Sắc Cố Đô">
      <div className="product-gallery-panel">
        <div className="product-main-image">
          {hasDetailModel ? (
            <model-viewer
              src={model3d.glbUrl}
              ios-src={model3d.usdzUrl || undefined}
              poster={model3d.posterUrl || activeImage.src}
              camera-controls
              auto-rotate
              ar
              shadow-intensity="0.8"
              alt={selected?.name || "Sản phẩm 3D"}
            />
          ) : (
            <img src={activeImage.src} alt={activeImage.label} loading="eager" decoding="async" />
          )}
        </div>
        <div className="product-thumbs" aria-label="Ảnh sản phẩm">
          {detailImages.map((image) => (
            <button
              className={image.src === activeImage.src ? "active" : ""}
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
        <span className="product-kicker">{selected?.category || "Sản phẩm du lịch"}</span>
        <h1>{selected?.name || "Sản phẩm Sắc Cố Đô"}</h1>
        <div className="rating-row">
          <span aria-label="5 sao">★★★★★</span>
          <small>(48 đánh giá của người đi phượt)</small>
        </div>
        <p>{selected?.description || "Sản phẩm di sản Ninh Bình được tuyển chọn cho hành trình Sắc Cố Đô."}</p>

        <div className="purchase-box">
          <div>
            <small>Số lượng:</small>
            <div className="quantity-control">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Giảm số lượng">
                -
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Tăng số lượng">
                +
              </button>
            </div>
          </div>
          <div className="total-box">
            <small>Tổng cộng:</small>
            <strong>{formatVnd(total)}</strong>
          </div>
        </div>

        <button className="add-cart-button" type="button" onClick={addToCart} disabled={cartState === "saving"}>
          <span className="cart-glyph" aria-hidden="true" />
          {cartState === "saving" ? "Đang thêm..." : "Thêm vào giỏ hàng"}
        </button>
        {cartState === "auth" ? <small className="product-cart-note">Đăng nhập để lưu giỏ hàng trên Firebase.</small> : null}
        {cartState === "saved" ? <small className="product-cart-note">Đã lưu vào giỏ hàng.</small> : null}

        {selected?.story ? (
          <div className="product-story-panel">
            <span className="product-section-kicker">Câu chuyện sản phẩm</span>
            <p>{selected.story}</p>
          </div>
        ) : null}

        {detailFacts.length ? (
          <div className="product-facts-panel">
            <div className="product-facts-header">
              <span className="product-section-kicker">Thông tin sản phẩm</span>
              <strong>{selected?.priceFormatted}</strong>
            </div>
            <dl className="product-facts-list">
              {detailFacts.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
    </section>
  );
}
