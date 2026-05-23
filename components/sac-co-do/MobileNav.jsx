import Link from "next/link";

export default function MobileNav() {
  return (
    <Link
      href="/hanh-trinh"
      className="sac-mobile-nav"
      aria-label="Đi tới hành trình"
      style={{
        alignItems: "center",
        background: "var(--primary)",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        gap: 5,
        height: 44,
        justifyContent: "center",
        left: "calc(100vw - 60px)",
        position: "fixed",
        top: 16,
        width: 44,
        zIndex: 100000,
      }}
    >
      <span />
      <span />
      <span />
    </Link>
  );
}
