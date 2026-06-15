"use client";

import { useEffect, useState } from "react";
import { souvenirProducts } from "../../data/sac-co-do";
import { getPublicProducts } from "../../lib/firebase/catalog";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function ProductPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      const nextProducts = await getPublicProducts();
      if (mounted) {
        setProducts(nextProducts.filter((product) => product.showOnProductList !== false));
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="product-list-page">
        <section className="souvenir-products" aria-labelledby="souvenir-products-title">
          <div className="souvenir-products-heading">
            <p className="souvenir-products-kicker">Quà mang về từ Cố Đô</p>
            <h1 id="souvenir-products-title">Vật phẩm Di sản</h1>
            <p>
              Gói trọn linh hồn Ninh Bình trong từng đường nét chạm khắc, từng hơi thở của nghìn năm cố đô vào không gian đương đại của bạn.
            </p>
          </div>

          <div className="souvenir-products-grid" data-count={products.length}>
            {products.map((product) => (
              <a className="souvenir-product-card" href={`/san-pham/${product.slug || product.id}`} key={product.id}>
                <div className="souvenir-product-media">
                  <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
                </div>
                <div className="souvenir-product-body">
                  {product.badge ? <span className="pill">{product.badge}</span> : null}
                  <h2>{product.name}</h2>
                  <p>{product.description}</p>
                  <dl>
                    <div>
                      <dt>Khối lượng</dt>
                      <dd>{product.weight}</dd>
                    </div>
                    <div>
                      <dt>Giá bán</dt>
                      <dd>{product.priceFormatted}</dd>
                    </div>
                  </dl>
                  <div className="souvenir-product-actions">
                    <span className="souvenir-product-detail-link">
                      Xem chi tiết
                      <img src="/assets/ic-next.svg" alt="" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        <div className="souvenir-products-marquee" aria-hidden="true">
          <div className="souvenir-products-marquee-track">
            {Array.from({ length: 2 }).map((_, groupIndex) => (
              <span key={groupIndex}>
                Tràng An • Bái Đính • Tam Cốc • Hoa Lư • Phát Diệm •
              </span>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
