"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TemplateFrame from "./TemplateFrame";
import { getCheckins, getJourneyProgress, getActivePassport, isPassportActivated, resetDatabase } from "../../lib/db";
import { stations } from "../../data/sac-co-do";

export default function DashboardPage() {
  const [activated, setActivated] = useState(false);
  const [activeCode, setActiveCode] = useState(null);
  const [checkedinIds, setCheckedinIds] = useState([]);
  const [progress, setProgress] = useState({ completed: 0, total: 6, percent: 0 });

  useEffect(() => {
    const loadData = () => {
      const isAct = isPassportActivated();
      setActivated(isAct);
      if (isAct) {
        setActiveCode(getActivePassport());
        setCheckedinIds(getCheckins());
        setProgress(getJourneyProgress());
      }
    };

    loadData();

    // Listen for custom checkin updates
    window.addEventListener("checkin-updated", loadData);
    return () => {
      window.removeEventListener("checkin-updated", loadData);
    };
  }, []);

  const handleReset = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử check-in và đặt lại passport cá nhân để chơi lại từ đầu không?")) {
      resetDatabase();
      window.location.reload();
    }
  };

  return (
    <TemplateFrame>
      <InnerBanner />
      <section className="bg-white py-20 relative text-primary">
        <div className="container">
          {!activated ? (
            <NotActivatedView />
          ) : (
            <div className="space-y-12">
              {/* Progress Panel */}
              <div className="bg-lightturquoise/20 p-8 border border-paleaqua rounded-3xl shadow-[0px_4px_30px_rgba(41,137,145,0.04)] flex items-center justify-between flex-wrap gap-8">
                <div className="flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="bg-primary text-white font-bold text-xs px-2.5 py-0.5 rounded-full font-mono">
                      PASSPORT ID: {activeCode}
                    </span>
                    {progress.isCompletedAll && (
                      <span className="bg-citrusyellow text-primary font-bold text-xs px-2.5 py-0.5 rounded-full animate-bounce">
                        Hành trình hoàn tất!
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black mb-4">Hành Trình Sắc Cố Đô Của Bạn</h3>
                  
                  {/* Custom Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-sm">
                      <span>Đã chinh phục: {progress.completed}/{progress.total} trạm</span>
                      <span>{progress.percent}%</span>
                    </div>
                    <div className="w-full h-4 bg-white border border-primary/10 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full duration-500 shadow-sm"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  {progress.isCompletedAll ? (
                    <Link
                      href="/phan-thuong"
                      className="site-button butn-bg-shape py-3.5 px-6 font-bold flex items-center gap-2 shadow-lg animate-pulse"
                    >
                      <i className="fa-solid fa-award" /> Nhận chứng nhận điện tử
                    </Link>
                  ) : (
                    <Link
                      href="/hanh-trinh"
                      className="site-button butn-bg-shape py-3.5 px-6 font-bold"
                    >
                      Xem bản đồ 6 trạm
                    </Link>
                  )}
                  <button
                    onClick={handleReset}
                    className="sac-outline-button !border-red-300 hover:!bg-red-50 !text-red-600 font-bold py-3.5 px-5"
                  >
                    Reset hành trình
                  </button>
                </div>
              </div>

              {/* 6 Stations grid */}
              <div>
                <h3 className="text-2xl font-bold mb-7.5 border-b border-primary/10 pb-3">
                  Tiến độ từng trạm di sản
                </h3>
                <div className="grid grid-cols-12 gap-7.5">
                  {stations.map((station, i) => {
                    const isChecked = checkedinIds.includes(station.id);
                    return (
                      <div
                        key={station.id}
                        className={`col-span-12 md:col-span-6 lg:col-span-4 rounded-3xl overflow-hidden border duration-500 shadow-sm relative group bg-white ${
                          isChecked
                            ? "border-primary/20 shadow-md"
                            : "border-primary/10 opacity-75 hover:opacity-95 hover:-translate-y-1"
                        }`}
                      >
                        {/* Grayscale filter if locked */}
                        <div className="relative h-60 w-full overflow-hidden">
                          <img
                            src={station.image}
                            alt={station.name}
                            className={`w-full h-full object-cover duration-700 group-hover:scale-105 ${
                              isChecked ? "" : "grayscale"
                            }`}
                          />
                          <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-primary font-bold text-xs px-3 py-1 rounded-full z-10">
                            Trạm {i + 1}: {station.tag}
                          </span>
                          
                          {/* Locked/Unlocked stamp overlay */}
                          {isChecked ? (
                            <div className="absolute inset-0 bg-emerald-950/20 flex items-center justify-center z-10 animate-fade-in">
                              {/* Cultural stamp illustration using pure CSS */}
                              <div className="size-24 border-4 border-dashed border-citrusyellow rounded-full flex items-center justify-center rotate-[-12deg] bg-white/80 shadow-md">
                                <div className="text-center font-display text-primary flex flex-col items-center">
                                  <span className="text-2xs uppercase tracking-wider font-bold">ĐÃ ĐÓNG ĐẤU</span>
                                  <span className="text-sm font-black text-secondary uppercase mt-0.5">SẮC CỐ ĐÔ</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                              <div className="size-12 bg-white/90 rounded-full flex items-center justify-center text-primary/60 text-lg shadow-sm">
                                <i className="fa-solid fa-lock" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-5 relative bg-white">
                          <h4 className="text-xl font-bold mb-2">{station.name}</h4>
                          <p className="text-sm text-primary/70 mb-5 leading-relaxed min-h-12">
                            {station.description}
                          </p>

                          <div className="flex justify-between items-center gap-3 pt-4 border-t border-primary/5">
                            <span className="text-xs text-primary/50">
                              <i className="fa-regular fa-clock mr-1" /> {station.hours}
                            </span>
                            {isChecked ? (
                              <Link
                                href={`/photobooth?station=${station.id}`}
                                className="site-button butn-bg-shape !py-2 !px-4 text-xs font-bold flex items-center gap-1.5"
                              >
                                <i className="fa-solid fa-camera" /> Chụp Photobooth
                              </Link>
                            ) : (
                              <Link
                                href={`/checkin/${station.id}`}
                                className="sac-outline-button !py-2 !px-4 text-xs font-bold"
                              >
                                Check-in tại trạm
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </TemplateFrame>
  );
}

function NotActivatedView() {
  return (
    <div className="text-center py-20 max-w-135 mx-auto bg-lightturquoise/10 p-8 sm:p-12.5 rounded-3xl border border-paleaqua shadow-sm">
      <div className="size-24 bg-paleaqua/30 text-primary/40 rounded-full flex items-center justify-center text-4xl mx-auto mb-7.5 animate-pulse">
        <i className="fa-solid fa-passport" />
      </div>
      <h3 className="text-2xl font-bold mb-3.5">Chưa kích hoạt Passport!</h3>
      <p className="text-primary/75 mb-7.5 leading-relaxed">
        Để theo dõi tiến độ khám phá 6 điểm di sản Ninh Bình, đóng dấu ảo, lưu ảnh chụp photobooth cá nhân và nhận phần thưởng hoàn thành, bạn vui lòng kích hoạt mã ID passport được in trên bìa sau cuốn sổ tay Sắc Cố Đô.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/kich-hoat" className="site-button butn-bg-shape">
          Kích hoạt ngay
        </Link>
        <Link href="/san-pham" className="sac-outline-button">
          Tôi chưa có sổ (Mua ngay)
        </Link>
      </div>
    </div>
  );
}

function InnerBanner() {
  return (
    <div className="relative bg-cover bg-center w-full bg-white bg-[url(../images/background/inr-banner.jpg)] overflow-hidden sac-inner-banner">
      <div className="flex w-full lg:h-160 md:h-135 h-100 pb-10 items-baseline mx-auto">
        <div className="relative md:mt-60 mt-45 flex items-center justify-center w-full flex-col z-5">
          <div>
            <h1 className="lg:text-60 md:text-52 text-28 relative">Passport Của Tôi</h1>
          </div>
          <div>
            <ul className="inline-block">
              <li className="text-base pr-7.5 relative inline-block font-semibold text-primary after:content-['-'] after:absolute after:right-2 after:-top-1.5 after:text-primary after:text-26 after:font-normal">
                <Link href="/">Trang chủ</Link>
              </li>
              <li className="relative inline-block text-base font-semibold text-primary">Dashboard tiến độ</li>
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
