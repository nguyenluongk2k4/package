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
        display: "block"
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "40px", marginBottom: "40px" }}>
          <div>
            <p className="eyebrow" style={{ margin: 0, fontSize: "14px", color: "var(--accent)" }}>Sắc Cố Đô</p>
            <h2 style={{ fontFamily: "Baloo 2", fontSize: "28px", color: "var(--cream)", margin: "8px 0 16px" }}>Pop-up passport Ninh Bình</h2>
            <p className="footer-note" style={{ color: "var(--cream)", opacity: 0.8, fontSize: "14px", lineHeight: "1.6", maxWidth: "320px" }}>
              {brand.description}
            </p>
          </div>

          <div>
            <h3 style={{ fontFamily: "Baloo 2", fontSize: "18px", color: "var(--accent)", margin: "0 0 16px" }}>Liên hệ</h3>
            <div className="footer-contact">
              <p><strong>Địa chỉ:</strong> Ninh Bình, Việt Nam</p>
              <p><strong>Hotline:</strong> 0987 654 321</p>
              <p><strong>Email:</strong> contact@saccodo.vn</p>
            </div>
            <div className="footer-socials">
              <a href="https://facebook.com" className="social-icon" target="_blank" rel="noopener noreferrer">FB</a>
              <a href="https://instagram.com" className="social-icon" target="_blank" rel="noopener noreferrer">IG</a>
              <a href="https://tiktok.com" className="social-icon" target="_blank" rel="noopener noreferrer">TT</a>
              <a href="https://youtube.com" className="social-icon" target="_blank" rel="noopener noreferrer">YT</a>
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
