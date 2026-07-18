import { brand } from "../../data/sac-co-do";

const footerLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/hanh-trinh", label: "Hành trình" },
  { href: "/ho-chieu", label: "Hộ Chiếu" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/kich-hoat", label: "Kích hoạt" },
  { href: "/ve-chung-toi", label: "Giới thiệu" },
];

export default function SiteFooter() {
  return (
    <footer
      className="site-footer"
      style={{
        background: "var(--ink)",
        color: "var(--cream)",
        padding: "60px 0 40px",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        width: "100%",
        display: "block",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "40px", marginBottom: "40px" }}>
          <div>
            <p className="eyebrow" style={{ margin: 0, fontSize: "14px", color: "var(--accent)" }}>Sắc Cố Đô</p>
            <h2 style={{ fontFamily: "Baloo 2", fontSize: "28px", color: "var(--cream)", margin: "8px 0 16px" }}>Hộ Chiếu Pop-Up Ninh Bình</h2>
            <p className="footer-note" style={{ color: "var(--cream)", opacity: 0.8, fontSize: "14px", lineHeight: "1.6", maxWidth: "320px" }}>
              {brand.description}
            </p>
          </div>

          <div>
            <h3 style={{ fontFamily: "Baloo 2", fontSize: "18px", color: "var(--accent)", margin: "0 0 16px" }}>Liên hệ</h3>
            <div className="footer-contact">
              <p><strong>Email:</strong> <a href="mailto:saccodo.official@gmail.com" style={{ color: "inherit", textDecoration: "none", fontWeight: "inherit" }}>saccodo.official@gmail.com</a></p>
              <p><strong>Địa chỉ:</strong> 56 Thôn 3, Thạch Hoà, Thạch Thất, Hà Nội</p>
              <p><strong>Số điện thoại:</strong> <a href="tel:0962216876" style={{ color: "inherit", textDecoration: "none", fontWeight: "inherit" }}>0962216876</a></p>
            </div>
            <div className="footer-socials">
              <a href="https://www.facebook.com/saccodo.official" className="social-icon" target="_blank" rel="noopener noreferrer" aria-label="Facebook Sắc Cố Đô" title="Facebook">
                <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.7-1.6h1.8V3.8c-.3 0-1.4-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H7.5v3h2.8v8h3.2Z" /></svg>
              </a>
              <a href="https://www.tiktok.com/@saccodo.official" className="social-icon" target="_blank" rel="noopener noreferrer" aria-label="TikTok Sắc Cố Đô" title="TikTok">
                <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M16.7 5.2a4.9 4.9 0 0 1-3.1-3.5h-2.8v13a2.4 2.4 0 1 1-1.7-2.3V9.5a5.3 5.3 0 1 0 4.6 5.2V8.1a7.6 7.6 0 0 0 4.5 1.5V6.8a4.8 4.8 0 0 1-1.5-1.6Z" /></svg>
              </a>
            </div>
          </div>

          <div>
            <h3 style={{ fontFamily: "Baloo 2", fontSize: "18px", color: "var(--accent)", margin: "0 0 16px" }}>Đường dẫn nhanh</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {footerLinks.map((item) => (
                <a key={item.href} href={item.href} style={{ color: "var(--cream)", opacity: 0.85, fontSize: "14px", fontWeight: "700" }}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.15)", paddingTop: "24px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", color: "var(--cream)", opacity: 0.7, fontSize: "13px" }}>
          <span>© 2026 Sắc Cố Đô. All rights reserved.</span>
          <div>
            <a href="/ve-chung-toi" style={{ marginRight: "16px", color: "var(--cream)" }}>Điều khoản bảo mật</a>
            <a href="/ve-chung-toi" style={{ color: "var(--cream)" }}>Hỗ trợ</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
