"use client";

import { hardcodedProducts } from "../../data/products";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function ProductPage() {
  return (
    <>
      <SiteHeader />
      <main className="product-list-page">
        <section className="souvenir-products" aria-labelledby="souvenir-products-title">
          <div className="souvenir-products-heading">
            <p className="souvenir-products-kicker">Sản phẩm</p>
            <h1 id="souvenir-products-title">Sắc Cố Đô</h1>
            <p>6 vật phẩm chọn lọc: từ passport hành trình đến các món quà đặc sản mang đậm hương vị Ninh Bình.</p>
          </div>

          <div className="souvenir-products-grid" data-count={hardcodedProducts.length}>
            {hardcodedProducts.map((product) => (
              <a className="souvenir-product-card" href={product.href} key={product.id} aria-label={`Xem ${product.name}`}>
                <div
                  className={`souvenir-product-media ${product.image?.includes("/remove-bg/") ? "is-contain" : "is-cover"}`}
                >
                  {product.badge ? <span className="souvenir-product-badge">{product.badge}</span> : null}
                  <img src={product.image} alt={product.name} loading="eager" decoding="async" />
                </div>
                <div className="souvenir-product-body">
                  <h2>{product.name}</h2>
                  <strong>{product.priceFormatted}</strong>
                </div>
              </a>
            ))}
          </div>
        </section>

        <div className="souvenir-products-marquee" aria-hidden="true">
          <div className="souvenir-products-marquee-track">
            {Array.from({ length: 2 }).map((_, groupIndex) => (
              <span key={groupIndex}>Passport Ninh Bình • Cơm cháy dạng túi • Cơm cháy đậm vị • Cơm cháy gạo lứt • Thịt chưng mắm tép • Ruốc cá rô •</span>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
