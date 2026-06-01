"use client";

import { useEffect } from "react";

const revealSelectors = [
  ".hero-copy",
  ".hero-media",
  ".stats-band > *",
  ".content-section > .section-title",
  ".page-shell > .section-title",
  ".page-shell > *",
  ".product-detail-page > *",
  ".product-detail > *",
  ".step-grid > *",
  ".product-grid > *",
  ".station-grid > *",
  ".gallery-strip > *",
  ".about-hero > *",
  ".timeline > *",
  ".product-gallery-panel",
  ".product-buy-panel",
  ".activation-form",
  ".progress-grid > *",
  ".reward-card",
  ".cart-row",
  ".checkin-card",
  ".passport-hero-panel > *",
  ".passport-progress-card",
  ".passport-stamp-grid > *",
  ".passport-achievement-panel",
  ".passport-achievement-list > *",
  ".passport-offer-box",
  ".passport-story-panel > *",
  ".passport-memory-image",
  ".passport-mobile-actions",
  ".journey-detail-back",
  ".journey-detail-hero",
  ".journey-detail-content-grid > *",
  ".journey-detail-route",
  ".journey-detail-chapters > *",
  ".journey-detail-side > *",
  ".site-footer > *",
];

function getDelay(element) {
  const siblings = Array.from(element.parentElement?.children || []);
  const index = Math.max(0, siblings.indexOf(element));
  return `${Math.min(index, 5) * 70}ms`;
}

export default function ScrollReveal() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) {
      return undefined;
    }

    const root = document.documentElement;
    root.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.12,
      },
    );

    function scan() {
      const elements = revealSelectors.flatMap((selector) =>
        Array.from(document.querySelectorAll(selector)),
      );

      elements.forEach((element) => {
        if (!(element instanceof HTMLElement)) {
          return;
        }

        element.classList.add("reveal-target");
        element.style.setProperty("--reveal-delay", getDelay(element));

        if (!element.classList.contains("is-revealed")) {
          observer.observe(element);
        }
      });
    }

    scan();

    let frame = 0;
    const mutationObserver = new MutationObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(scan);
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      observer.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
