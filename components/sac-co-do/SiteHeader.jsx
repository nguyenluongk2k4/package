"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { navItems } from "../../data/sac-co-do";
import { getCart } from "../../lib/db";

export default function SiteHeader() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Function to calculate cart items count
    const updateCount = () => {
      const cart = getCart();
      const count = cart.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
    };

    // Initialize on mount
    updateCount();

    // Listen for storage changes & custom update events
    window.addEventListener("cart-updated", updateCount);
    window.addEventListener("storage", updateCount);

    return () => {
      window.removeEventListener("cart-updated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  return (
    <header className="site-header sticky-header absolute lg:left-8.75 lg:right-8.75 lg:top-8.75 left-0 right-0 top-0 duration-500 z-999 [.site-header.is-fixed]:fixed [.site-header.is-fixed]:animate-header-scroll-animation [.site-header.is-fixed]:bg-primary [.site-header.is-fixed]:rounded-b-3xl [.site-header.is-fixed]:top-0">
      <div className="main-bar-wraper">
        <div className="w-full lg:min-h-30 min-h-20 lg:ps-8.75 px-4 lg:pe-13.75 duration-500 rounded-5xl flex items-center justify-between">
          <div className="flex relative w-full">
            <div className="flex items-center relative z-9 h-20 lg:w-52 w-42">
              <Link href="/" className="sac-logo" aria-label="Sắc Cố Đô">
                <span>Sắc</span> Cố Đô
              </Link>
            </div>

            <button
              className="xmenu-toggler lg:hidden float-right mt-4.5 mb-4 md:ml-7 ml-4 size-11 bg-dark-600 relative cursor-pointer max-lg:order-1"
              type="button"
              aria-label="Mở menu"
            >
              <span className="block absolute left-2.5 h-0.5 rounded-px bg-white duration-300 top-3.25 w-5.5" />
              <span className="block absolute left-2.5 h-0.5 rounded-px bg-white duration-0 top-5.5 w-6.25" />
              <span className="block absolute left-2.5 h-0.5 rounded-px bg-white duration-300 top-8 w-4" />
            </button>

            <div className="lg:hidden fixed top-0 left-0 bg-black size-full duration-300 z-999 opacity-0 visible pointer-events-none menu-close fade-overlay" />

            <div className="flex lg:justify-center lg:basis-auto lg:grow max-lg:flex-col justify-start font-base max-lg:fixed max-lg:h-screen max-lg:px-5 max-lg:top-0 max-lg:-left-75 max-lg:z-9999 max-lg:bg-white max-lg:w-72 max-lg:overflow-auto max-lg:duration-700 header-nav custom-scroll">
              <div className="flex items-center relative z-9 py-6.25 lg:hidden">
                <Link href="/" className="sac-logo sac-logo-dark" aria-label="Sắc Cố Đô">
                  <span>Sắc</span> Cố Đô
                </Link>
              </div>
              <ul className="lg:flex flex-wrap navbar-nav">
                {navItems.map((item) => (
                  <li
                    className="lg:inline-block block max-lg:border-b max-lg:border-gray-200 relative group"
                    key={item.href}
                  >
                    <Link
                      className="lg:py-7.5 py-2 xl:px-5 lg:px-2 relative lg:inline-block block text-lg font-medium lg:text-white text-primary hover:text-secondary"
                      href={item.href}
                    >
                      <span className="inline-block">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="lg:hidden block max-lg:p-5 text-center mt-auto">
                <Link href="/gio-hang" className="site-button butn-bg-shape flex items-center justify-center gap-2">
                  <i className="fa-solid fa-shopping-cart" /> Giỏ hàng ({cartCount})
                </Link>
              </div>
            </div>

            <div className="flex lg:justify-end lg:items-center z-9 h-20 xl:pl-8 max-lg:ms-auto gap-4">
              <Link href="/gio-hang" className="relative flex items-center justify-center text-white text-2xl hover:text-secondary transition-colors" aria-label="Xem giỏ hàng">
                <i className="fa-solid fa-shopping-cart" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-citrusyellow text-primary font-bold text-xs size-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link href="/san-pham" className="sac-header-cta max-lg:hidden">
                Mua ngay
              </Link>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}

