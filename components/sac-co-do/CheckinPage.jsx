"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TemplateFrame from "./TemplateFrame";
import { checkinStation, getCheckins, isPassportActivated } from "../../lib/db";
import { stations } from "../../data/sac-co-do";

export default function CheckinPage() {
  const params = useParams();
  const router = useRouter();
  const stationId = params["tram-id"];

  const [activated, setActivated] = useState(false);
  const [station, setStation] = useState(null);
  const [dailyCode, setDailyCode] = useState("");
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alreadyCheckedin, setAlreadyCheckedin] = useState(false);

  useEffect(() => {
    const isAct = isPassportActivated();
    setActivated(isAct);

    const foundStation = stations.find((s) => s.id === stationId);
    setStation(foundStation);

    if (isAct && foundStation) {
      const myCheckins = getCheckins();
      if (myCheckins.includes(foundStation.id)) {
        setAlreadyCheckedin(true);
      }
    }
  }, [stationId]);

  if (!station) {
    return (
      <TemplateFrame>
        <section className="bg-white py-40 text-center text-primary">
          <div className="container">
            <h3 className="text-2xl font-bold mb-3">Không tìm thấy trạm di sản này!</h3>
            <p className="text-primary/70 mb-7.5">Vui lòng kiểm tra lại đường dẫn QR hoặc quay lại trang Bản đồ.</p>
            <Link href="/hanh-trinh" className="site-button butn-bg-shape">
              Xem Bản Đồ 6 Trạm
            </Link>
          </div>
        </section>
      </TemplateFrame>
    );
  }

  const handleCheckinSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Simulate validation latency
    setTimeout(() => {
      const res = checkinStation(station.id, dailyCode);
      setIsLoading(false);
      setMessage(res.message);

      if (res.success) {
        setIsError(false);
        setAlreadyCheckedin(true);
        // Show success notification and encourage them
      } else {
        setIsError(true);
      }
    }, 800);
  };

  return (
    <TemplateFrame>
      <InnerBanner stationName={station.name} />
      <section className="bg-white py-20 relative text-primary">
        <div className="container">
          {!activated ? (
            <div className="text-center py-20 max-w-135 mx-auto bg-lightturquoise/10 p-8 sm:p-12.5 rounded-3xl border border-paleaqua shadow-sm">
              <div className="size-24 bg-paleaqua/30 text-primary/40 rounded-full flex items-center justify-center text-4xl mx-auto mb-7.5 animate-pulse">
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <h3 className="text-2xl font-bold mb-3.5">Chưa kích hoạt Passport!</h3>
              <p className="text-primary/75 mb-7.5 leading-relaxed">
                Để thực hiện quét QR check-in tại trạm **{station.name}**, bạn cần kích hoạt mã ID passport cuốn sổ tay Sắc Cố Đô của mình trước tiên.
              </p>
              <Link href="/kich-hoat" className="site-button butn-bg-shape">
                Đi Kích Hoạt Ngay
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-10 items-center">
              {/* Station Info visual */}
              <div className="lg:col-span-6 col-span-12">
                <div className="rounded-3xl overflow-hidden border border-primary/10 shadow-lg relative max-h-120 bg-paleaqua/10">
                  <img
                    src={station.image}
                    alt={station.name}
                    className="w-full h-full object-cover max-h-120 duration-500 hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                    <div className="text-white">
                      <span className="text-xs uppercase bg-citrusyellow text-primary font-bold px-3 py-1 rounded-full inline-block mb-3 shadow-sm">
                        Đặc điểm: {station.tag}
                      </span>
                      <h3 className="text-3xl font-bold mb-2">{station.name}</h3>
                      <p className="text-white/80 text-sm leading-relaxed max-w-135">
                        {station.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkin validation box */}
              <div className="lg:col-span-6 col-span-12">
                <div className="bg-lightturquoise/20 p-8 sm:p-10 border border-paleaqua rounded-3xl shadow-[0px_4px_30px_rgba(41,137,145,0.05)]">
                  {alreadyCheckedin ? (
                    <div className="text-center space-y-6">
                      <div className="size-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto animate-pulse">
                        <i className="fa-solid fa-circle-check" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-emerald-800 mb-2">Đã check-in thành công!</h4>
                        <p className="text-primary/75 text-sm">
                          Bạn đã hoàn thành điểm chạm văn hóa **{station.name}** và đóng mộc thành công vào cuốn passport ảo.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 pt-5 border-t border-primary/10">
                        <Link
                          href={`/photobooth?station=${station.id}`}
                          className="site-button butn-bg-shape py-3 font-bold block text-center flex items-center justify-center gap-2"
                        >
                          <i className="fa-solid fa-camera" /> Vào chụp ảnh Photobooth
                        </Link>
                        <Link
                          href="/cua-toi"
                          className="sac-outline-button py-3 font-bold block text-center"
                        >
                          Quay lại Dashboard của tôi
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCheckinSubmit} className="space-y-6">
                      <div className="text-center">
                        <h4 className="text-xl font-bold mb-2">Xác nhận có mặt tại trạm</h4>
                        <p className="text-sm text-primary/70">
                          Nhập **Mã Ngày** hiển thị trên bảng thông tin quét QR tại địa điểm di sản thực tế.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="dailyCode" className="text-xs font-semibold uppercase text-primary/70 block mb-2 ml-2">
                          Mã ngày check-in:
                        </label>
                        <input
                          type="text"
                          id="dailyCode"
                          required
                          disabled={isLoading}
                          value={dailyCode}
                          onChange={(e) => setDailyCode(e.target.value)}
                          className="block w-full sm:h-16 h-12 rounded-5xl border border-primary/20 sm:px-6 px-4 text-primary bg-white outline-0 placeholder:text-primary/30 text-center font-bold text-lg focus:border-primary duration-300"
                          placeholder="Nhập 4 chữ số mã ngày..."
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
                            <i className="fa-solid fa-spinner animate-spin" /> Đang kiểm tra...
                          </>
                        ) : (
                          <>Xác nhận check-in</>
                        )}
                      </button>

                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl text-2xs text-yellow-800 space-y-1">
                        <span className="font-bold block text-xs">💡 Gợi ý thử nghiệm (QA Bypass):</span>
                        <p>Để test thử nghiệm nhanh mà không cần có mặt tại trạm Ninh Bình thực tế, bạn có thể sử dụng mã vượt rào đặc biệt: <b>9999</b> hoặc mã định dạng ngày <b>DDMM</b> hôm nay.</p>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </TemplateFrame>
  );
}

function InnerBanner({ stationName }) {
  return (
    <div className="relative bg-cover bg-center w-full bg-white bg-[url(../images/background/inr-banner.jpg)] overflow-hidden sac-inner-banner">
      <div className="flex w-full lg:h-160 md:h-135 h-100 pb-10 items-baseline mx-auto">
        <div className="relative md:mt-60 mt-45 flex items-center justify-center w-full flex-col z-5">
          <div>
            <h1 className="lg:text-60 md:text-52 text-28 relative text-center">Check-in: {stationName}</h1>
          </div>
          <div>
            <ul className="inline-block">
              <li className="text-base pr-7.5 relative inline-block font-semibold text-primary after:content-['-'] after:absolute after:right-2 after:-top-1.5 after:text-primary after:text-26 after:font-normal">
                <Link href="/cua-toi">Passport của tôi</Link>
              </li>
              <li className="relative inline-block text-base font-semibold text-primary">Check-in trạm</li>
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
