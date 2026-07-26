"use client";

import { useEffect, useState } from "react";
import { useI18n } from "./I18nProvider";

export default function ScrollToTop() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollUp = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      className={`scroll-to-top-btn${visible ? " is-visible" : ""}`}
      onClick={scrollUp}
      aria-label={t("common.scrollToTopAria")}
      type="button"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M10 15V5M10 5L5.5 9.5M10 5L14.5 9.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
