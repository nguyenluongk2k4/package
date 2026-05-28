import { brand, navItems } from "../../data/sac-co-do";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand-mark" href="/">
        <span className="brand-symbol">S</span>
        <span>
          <strong>{brand.name}</strong>
          <small>{brand.tagline}</small>
        </span>
      </a>
      <nav className="site-nav" aria-label="Điều hướng chính">
        {navItems.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <a className="header-cta" href="/kich-hoat">
        Kích hoạt
      </a>
    </header>
  );
}
