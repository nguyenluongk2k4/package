"use client";

import { useEffect, useMemo, useState } from "react";
import { getProductBySlugOrId } from "../../lib/firebase/catalog";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { collection, doc, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { useToast } from "./ToastProvider";

const fallbackImages = [
  { src: "/assets/anh-new/frame-1.png", label: "Khung nhận diện Sắc Cố Đô" },
  { src: "/assets/anh-new/cover photo.jpg", label: "Cover Sắc Cố Đô" },
  { src: "/assets/anh-new/AVT.jpg", label: "Biểu tượng Sắc Cố Đô" },
  { src: "/assets/anh-new/vvv.jpg", label: "Bảng màu và logo Sắc Cố Đô" },
];

const PRODUCT_OPTIONS = {
  passport: [{ label: "Cuốn Passport", price: 150000, priceFormatted: "150.000đ" }],
  "com-chay-dang-tui": [{ label: "Túi 216g", price: 59000, priceFormatted: "59.000đ" }],
  "com-chay-ruoc-dam-vi": [{ label: "Túi 300g", price: 65000, priceFormatted: "65.000đ" }],
  "com-chay-vuong-lut": [{ label: "Túi 200g", price: 54000, priceFormatted: "54.000đ" }],
  "thit-chung-mam-tep-thanh-nguyen": [
    { label: "Hũ 275g", price: 175000, priceFormatted: "175.000đ" },
    { label: "Hũ 90g", price: 65000, priceFormatted: "65.000đ" },
  ],
  "ruoc-ca-ro-tong-truong": [{ label: "Hộp 100g", price: 239000, priceFormatted: "239.000đ" }],
};

function formatVnd(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function toProductOption(product) {
  if (!product) return null;

  return {
    ...product,
    id: product.id,
    shortName: product.shortName || product.name,
    subtitle: product.category || product.badge || product.weight || "Sản phẩm di sản",
    price: Number(product.price || 0),
    priceFormatted: product.priceFormatted || formatVnd(product.price),
  };
}

function getImages(product) {
  const images = product?.detailImages?.length ? product.detailImages : product?.images;
  return (images?.length ? images : [product?.image].filter(Boolean)).map((image, index) => {
    if (typeof image === "string") {
      return { src: image, label: `${product?.name || "Sản phẩm"} ${index + 1}` };
    }

    return {
      src: image?.src || image?.url || product?.image || fallbackImages[0].src,
      label: image?.label || image?.alt || `${product?.name || "Sản phẩm"} ${index + 1}`,
    };
  });
}

function isFallbackProductImage(src) {
  return typeof src === "string" && src.includes("/remove-bg/");
}

export default function ProductConfigurator({ productId }) {
  const { user, db } = useFirebaseAuth();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [activeImage, setActiveImage] = useState(fallbackImages[0]);
  const [quantity, setQuantity] = useState(1);
  const [cartState, setCartState] = useState("idle");
  const [selectedOption, setSelectedOption] = useState(null);

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

  const selected = useMemo(() => toProductOption(product), [product]);

  const optionsList = useMemo(() => {
    if (selected && Array.isArray(selected.variants) && selected.variants.length > 0) {
      return selected.variants;
    }
    return selected ? PRODUCT_OPTIONS[selected.id] || [] : [];
  }, [selected]);

  useEffect(() => {
    if (optionsList.length > 0) {
      setSelectedOption(optionsList[0]);
    } else {
      setSelectedOption(null);
    }
  }, [optionsList]);

  useEffect(() => {
    setActiveImage(getImages(selected)[0] || fallbackImages[0]);
  }, [selected]);

  const detailImages = useMemo(() => {
    const images = getImages(selected);
    return images.length ? images : fallbackImages;
  }, [selected]);

  const currentPrice = useMemo(() => {
    return selectedOption ? selectedOption.price : Number(selected?.price || 0);
  }, [selectedOption, selected]);

  const total = useMemo(() => currentPrice * quantity, [currentPrice, quantity]);
  const activeImageModeClass = isFallbackProductImage(activeImage?.src) ? "is-contain" : "is-cover";

  const detailFacts = useMemo(
    () =>
      [
        { label: "Khối lượng tịnh", value: selectedOption ? selectedOption.label : selected?.weight },
        { label: "Thành phần", value: selected?.ingredients },
        { label: "Hướng dẫn sử dụng", value: selected?.usage },
        { label: "Hạn sử dụng", value: selected?.shelfLife },
        { label: "Bảo quản", value: selected?.storage },
        { label: "Lưu ý", value: selected?.note },
      ].filter((item) => item.value),
    [selected, selectedOption]
  );

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
      const displayName = selectedOption ? `${selected.name} (${selectedOption.label})` : selected.name;

      await setDoc(
        cartRef,
        {
          productId: selected.id,
          slug: selected.slug || selected.id,
          quantity: increment(quantity),
          updatedAt: serverTimestamp(),
          snapshot: {
            name: displayName,
            price: currentPrice,
            image: selectedOption?.image || selected.image || fallbackImages[0].src,
            badge: selected.badge || selected.category || "",
            weight: selectedOption?.label || selected.weight || "",
          },
        },
        { merge: true }
      );

      setCartState("saved");
      showToast(`Đã thêm ${quantity} ${selected.shortName} (${selectedOption?.label || ""}) vào giỏ hàng.`, "success");

      setTimeout(() => {
        setCartState("idle");
      }, 1500);
    } catch (error) {
      console.error("Add to cart failed:", error);
      setCartState("idle");
      showToast(error.message || "Không thể thêm vào giỏ hàng.", "error");
    }
  }

  if (loadingProduct) {
    return (
      <section className="product-detail" aria-label="Đang tải sản phẩm">
        <div className="product-buy-panel">
          <h1>Đang tải sản phẩm...</h1>
        </div>
      </section>
    );
  }

  if (!selected) {
    return (
      <section className="product-detail" aria-label="Không tìm thấy sản phẩm">
        <div className="product-buy-panel">
          <h1>Không tìm thấy sản phẩm</h1>
          <p>Sản phẩm này hiện không còn hiển thị công khai hoặc đường dẫn không hợp lệ.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="product-detail" aria-label="Chi tiết sản phẩm Sắc Cố Đô">
      <div className="product-gallery-panel">
        <div className={`product-main-image ${activeImageModeClass}`}>
          <img src={activeImage.src} alt={activeImage.label} loading="eager" decoding="async" />
        </div>

        <div className="product-thumbs" aria-label="Ảnh sản phẩm">
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
        <span className="product-kicker">{selected.category || "Sản phẩm du lịch"}</span>
        <h1>{selected.name || "Sản phẩm Sắc Cố Đô"}</h1>
        <div className="rating-row">
          <span aria-label="5 sao">★★★★★</span>
          <small>(48 đánh giá của người đi phượt)</small>
        </div>

        {optionsList.length > 1 ? (
          <div style={{ marginTop: "16px", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", color: "#5d6768", fontWeight: "bold", display: "block", marginBottom: "8px" }}>Chọn định lượng:</span>
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

        <p>{selected.description || "Sản phẩm di sản Ninh Bình được tuyển chọn cho hành trình Sắc Cố Đô."}</p>

        {detailFacts.length ? (
          <div className="product-facts-panel">
            <div className="product-facts-header">
              <span className="product-section-kicker">Chi tiết sản phẩm</span>
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

        {selected.story ? (
          <div className="product-story-panel">
            <span className="product-section-kicker">Câu chuyện sản phẩm</span>
            <p>{selected.story}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
