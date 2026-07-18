"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useFirebaseAuth } from "./FirebaseAuthProvider";

export default function FloatingAccountVerification() {
  const pathname = usePathname();
  const { user, profile, loading } = useFirebaseAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide the FAB on the activation page itself
  if (pathname === "/kich-hoat") {
    return null;
  }

  const isActivated = !loading && user && profile?.isActivated;

  return (
    <Link
      href="/kich-hoat"
      className={`fab-verify ${isActivated ? `is-activated${visible ? " is-visible" : ""}` : ""}`}
      aria-label={isActivated ? "Tài khoản đã kích hoạt" : "Xác thực tài khoản"}
      style={{ 
        display: "inline-flex", 
        textDecoration: "none",
        background: isActivated ? "#104c27" : undefined,
        borderColor: isActivated ? "#d69e2e" : undefined,
        color: isActivated ? "#fbd38d" : undefined
      }}
    >
      <ShieldCheck size={22} strokeWidth={2.2} />
      <span>{isActivated ? "Tài khoản đã kích hoạt" : "Xác nhận ngay"}</span>
    </Link>
  );
}
