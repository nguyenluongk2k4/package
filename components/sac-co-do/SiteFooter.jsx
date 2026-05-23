import Link from "next/link";
import { navItems, stations } from "../../data/sac-co-do";

export default function SiteFooter() {
  return (
    <footer className="pt-20 bg-primary bg-cover bg-[url(../images/background/ftr-dark-bg.png)]">
      <div className="-mt-40">
        <div className="container bg-citrusyellow rounded-3xl md:flex items-center justify-between !py-6.25 lg:!px-17.5 sm:!px-10.5 !px-5.5 max-w-324">
          <div className="pr-5 max-lg:w-1/2 max-md:w-full">
            <div className="text-primary font-display lg:text-80 sm:text-46 text-28 leading-[0.75] sm:text-shadow-[2px_3px_0px_rgba(255,255,255,0.72)] pb-5">
              <span className="text-white inline-block">Đi đủ</span> 6 trạm!
            </div>
            <div className="text-primary text-xl font-medium font-title max-md:mb-5">
              Kích hoạt ID để lưu tiến độ, mở photobooth và nhận phần thưởng số.
            </div>
          </div>
          <div className="max-w-107 flex-1">
            <Link
              href="/kich-hoat"
              className="bg-primary text-white rounded-full px-8 py-5 inline-flex items-center justify-center font-title font-bold duration-500 hover:bg-white hover:text-primary"
            >
              Kích hoạt hành trình
            </Link>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="sm:pt-20 pt-10 text-white/06 border-b border-primary">
          <div className="grid grid-cols-12">
            <div className="lg:col-span-3 col-span-12 sm:px-3.75">
              <div className="mb-10">
                <Link href="/" className="sac-logo sac-logo-footer">
                  <span>Sắc</span> Cố Đô
                </Link>
                <p className="sm:pr-12.5 mt-7.5 mb-4 text-base text-white/50">
                  Sổ pop-up passport kết hợp trải nghiệm đóng dấu, check-in và lưu giữ ký ức tại Ninh Bình.
                </p>
                <ul className="mt-5">
                  {["facebook", "instagram", "tiktok"].map((name) => (
                    <li
                      className="inline-flex xl:size-11.5 size-10.5 bg-citrusyellow xl:mr-2.5 mr-1.5 rounded-4xl justify-center items-center duration-500 hover:rounded-2lg group"
                      key={name}
                    >
                      <a
                        className="inline-flex size-9 bg-primary rounded-4xl justify-center items-center duration-500 text-white text-lg group-hover:rounded-2lg"
                        href="https://www.instagram.com"
                        target="_blank"
                        rel="noreferrer"
                        aria-label={name}
                      >
                        <i className={`fa-brands fa-${name} group-hover:rotate-y-[360deg] group-hover:scale-[1.2] !inline-block duration-[0.5s] group-hover:text-citrusyellow`} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-3 col-span-6 mb-5 sm:px-3.75">
              <div className="mb-10">
                <h3 className="!text-white mb-7.5 relative xl:text-28 text-2xl">Điều hướng</h3>
                <ul>
                  {navItems.map((item) => (
                    <li className="block w-full py-0.5 overflow-hidden" key={item.href}>
                      <Link
                        className="pb-1.5 block duration-500 text-base text-paleaqua font-semibold hover:text-citrusyellow"
                        href={item.href}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-3 col-span-6 mb-5 sm:px-3.75">
              <div className="mb-10">
                <h3 className="!text-white mb-7.5 relative xl:text-28 text-2xl">6 trạm</h3>
                <ul>
                  {stations.slice(0, 5).map((station) => (
                    <li className="block w-full py-0.5 overflow-hidden" key={station.id}>
                      <Link
                        className="pb-1.5 block duration-500 text-base text-paleaqua font-semibold hover:text-citrusyellow"
                        href={`/hanh-trinh#${station.id}`}
                      >
                        {station.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-3 sm:col-span-6 col-span-12 sm:px-3.75">
              <div className="mb-10">
                <ul>
                  <li className="mb-2.5 relative flex items-center">
                    <div className="xl:size-14 size-12 xl:min-w-14 min-w-12 rounded-full mr-3.5 bg-white/40 flex items-center justify-center">
                      <i className="fa-solid fa-envelope text-xl text-white" />
                    </div>
                    <a className="black text-paleaqua font-semibold xl:text-lg text-sm font-base" href="mailto:hello@saccodo.vn">
                      hello@saccodo.vn
                    </a>
                  </li>
                  <li className="relative flex items-center">
                    <div className="xl:size-14 size-12 xl:min-w-14 min-w-12 rounded-full mr-3.5 bg-white/40 flex items-center justify-center">
                      <i className="fa-solid fa-location-dot text-xl text-white" />
                    </div>
                    <span className="black text-paleaqua font-semibold xl:text-lg text-sm font-base">
                      Ninh Bình, Việt Nam
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="py-10 text-white relative z-1 font-normal after:absolute after:bg-primary after:max-w-135 after:h-px after:left-1/2 after:top-0 after:-translate-x-1/2">
          <p className="copyrights-text text-center text-sm font-semibold">
            © 2026 <span className="inline-block text-citrusyellow uppercase text-center text-sm font-semibold">Sắc Cố Đô</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
