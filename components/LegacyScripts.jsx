"use client";

import { useEffect } from "react";

const localScripts = [
  "/assets/vendor/gsap/gsap.min.js",
  "/assets/vendor/gsap/ScrollSmoother.js",
  "/assets/vendor/gsap/ScrollTrigger.min.js",
  "/assets/vendor/swiper/swiper-bundle.min.js",
  "/assets/vendor/flatpickr/js/flatpickr.js",
  "/assets/js/jquery-3.7.1.min.js",
  "/assets/js/theia-sticky-sidebar.js",
  "/assets/js/owl.carousel.min.js",
  "/assets/js/isotope.pkgd.min.js",
  "/assets/js/dz.carousel.js",
  "/assets/js/lc_lightbox.lite.js",
  "/assets/vendor/magnific-popup/magnific-popup.js",
  "/assets/vendor/nouislider/nouislider.min.js",
  "/assets/vendor/group-slide/group-loop.js",
  "/assets/js/dz.ajax.js",
  "/assets/vendor/xmenu/xmenu.js",
  "/assets/js/animation.js",
  "/assets/js/custom.js",
];

function appendScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.dataset.legacyTemplateScript = "true";
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function appendInlineScript(code) {
  const script = document.createElement("script");
  script.text = code;
  script.dataset.legacyTemplateScript = "true";
  document.body.appendChild(script);
}

const initLegacyTemplate = `
(function () {
  if (window.__travllaLegacyInit) return;
  window.__travllaLegacyInit = true;

  function run(label, callback) {
    try {
      callback();
    } catch (error) {
      console.error(label + " failed", error);
    }
  }

  if (document.readyState !== "loading") {
    run("Travlla.init", function () {
      if (typeof Travlla !== "undefined") Travlla.init();
    });
  }

  if (document.readyState === "complete") {
    run("TravllaCarousel.load", function () {
      if (typeof TravllaCarousel !== "undefined") TravllaCarousel().load();
    });

    run("ClinicMasterGsap.init", function () {
      if (typeof ClinicMasterGsap !== "undefined") ClinicMasterGsap().init();
    });
  }
})();
`;

export default function LegacyScripts() {
  useEffect(() => {
    let isCancelled = false;

    async function loadScripts() {
      for (const src of localScripts) {
        if (isCancelled) {
          return;
        }

        await appendScript(src);
      }

      if (!isCancelled) {
        appendInlineScript(initLegacyTemplate);
        appendScript("https://www.google.com/recaptcha/api.js").catch(() => {});
      }
    }

    loadScripts().catch((error) => {
      console.error("Failed to load template scripts", error);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  return null;
}
