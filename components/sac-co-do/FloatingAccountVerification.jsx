"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFirebaseAuth } from "./FirebaseAuthProvider";

export default function FloatingAccountVerification() {
  const pathname = usePathname();
  const { user, profile, loading } = useFirebaseAuth();

  // Hide the FAB on the activation page itself, or if the user is already activated
  if (pathname === "/kich-hoat" || (!loading && user && profile?.isActivated)) {
    return null;
  }

  return (
    <Link
      href="/kich-hoat"
      className="fab-verify"
      aria-label="Xác thực tài khoản"
      style={{ display: "inline-flex", textDecoration: "none" }}
    >
      <ShieldCheck size={22} strokeWidth={2.2} />
      <span>Xác nhận ngay</span>
    </Link>
  );
}
