import { brand, navItems } from "../../data/sac-co-do";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p className="eyebrow">Sắc Cố Đô</p>
        <h2>Pop-up passport Ninh Bình</h2>
      </div>
      <div className="footer-links">
        {navItems.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </div>
      <p className="footer-note">{brand.description}</p>
    </footer>
  );
}
