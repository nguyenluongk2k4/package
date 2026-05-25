import Link from "next/link";
import { proofStats, stations, steps } from "../../data/sac-co-do";
import SectionTitle from "./SectionTitle";
import StationCard from "./StationCard";

export function HeroSection() {
  return (
    <div className="3xl:h-237.5 2xl:h-225 sm:h-192 h-170 overflow-hidden relative trv-banner-1-wrap sac-hero">
      <div className="trv-banner-1-rain-effect">
        <div className="absolute left-0 size-full z-2 rain front-row" />
        <div className="absolute left-0 size-full z-2 rain back-row" />
      </div>
      <video muted loop autoPlay playsInline className="absolute left-1/2 top-1/2 -translate-1/2 object-cover size-full z-0">
        <source src="/assets/images/video-1.mp4" type="video/mp4" />
      </video>
      <div className="relative z-2 3xl:h-220 2xl:h-207.5 lg:h-171.25 h-195 lg:m-8.75 lg:rounded-3xl bg-black/35">
        <div className="xl:pt-50 md:pt-40 pt-37.5 md:pl-17.5 max-md:px-5 max-w-255">
          <span className="2xl:text-48 text-3xl leading-17.5 text-aquamist xl:pl-12.5 font-display block">
            Pop-up passport
          </span>
          <div className="relative">
            <h1 className="sac-hero-title !font-display !text-white relative inline-block animate-slide-left" title="Sắc Cố Đô">
              Sắc Cố Đô
            </h1>
            <h1
              className="sac-hero-title !font-display !text-transparent absolute left-0 top-0 z-1 [-webkit-text-stroke:2px_#fff] animate-slide-left"
              title="Sắc Cố Đô"
              aria-hidden="true"
            >
              Sắc Cố Đô
            </h1>
            <img
              src="/assets/images/butterfly.gif"
              alt=""
              className="absolute 2xl:top-15 xl:top-6 md:top-3 -top-5 z-9 2xl:right-5 xl:right-65 lg:right-85 sm:right-50 right-0 xl:w-50 w-37.5"
            />
          </div>
          <p className="text-lg leading-7.5 text-white relative xl:max-w-135 w-full mb-7.5 sac-hero-copy">
            Một cuốn sổ pop-up, sáu điểm chạm văn hóa Ninh Bình, và hành trình đóng dấu mở khóa photobooth số.
          </p>
          <div className="relative z-[4] flex flex-wrap gap-4">
            <Link href="/san-pham" className="site-button butn-bg-shape">
              Mua sổ
            </Link>
            <Link href="/hanh-trinh" className="sac-outline-button">
              Xem 6 trạm
            </Link>
          </div>
        </div>

        <div className="sac-book-mockup" aria-hidden="true">
          <div className="sac-book-cover">
            <span>SCD</span>
            <strong>Passport</strong>
          </div>
          <div className="sac-book-page sac-book-page-one" />
          <div className="sac-book-page sac-book-page-two" />
          <div className="sac-stamp">6 trạm</div>
        </div>

        <div className="text-white absolute bottom-7.5 3xl:right-112.5 2xl:right-64.5 sm:right-10 right-5 flex items-center z-4">
          <span className="pr-26.25 text-xs leading-4.5 tracking-[0.2em] uppercase relative inline-block after:content-[''] after:absolute after:w-16 after:h-px after:bg-white after:right-5 after:top-1/2 after:-translate-y-1/2 max-sm:hidden">
            Theo dõi
          </span>
          <ul className="flex">
            <li>
              <a href="https://www.facebook.com" target="_blank" rel="noreferrer" className="text-white text-xl ml-5 duration-500 block hover:text-secondary hover:-translate-y-1.25">
                <i className="fa-brands fa-facebook-f" />
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="text-white text-xl ml-5 duration-500 block hover:text-secondary hover:-translate-y-1.25">
                <i className="fa-brands fa-instagram" />
              </a>
            </li>
          </ul>
        </div>

        <div className="absolute inset-0 z-[3] overflow-hidden max-lg:hidden">
          <div className="absolute top-1/2 -translate-y-1/2 size-175 right-0">
            <div className="-right-4/5 absolute z-2 rotate-center animate-rotate-center">
              <span className="size-175 rounded-full border border-white/30 block relative after:size-3.5 after:bg-white after:rounded-full after:absolute after:right-8.75 after:top-1/4 after:z-10" />
            </div>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 size-225 right-0">
            <div className="right-[-70%] absolute z-2 animate-rotate-center">
              <span className="size-225 rounded-full border border-white/30 block relative after:size-3.5 after:bg-secondary after:rounded-full after:absolute after:right-18.75 after:bottom-1/5 after:z-10" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-37.5 w-full">
        <div className="inline-block whitespace-nowrap animate-moveCloud">
          <img src="/assets/images/cloud-1.png" alt="" className="w-auto" width="400" height="332" />
        </div>
      </div>
      <div className="absolute top-0 w-full">
        <div className="inline-block whitespace-nowrap animate-moveCloud">
          <img src="/assets/images/cloud-2.png" alt="" className="w-auto" width="297" height="225" />
        </div>
      </div>
    </div>
  );
}

export function JourneyActionStrip() {
  const actions = [
    ["Chọn gói", "Sổ đơn, combo hoặc gói tặng", "/san-pham", "/assets/images/search-icon/icon1.png"],
    ["Kích hoạt", "Nhập mã SCD in trong sổ", "/kich-hoat", "/assets/images/search-icon/icon2.png"],
    ["Check-in", "Quét QR và nhập mã ngày", "/hanh-trinh", "/assets/images/search-icon/icon3.png"],
    ["Nhận quà", "Hoàn thành đủ 6 trạm", "/phan-thuong", "/assets/images/search-icon/icon4.png"],
  ];

  return (
    <div className="bg-lightturquoise xl:pt-17.5 pt-12.5 px-5">
      <div className="max-w-250 mx-auto p-1.75 bg-paleaqua lg:rounded-25xl rounded-2xl">
        <div className="bg-white lg:rounded-25xl rounded-2xl sm:pt-3 sm:pr-3.25 sm:pb-2.25 sm:pl-10 p-5 h-full">
          <div className="grid grid-cols-12 gap-5 items-center">
            {actions.map(([title, desc, href, icon]) => (
              <Link href={href} className="lg:col-span-3 sm:col-span-6 col-span-12 sac-action-item" key={title}>
                <img src={icon} alt="" className="h-5 w-auto" width="24" height="24" />
                <span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StationCarouselSection() {
  return (
    <div className="relative overflow-hidden md:pb-22.5 pb-10 md:pt-30 pt-17.5 bg-contain bg-[bottom_center] bg-repeat-x bg-[url(../images/background/Cloud-bg.png)]">
      <div className="container">
        <SectionTitle
          highlight="6 trạm"
          title="trong hành trình cố đô"
          description="Mỗi trạm là một trang pop-up, một mã QR và một dấu mốc để lưu vào passport cá nhân."
        />
        <div>
          <div className="swiper reviewtwo-slider !relative !z-1 !-mt-7.5 xl:!pb-29 !pb-22.5">
            <div className="swiper-wrapper pt-7.5">
              {stations.map((station) => (
                <div className="swiper-slide" key={station.id}>
                  <StationCard station={station} compact />
                </div>
              ))}
            </div>
            <div className="swiper-button-next" />
            <div className="swiper-button-prev" />
          </div>
        </div>
      </div>
      <div className="absolute -left-28.75 top-2/5 w-57.5 opacity-50 animate-slide-top2">
        <img src="/assets/images/hotballon-Left.png" alt="" width="233" height="333" />
      </div>
      <div className="absolute -right-13.75 top-2/5 w-27.5 animate-slide-top">
        <img src="/assets/images/hotballon-right.png" alt="" width="110" height="166" />
      </div>
    </div>
  );
}

export function StorySection() {
  return (
    <div className="bg-paleaqua lg:pt-30 sac-story">
      <div className="container">
        <div className="grid grid-cols-12">
          <div className="xl:col-span-5 lg:col-span-7 col-span-12 px-3.75 max-lg:mb-40">
            <div className="2xl:mb-30 mb-10 relative">
              <div className="text-left 2xl:mb-15 mb-10">
                <h2 className="!font-display xl:text-46 md:text-40 text-3xl mb-2.5">
                  Không chỉ là <span className="text-citrusyellow">một cuốn sổ</span>
                </h2>
                <p className="2xl:mb-12.5 mb-7 sm:pr-8.75 text-base">
                  Sắc Cố Đô biến chuyến đi Ninh Bình thành một trò chơi nhẹ: mở trang, tìm điểm đến, đóng dấu,
                  chụp ảnh và giữ lại phần thưởng số sau khi hoàn thành.
                </p>
              </div>
              <div className="mb-5 flex max-sm:flex-wrap">
                <div className="sm:w-35 w-full sm:h-51 h-40 p-2.25 bg-white rounded-3xl flex min-w-35 sm:mr-7.5 max-sm:mb-10">
                  <div className="bg-primary shadow-[0px_4px_4px_rgba(0,0,0,0.25)] p-2.5 rounded-2xxl text-center flex flex-col items-center justify-center w-full">
                    <span className="text-38 text-citrusyellow font-black block">A5</span>
                    <span className="text-white text-2xl font-title font-medium block">Pop-up book</span>
                  </div>
                </div>
                <div>
                  <Feature icon="/assets/images/trv-icon/travel-guide.png" title="Passport có ID riêng">
                    Mỗi cuốn có mã kích hoạt để lưu hành trình cá nhân mà không cần tạo tài khoản.
                  </Feature>
                  <Feature icon="/assets/images/trv-icon/mission-icon.png" title="Trải nghiệm tại điểm đến">
                    QR và mã ngày giúp việc check-in có cảm giác thật, có tiến độ và có phần thưởng.
                  </Feature>
                </div>
              </div>
              <div className="sm:flex items-center">
                <Link href="/san-pham" className="site-button butn-bg-shape mr-3">
                  Xem sản phẩm
                </Link>
                <div className="flex max-sm:pt-2.5">
                  <div>
                    <span className="block font-black text-22 text-primary">VI / EN</span>
                    <p className="mb-0 uppercase font-medium text-xs">Song ngữ từ MVP</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="xl:col-span-7 lg:col-span-5 col-span-12 relative px-3.75">
            <div className="sac-product-showcase">
              <div className="sac-product-book sac-product-book-main">
                <span>Sắc Cố Đô</span>
                <strong>Pop-up Passport</strong>
              </div>
              <div className="sac-product-book sac-product-book-left" />
              <div className="sac-product-book sac-product-book-right" />
              <div className="sac-product-badge">ID riêng</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, children }) {
  return (
    <div className="flex mb-7.5 trv-icon-bx-st1">
      <div className="bg-no-repeat size-21.25 min-w-21.25 bg-cover mr-7.5 flex items-center justify-center bg-[url(../images/trv-icon/Icon-Bg.png)] trv-icon-bx-media">
        <span>
          <img src={icon} alt="" width="48" height="49" loading="lazy" className="max-w-12" />
        </span>
      </div>
      <div>
        <h4 className="mb-3 font-medium text-2xl">{title}</h4>
        <p>{children}</p>
      </div>
    </div>
  );
}

export function ProofBandSection() {
  return (
    <div className="lg:py-30 py-15 bg-paleaqua">
      <div className="container">
        <div className="relative md:rounded-6xl rounded-3xl overflow-hidden">
          <div className="lg:h-120 sm:h-150 h-125 bg-black overflow-hidden relative">
            <div className="h-200 md:h-250 opacity-100 left-0 top-0 absolute translate-z-0 w-full z-1 sac-proof-bg" />
            <div className="absolute inset-0 bg-primary/65 z-2" />
            <div className="relative z-3 h-full flex items-center justify-center text-center px-5">
              <div>
                <h2 className="!font-display lg:!text-60 sm:!text-60 !text-40 !text-white mb-5">
                  Một hành trình có thể cầm, mở và lưu lại.
                </h2>
                <p className="text-paleaqua text-lg max-w-180 mx-auto">
                  Website giữ vai trò cầu nối giữa cuốn sổ giấy và trải nghiệm số: kích hoạt, check-in, photobooth,
                  phần thưởng.
                </p>
              </div>
            </div>
            <div className="lg:h-40 sm:h-65 h-40 sm:p-10 pb-2.5 p-5 absolute bottom-0 z-10 right-0 left-0 bg-[rgba(6,97,104,0.62)] backdrop-blur-[5px]">
              <div className="grid grid-cols-12">
                {proofStats.map((stat) => (
                  <div className="lg:col-span-3 col-span-6 lg:mb-7.5 mb-5" key={stat.label}>
                    <div className="flex z-1">
                      <div>
                        <h4 className="!font-medium !text-white sm:mb-5 mb-2.5 xl:text-2xl sm:text-xl text-sm">{stat.label}</h4>
                        <div className="font-black xl:text-42 sm:text-36 text-2xl leading-[0.75] font-base text-white">
                          <span className="value" data-value={stat.value.replace("%", "")}>
                            {stat.value.replace("%", "")}
                          </span>
                          {stat.value.includes("%") && "%"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <div className="bg-white md:pt-30 pt-17.5 relative overflow-hidden">
      <div className="absolute w-150 h-137.5 -left-75 top-1/2 bg-amber [filter:blur(100px)]" />
      <div className="absolute w-150 h-125 -right-75 top-1/2 bg-bluelight [filter:blur(100px)]" />
      <div className="container">
        <div className="section-content">
          <div className="relative z-1 mb-30">
            <div className="grid grid-cols-12">
              <div className="xl:col-span-7 col-span-12 px-3.75">
                <div className="md:max-w-100 max-w-[inherit] text-left lg:mb-15 mb-7.5">
                  <h2 className="!font-display xl:text-46 md:text-40 text-3xl mb-3.5">
                    <span className="text-citrusyellow">3 bước </span>để bắt đầu hành trình
                  </h2>
                </div>
                <div className="md:flex max-2xl:justify-center">
                  <div className="md:mr-6 md:min-w-61.5 min-w-[inherit]">
                    <div className="media sac-step-visual" aria-label="Sổ Sắc Cố Đô">
                      <span>SCD</span>
                      <strong>Passport</strong>
                    </div>
                    <div className="rounded-xl md:max-w-59 max-w-[inherit] p-5 pt-15 ml-3 -mt-11 bg-citrusyellow max-md:text-center max-md:mb-7.5">
                      <span className="text-primary font-semibold text-lg leading-6 block pb-2.5">MVP ưu tiên</span>
                      <div className="flex max-md:justify-center">
                        <h2 className="!text-white !text-95 !leading-[0.75] !font-black !font-base">01</h2>
                        <div className="block text-xl text-primary uppercase font-black leading-6">sản phẩm<span className="block">lõi</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="md:mr-6.25">
                    {steps.map((step) => (
                      <div className="mb-5 bg-white border border-paleaqua p-2.5 sm:pl-12.5 pl-10.5 shadow-[0px_27px_35.9px_rgba(41,137,145,0.2)] rounded-tr-50xl rounded-br-50xl relative sm:ml-12.5 ml-6.5" key={step.number}>
                        <div className="flex items-center justify-between">
                          <div className="sm:size-20 size-15 sm:min-w-20 min-w-15 items-center justify-center flex bg-primary rounded-xl font-base sm:text-42 text-36 text-white font-black absolute sm:-left-12.5 -left-8.5 top-1/2 -translate-y-1/2">
                            {step.number}
                          </div>
                          <div>
                            <div className="font-title text-primary lg:text-2xl text-xl font-medium leading-[1.2] mb-2.5">
                              {step.title}
                            </div>
                            <p className="text-primary">{step.description}</p>
                          </div>
                          <div className="sm:size-25 size-15 sm:min-w-25 min-w-15 bg-citrusyellow rounded-full flex items-center justify-center mr-0">
                            <div className="bg-white sm:size-22.5 size-12.5 sm:min-w-22.5 min-w-12.5 flex items-center justify-center rounded-full">
                              <img src={step.icon} alt="" className="sm:max-w-12 max-w-7 w-full sac-icon-filter" width="48" height="48" loading="lazy" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="xl:col-span-5 col-span-12 px-3.75">
                <div className="relative z-1 pt-22.5 max-2xl:flex max-2xl:justify-center">
                  <img src="/assets/images/hotballon-Left.png" alt="" className="w-17 absolute left-0 2xl:-bottom-106.25 bottom-0 animate-slide-top2" width="68" height="98" loading="lazy" />
                  <img src="/assets/images/cloud-1.png" alt="" className="absolute z-2 w-2/5 -left-7.5 top-40 animate-smooth-up-down" width="204" height="169" loading="lazy" />
                  <div className="2xl:absolute after:absolute after:bottom-[-30%] after:left-1/2 after:-translate-1/2 sm:after:size-125 after:size-80 after:rounded-full after:bg-eggshell after:-z-1">
                    <img src="/assets/images/Girl-Image.png" alt="Người dùng đi hành trình" className="mr-20 relative z-5" width="440" height="577" loading="lazy" />
                    <span className="text-primary font-display sm:text-40 text-36 flex items-baseline absolute 2xl:left-[85%] sm:left-[90%] left-[78%] text-left rotate-[-90deg] origin-[0_0] sm:pl-12.5">
                      Cố <b className="text-citrusyellow text-98 font-normal leading-[1]">Đô!</b>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-br-25xl rounded-bl-25xl bg-primary pt-27.5 pb-17.5 bg-[url(../images/w-cho-top.png),url(../images/w-cho-btm.png)] bg-no-repeat [background-position:top_left,bottom_left] flex flex-wrap items-center justify-between mb-300">
            <div className="max-w-122.5 xl:ml-45 ml-10 mb-7.5">
              <h3 className="!font-display !text-40 !leading-[1.2] mb-7.5 !text-white">Vì sao chọn chúng tôi?</h3>
              <ul className="sm:flex text-white flex-wrap">
                {["Thiết kế thủ công, độc bản 100%", "6 điểm check-in di sản Ninh Bình", "Mã ID riêng cho từng cuốn sổ", "Lưu ký ức số mãi mãi qua app"].map((item) => (
                  <li className="font-title font-medium text-lg text-white sm:w-1/2 pr-2.5 flex mb-5" key={item}>
                    <i className="size-7.5 max-w-7.5 mr-6 rounded-full bg-citrusyellow !flex items-center justify-center text-white fa-solid fa-check" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/hanh-trinh" className="site-button butn-bg-shape">
                Xem hành trình
              </Link>
            </div>
            <div className="mx-auto lg:mr-40 max-lg:text-center">
              <img src="/assets/images/24-Image.png" alt="" width="147" height="163" loading="lazy" />
              <h3 className="!font-black xl:!text-58 !text-40 !leading-[0.75] mb-2.5 uppercase !text-white !font-base">SCD</h3>
              <span className="block font-bold xl:text-38 text-28 leading-[1.2] uppercase text-secondary">MVP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
