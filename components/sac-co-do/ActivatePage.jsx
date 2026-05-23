"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TemplateFrame from "./TemplateFrame";
import { activatePassport, getActivePassport } from "../../lib/db";

export default function ActivatePage() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const currentActivePassport = getActivePassport();

  const handleActivateSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Simulate database lookup latency
    setTimeout(() => {
      const res = activatePassport(code);
      setIsLoading(false);
      setMessage(res.message);

      if (res.success) {
        setIsError(false);
        // Redirect to dashboard after showing success message
        setTimeout(() => {
          router.push("/cua-toi");
        }, 1500);
      } else {
        setIsError(true);
      }
    }, 800);
  };

  return (
    <TemplateFrame>
      <InnerBanner />
      <section className="bg-white py-20 relative text-primary">
        <div className="container">
          <div className="max-w-150 mx-auto bg-lightturquoise/20 p-8 sm:p-12.5 border border-paleaqua rounded-3xl shadow-[0px_4px_30px_rgba(41,137,145,0.05)]">
            <h3 className="text-2xl font-bold text-center mb-2.5">Kích Hoạt Passport Cá Nhân</h3>
            <p className="text-center text-primary/70 mb-8.75 text-sm">
              Mỗi cuốn sổ giấy Sắc Cố Đô đi kèm một mã ID duy nhất dạng **SCD-XXXXX** in riêng ở bìa sau. Hãy nhập mã này để đồng bộ hóa hành trình của bạn.
            </p>

            {currentActivePassport && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm text-center">
                Bạn đã kích hoạt thành công passport: <b className="font-mono text-base block mt-1">{currentActivePassport}</b>
                <Link href="/cua-toi" className="underline font-bold text-xs mt-1 block">
                  Đi đến trang Hành Trình Của Tôi &gt;
                </Link>
              </div>
            )}

            <form onSubmit={handleActivateSubmit} className="space-y-6">
              <div>
                <label htmlFor="passportCode" className="text-xs font-semibold uppercase text-primary/70 block mb-2 ml-2">
                  Nhập mã kích hoạt:
                </label>
                <input
                  type="text"
                  id="passportCode"
                  required
                  disabled={isLoading}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="block w-full sm:h-18.5 h-14 rounded-5xl border border-primary/20 sm:px-8 px-6 text-primary bg-white outline-0 placeholder:text-primary/30 text-center font-mono font-bold text-lg focus:border-primary duration-300 uppercase"
                  placeholder="SCD-ABC12"
                />
              </div>

              {message && (
                <div className={`p-4 rounded-2xl text-center text-sm font-semibold border ${
                  isError ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}>
                  {isError ? (
                    <i className="fa-solid fa-triangle-exclamation mr-2" />
                  ) : (
                    <i className="fa-solid fa-circle-check mr-2" />
                  )}
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="site-button butn-bg-shape w-full py-4 text-center justify-center font-bold flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin" /> Đang kiểm tra mã...
                  </>
                ) : (
                  <>Kích hoạt ngay</>
                )}
              </button>
            </form>

            <div className="mt-10 pt-7.5 border-t border-primary/10 text-xs text-primary/60 space-y-2">
              <span className="font-bold block text-sm text-primary mb-1">Cách lấy mã ID Passport:</span>
              <ul className="list-disc pl-5 space-y-1">
                <li>Mở trang cuối cùng (bìa sau) của cuốn sổ giấy Sắc Cố Đô.</li>
                <li>Tìm ô tem cào hoặc dòng mã chữ in nổi có dạng **SCD-XXXXX** (ví dụ: `SCD-NF92A`).</li>
                <li>Mã phân biệt chữ hoa, chữ thường và số. Vui lòng nhập chính xác 9 ký tự.</li>
                <li>Nếu chưa mua sổ, bạn có thể mua một cuốn tại trang <Link href="/san-pham" className="underline font-bold text-secondary">Sản phẩm</Link> để bắt đầu hành trình.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </TemplateFrame>
  );
}

function InnerBanner() {
  return (
    <div className="relative bg-cover bg-center w-full bg-white bg-[url(../images/background/inr-banner.jpg)] overflow-hidden sac-inner-banner">
      <div className="flex w-full lg:h-160 md:h-135 h-100 pb-10 items-baseline mx-auto">
        <div className="relative md:mt-60 mt-45 flex items-center justify-center w-full flex-col z-5">
          <div>
            <h1 className="lg:text-60 md:text-52 text-28 relative">Kích Hoạt Passport</h1>
          </div>
          <div>
            <ul className="inline-block">
              <li className="text-base pr-7.5 relative inline-block font-semibold text-primary after:content-['-'] after:absolute after:right-2 after:-top-1.5 after:text-primary after:text-26 after:font-normal">
                <Link href="/">Trang chủ</Link>
              </li>
              <li className="relative inline-block text-base font-semibold text-primary">Kích hoạt tài khoản</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="h-50 w-full absolute top-50 left-0 z-1">
        <div className="inline-block whitespace-nowrap animate-moveCloud">
          <img src="/assets/images/inr-banner-cloud.png" alt="" className="h-47.5" />
        </div>
      </div>
      <div className="absolute w-1/2 right-0 top-0 bottom-0 z-1">
        <div className="mt-60 animate-slide-right">
          <img src="/assets/images/airplane.png" alt="" className="animate-slide-top-fast" width="378" height="146" />
        </div>
      </div>
      <div className="absolute right-11.25 bottom-16.25 animate-slide-top2">
        <img src="/assets/images/hotballon-Left.png" alt="" className="md:w-21 w-10" width="84" height="121" />
      </div>
      <div className="absolute md:-right-15 -right-10 top-41.25 animate-slide-top">
        <img src="/assets/images/hotballon-right.png" alt="" className="md:w-37.5 w-20" width="230" height="333" />
      </div>
    </div>
  );
}
