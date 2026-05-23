import Link from "next/link";
import TemplateFrame from "./TemplateFrame";

export default function AboutPage() {
  return (
    <TemplateFrame>
      <InnerBanner />
      <RecommendSection />
      <StoryDetailsSection />
    </TemplateFrame>
  );
}

function InnerBanner() {
  return (
    <div className="relative bg-cover bg-center w-full bg-white bg-[url(../images/background/inr-banner.jpg)] overflow-hidden sac-inner-banner">
      <div className="flex w-full lg:h-160 md:h-135 h-100 pb-10 items-baseline mx-auto">
        <div className="relative md:mt-60 mt-45 flex items-center justify-center w-full flex-col z-5">
          <div>
            <h1 className="lg:text-60 md:text-52 text-28 relative">Về chúng tôi</h1>
          </div>
          <div>
            <ul className="inline-block">
              <li className="text-base pr-7.5 relative inline-block font-semibold text-primary after:content-['-'] after:absolute after:right-2 after:-top-1.5 after:text-primary after:text-26 after:font-normal">
                <Link href="/">Trang chủ</Link>
              </li>
              <li className="relative inline-block text-base font-semibold text-primary">Câu chuyện thương hiệu</li>
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

function RecommendSection() {
  return (
    <div className="xl:pt-30 pt-12.5 pb-20 bg-white">
      <div className="container">
        <div className="section-content">
          <div className="trv-we-recommend2-row">
            <div className="row flex flex-wrap items-center">
              <div className="lg:w-7/12 w-full max-lg:mb-15">
                <div className="relative mr-6">
                  <div className="2xl:max-w-94 max-w-80 relative z-1 before:absolute sm:before:size-97.5 before:size-80.5 before:left-0 before:top-22.5 before:bg-eggshell before:rounded-full before:-z-1 max-md:-left-12 max-sm:-left-0">
                    <img src="/assets/images/abt-pic1.png" alt="image" width="376" height="672" loading="lazy" />
                  </div>
                  <div className="mt-6 2xl:size-97.5 xl:size-90.5 md:size-75.5 size-70.5 border-[20px] border-paleaqua rounded-full absolute xl:right-7 md:-right-6 -right-24 xl:bottom-17.5 bottom-15.5 z-1 max-sm:hidden overflow-hidden">
                    <img src="/assets/images/we-rec3-pic.jpg" alt="image" className="w-full h-full object-cover rounded-full" width="350" height="350" loading="lazy" />
                  </div>
                  <div className="mt-6 size-50 border-[10px] border-white rounded-full shadow-[0px_27px_35.9px_rgba(41,137,145,0.2)] absolute 2xl:left-90.5 xl:left-78.5 md:left-74.5 left-64.5 2xl:top-0.25 xl:-top-20.75 md:-top-3.75 -top-1.25 z-1 max-sm:hidden overflow-hidden">
                    <img src="/assets/images/we-rec3-pic2.jpg" alt="image" className="w-full h-full object-cover rounded-full" width="180" height="180" loading="lazy" />
                  </div>
                </div>
              </div>

              <div className="lg:w-5/12 w-full">
                <div className="xl:mb-30 mb-7.5 relative">
                  <div className="sm:mb-15 mb-7.5">
                    <h2 className="!font-display xl:text-46 md:text-40 text-3xl mb-3.5 leading-tight">
                      Kết nối di sản bằng <span className="text-citrusyellow">trải nghiệm chạm</span> đặc biệt
                    </h2>
                    <div className="lg:mb-12.5 mb-7.5 text-base text-primary/80">
                      Sắc Cố Đô là dự án tâm huyết kết hợp giữa nghệ thuật làm sổ thủ công Pop-up (sách nổi kỹ thuật dựng hình) và giải pháp du lịch thông minh, giúp thế hệ trẻ chạm vào tinh hoa văn hóa, lịch sử và thắng cảnh Ninh Bình một cách chủ động và đầy hứng khởi.
                    </div>
                  </div>

                  <div className="mb-12.5 space-y-5">
                    <div className="flex items-center xl:max-w-104 max-w-full py-4 px-6 bg-white border border-primary/10 rounded-2xl shadow-[0px_4px_20px_rgba(41,137,145,0.05)]">
                      <div className="bg-no-repeat size-13.75 min-w-13.75 mr-5 flex items-center justify-center">
                        <img src="/assets/images/trv-icon/travel-guide.png" alt="" className="max-w-12 sac-icon-filter" width="48" height="49" loading="lazy" />
                      </div>
                      <div>
                        <h4 className="text-xl text-primary font-bold mb-1">Cầm - Cảm nhận vật lý</h4>
                        <p className="text-sm text-primary/70">Mở từng trang giấy nổi 3D tinh xảo mô phỏng kiến trúc di sản Ninh Bình ngoài đời thực.</p>
                      </div>
                    </div>

                    <div className="flex items-center xl:max-w-104 max-w-full py-4 px-6 bg-white border border-primary/10 rounded-2xl shadow-[0px_4px_20px_rgba(41,137,145,0.05)]">
                      <div className="bg-no-repeat size-13.75 min-w-13.75 mr-5 flex items-center justify-center">
                        <img src="/assets/images/trv-icon/mission-icon.png" alt="" className="max-w-12 sac-icon-filter" width="48" height="49" loading="lazy" />
                      </div>
                      <div>
                        <h4 className="text-xl text-primary font-bold mb-1">Số hóa hành trình</h4>
                        <p className="text-sm text-primary/70">Đóng dấu, tích lũy điểm chạm, kích hoạt tài khoản và mở khóa kho lưu niệm số cá nhân hóa.</p>
                      </div>
                    </div>
                  </div>

                  <div className="sm:flex items-center">
                    <div className="mr-5 max-sm:mb-5">
                      <Link href="/san-pham" className="site-button butn-bg-shape">
                        Mua sổ ngay
                      </Link>
                    </div>
                    <div className="flex items-center">
                      <div className="flex items-center mr-3.5">
                        <span className="size-9 inline-flex rounded-full overflow-hidden border-2 border-white -ml-2.5 first:ml-0">
                          <img src="/assets/images/hpy-cus/pic1.jpg" alt="" width="34" height="34" />
                        </span>
                        <span className="size-9 inline-flex rounded-full overflow-hidden border-2 border-white -ml-2.5">
                          <img src="/assets/images/hpy-cus/pic2.jpg" alt="" width="34" height="34" />
                        </span>
                        <span className="size-9 inline-flex rounded-full overflow-hidden border-2 border-white -ml-2.5">
                          <img src="/assets/images/hpy-cus/pic3.jpg" alt="" width="34" height="34" />
                        </span>
                      </div>
                      <div>
                        <span className="block font-black text-22 text-secondary">5.000+</span>
                        <p className="uppercase font-semibold text-2xs text-primary/60">Người đồng hành</p>
                      </div>
                    </div>
                  </div>

                  <div className="2xl:absolute right-0 bottom-0 2xl:w-22.5 max-2xl:pt-8">
                    <div className="inline-flex items-center sm:w-85 2xl:absolute left-0 text-left 2xl:-rotate-90 2xl:origin-[0_0] 2xl:pl-26.5">
                      <h2 className="font-black sm:text-83 text-5xl leading-none !text-citrusyellow text-shadow-[0px_4px_0px_var(--primary)] mr-3.75 !font-base">100%</h2>
                      <span className="sm:text-24 text-xl font-black leading-1.2 text-primary">Made in Việt Nam</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryDetailsSection() {
  return (
    <div className="py-20 bg-paleaqua/30 border-t border-paleaqua">
      <div className="container">
        <div className="max-w-210 mx-auto text-center">
          <h3 className="text-3xl text-primary font-bold mb-7.5">Ý nghĩa văn hóa của dự án Sắc Cố Đô</h3>
          <p className="text-base text-primary/80 mb-10 leading-relaxed">
            Ninh Bình không chỉ có thiên nhiên hùng vĩ mà còn chứa đựng cả một dòng chảy lịch sử vàng son qua Kinh đô Hoa Lư xưa, các dấu ấn văn hóa Phật giáo, kiến trúc tâm linh vĩ đại. Bằng cách kết hợp giữa sổ giấy truyền thống và tương tác số, Sắc Cố Đô mong muốn biến mỗi du khách thành một "đại sứ văn hóa", tự mình khám phá, đóng dấu và lưu giữ câu chuyện lịch sử theo cách trân quý và sáng tạo nhất.
          </p>
          <div className="grid grid-cols-12 gap-7.5 text-left">
            <div className="md:col-span-4 col-span-12 bg-white p-6.25 rounded-2xl border border-primary/5">
              <span className="text-citrusyellow text-3xl font-bold mb-3.75 block font-display">01. Bảo tồn</span>
              <p className="text-sm text-primary/70">Mô phỏng kiến trúc, hoa văn cố đô chuẩn xác trên chất liệu giấy mỹ thuật cao cấp thân thiện môi trường.</p>
            </div>
            <div className="md:col-span-4 col-span-12 bg-white p-6.25 rounded-2xl border border-primary/5">
              <span className="text-citrusyellow text-3xl font-bold mb-3.75 block font-display">02. Phát triển</span>
              <p className="text-sm text-primary/70">Ứng dụng công nghệ check-in QR và AR Photobooth giúp hành trình du lịch thêm tương tác, hiện đại.</p>
            </div>
            <div className="md:col-span-4 col-span-12 bg-white p-6.25 rounded-2xl border border-primary/5">
              <span className="text-citrusyellow text-3xl font-bold mb-3.75 block font-display">03. Lan tỏa</span>
              <p className="text-sm text-primary/70">Hỗ trợ kết nối cộng đồng người đi du lịch, chia sẻ kỷ niệm và quảng bá Ninh Bình ra thế giới.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
