"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import TemplateFrame from "./TemplateFrame";
import { getCheckins, getJourneyProgress, getActivePassport, isPassportActivated } from "../../lib/db";
import { stations } from "../../data/sac-co-do";

export default function RewardPage() {
  const [activated, setActivated] = useState(false);
  const [activeCode, setActiveCode] = useState(null);
  const [progress, setProgress] = useState({ completed: 0, total: 6, percent: 0, isCompletedAll: false });
  const [checkedinIds, setCheckedinIds] = useState([]);

  const [username, setUsername] = useState("Lữ Khách Phương Xa");
  const canvasRef = useRef(null);

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
  }, []);

  // Draw Certificate dynamically
  useEffect(() => {
    if (progress.isCompletedAll && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set resolution (HD quality 800 x 560)
      ctx.clearRect(0, 0, 800, 560);

      // 1. Draw premium background filling
      ctx.fillStyle = "#faf6ed"; // Off-white luxury background
      ctx.fillRect(0, 0, 800, 560);

      // 2. Draw border
      ctx.save();
      ctx.lineWidth = 20;
      ctx.strokeStyle = "#066168"; // Jade primary color
      ctx.strokeRect(10, 10, 780, 540);

      // Fine golden double lines
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#f4c344"; // Citrus Gold
      ctx.strokeRect(26, 26, 748, 508);
      ctx.strokeRect(32, 32, 736, 496);

      // Draw corners decorations (lotus/scroll circles)
      ctx.fillStyle = "#f4c344";
      const dots = [30, 770];
      dots.forEach((x) => {
        dots.forEach((y) => {
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // 3. Draw Title Text
      ctx.textAlign = "center";
      ctx.fillStyle = "#066168";
      ctx.font = "bold 15px 'Figtree', sans-serif";
      ctx.fillText("HÀNH TRÌNH DI SẢN NINH BÌNH", 400, 90);

      ctx.fillStyle = "#a12e2e"; // Royal crimson red
      ctx.font = "bold 32px 'Figtree', sans-serif";
      ctx.fillText("CHỨNG NHẬN VINH DANH", 400, 140);

      ctx.fillStyle = "#4a4a4a";
      ctx.font = "italic 16px 'Georgia', serif";
      ctx.fillText("Chứng nhận lữ khách hoàn thành xuất sắc hành trình:", 400, 195);

      // 4. Draw User Name (Dynamic / Cursive Font)
      ctx.fillStyle = "#066168";
      ctx.font = "bold 38px 'UTM-Azuki', 'Georgia', serif";
      ctx.fillText(username, 400, 265);

      // Golden line under username
      ctx.strokeStyle = "#f4c344";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(250, 290);
      ctx.lineTo(550, 290);
      ctx.stroke();

      // 5. Draw accomplishments summary
      ctx.fillStyle = "#4a4a4a";
      ctx.font = "14px 'Georgia', serif";
      ctx.fillText(
        "Đã hoàn thành chinh phục thành công 6/6 trạm văn hóa tâm linh Ninh Bình",
        400,
        335
      );
      ctx.fillText(
        "và đóng đầy đủ toàn bộ các dấu ấn lưu niệm vào cuốn passport Sắc Cố Đô.",
        400,
        360
      );

      // 6. Seal & Footnote
      // Watermark Passport ID
      ctx.fillStyle = "rgba(41,137,145,0.15)";
      ctx.font = "bold 20px monospace";
      ctx.fillText(`PASSPORT ID: ${activeCode}`, 400, 415);

      // Golden decorative seal (bottom-right area)
      ctx.fillStyle = "rgba(244,195,68,0.7)";
      ctx.beginPath();
      ctx.arc(620, 440, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#066168";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(620, 440, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#066168";
      ctx.font = "bold 8px sans-serif";
      ctx.fillText("SẮC CỐ ĐÔ", 620, 432);
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("DI SẢN VIỆT", 620, 445);
      ctx.font = "bold 7px sans-serif";
      ctx.fillText("HOÀN THÀNH", 620, 456);

      // Date & Sign (bottom-left area)
      ctx.fillStyle = "#4a4a4a";
      ctx.font = "13px 'Georgia', serif";
      ctx.textAlign = "left";
      ctx.fillText("Ngày cấp: " + new Date().toLocaleDateString("vi-VN"), 120, 430);
      ctx.fillText("Đại diện ban tổ chức Sắc Cố Đô", 120, 455);
      ctx.font = "bold 20px 'UTM-Azuki', cursive";
      ctx.fillStyle = "#a12e2e";
      ctx.fillText("Ban To Chuc", 120, 490);

      ctx.restore();
    }
  }, [progress.isCompletedAll, username, activeCode]);

  const handleDownloadCert = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = `sac-co-do-certificate-${activeCode}.png`;
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    }
  };

  return (
    <TemplateFrame>
      <InnerBanner />
      <section className="bg-white py-20 relative text-primary">
        <div className="container">
          {!activated ? (
            <NotActivatedView />
          ) : !progress.isCompletedAll ? (
            <MissingStationsView progress={progress} checkedinIds={checkedinIds} />
          ) : (
            <div className="grid grid-cols-12 gap-10">
              {/* Left Column: Interactive Canvas preview */}
              <div className="lg:col-span-8 col-span-12 flex flex-col items-center">
                <div className="w-full border border-primary/10 rounded-2xl overflow-hidden shadow-lg relative bg-white aspect-[800/560]">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={560}
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  onClick={handleDownloadCert}
                  className="site-button butn-bg-shape mt-6 py-3 px-8 font-bold flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-download" /> Tải chứng nhận HD (PNG)
                </button>
              </div>

              {/* Right Column: Interactive settings and rewards box */}
              <div className="lg:col-span-4 col-span-12 space-y-7.5">
                <div className="bg-lightturquoise/20 p-6.25 border border-paleaqua rounded-3xl space-y-4">
                  <h3 className="text-xl font-bold border-b border-primary/5 pb-2">
                    Tùy chỉnh chứng nhận
                  </h3>
                  <div>
                    <label htmlFor="certName" className="text-xs font-semibold uppercase text-primary/70 block mb-2">
                      Nhập họ và tên hiển thị:
                    </label>
                    <input
                      type="text"
                      id="certName"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={32}
                      className="block w-full h-12 rounded-xl border border-primary/20 px-4 text-primary bg-white outline-0 text-sm focus:border-primary duration-300 font-bold"
                    />
                  </div>
                </div>

                {/* Gift coupon box */}
                <div className="bg-amber-50/50 p-6.25 border-2 border-dashed border-citrusyellow rounded-3xl text-center space-y-4 shadow-sm">
                  <div className="size-16 bg-citrusyellow/20 text-primary rounded-full flex items-center justify-center text-3xl mx-auto animate-bounce">
                    <i className="fa-solid fa-gift" />
                  </div>
                  <div>
                    <span className="font-bold text-secondary text-lg block">Hộp Quà Số Đã Mở Khóa!</span>
                    <p className="text-xs text-primary/70 mt-1 leading-relaxed">
                      Chúc mừng bạn đã hoàn thành trọn vẹn hành trình di sản! Sắc Cố Đô xin gửi tặng bạn phần quà số:
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm text-sm">
                    Mã Voucher: <b className="text-secondary font-mono text-base tracking-wider block mt-1">SCD-NINHBINH20</b>
                    <span className="text-2xs text-primary/60 block mt-1">Giảm ngay 20% cho đơn hàng tiếp theo tại Sắc Cố Đô.</span>
                  </div>
                  <p className="text-3xs text-primary/50">
                    Vui lòng chụp ảnh màn hình lại mã này hoặc sao chép mã khi mua sắm tại cửa hàng.
                  </p>
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
    <div className="text-center py-20 max-w-135 mx-auto bg-lightturquoise/10 p-8 sm:p-12.5 rounded-3xl border border-paleaqua shadow-sm text-primary">
      <div className="size-24 bg-paleaqua/30 text-primary/40 rounded-full flex items-center justify-center text-4xl mx-auto mb-7.5 animate-pulse">
        <i className="fa-solid fa-passport" />
      </div>
      <h3 className="text-2xl font-bold mb-3.5">Chưa kích hoạt Passport!</h3>
      <p className="text-primary/75 mb-7.5 leading-relaxed">
        Để kiểm tra điều kiện nhận phần thưởng và sinh giấy chứng nhận danh giá di sản Ninh Bình, bạn vui lòng kích hoạt mã ID passport được in trên bìa sau cuốn sổ tay Sắc Cố Đô.
      </p>
      <Link href="/kich-hoat" className="site-button butn-bg-shape">
        Kích hoạt ngay
      </Link>
    </div>
  );
}

function MissingStationsView({ progress, checkedinIds }) {
  // Find which stations are missing
  const missing = stations.filter((s) => !checkedinIds.includes(s.id));

  return (
    <div className="max-w-180 mx-auto bg-lightturquoise/10 border border-paleaqua p-8 sm:p-12.5 rounded-3xl text-center shadow-md text-primary">
      <div className="size-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-5 animate-pulse">
        <i className="fa-solid fa-lock animate-bounce" />
      </div>
      <h3 className="text-3xl font-black text-amber-700 mb-2">Chưa Đủ Điều Kiện Nhận Quà</h3>
      <p className="text-primary/80 mb-7.5 text-sm max-w-140 mx-auto">
        Chứng nhận và hộp quà di sản chỉ được mở khóa khi lữ khách hoàn thành đầy đủ **6/6** trạm đóng dấu tại Ninh Bình. Tiến độ hiện tại của bạn là **{progress.completed}/{progress.total} trạm**.
      </p>

      <div className="bg-white rounded-2xl p-6 border border-primary/5 text-left mb-8.75 shadow-sm space-y-4">
        <span className="font-bold text-primary block border-b border-primary/5 pb-2">
          Các trạm di sản bạn chưa đóng dấu:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-sm">
          {missing.map((s) => (
            <div key={s.id} className="flex items-center gap-3 bg-[rgba(41,137,145,0.02)] p-3 rounded-xl border border-primary/5">
              <span className="size-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xs">
                <i className="fa-solid fa-xmark" />
              </span>
              <div>
                <span className="font-bold block">{s.name}</span>
                <span className="text-3xs text-primary/50 uppercase">{s.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 justify-center flex-wrap">
        <Link href="/cua-toi" className="site-button butn-bg-shape font-bold">
          Quay lại Dashboard kiểm tra
        </Link>
        <Link href="/hanh-trinh" className="sac-outline-button font-bold">
          Xem Bản đồ 6 trạm
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
            <h1 className="lg:text-60 md:text-52 text-28 relative">Phần Thưởng Di Sản</h1>
          </div>
          <div>
            <ul className="inline-block">
              <li className="text-base pr-7.5 relative inline-block font-semibold text-primary after:content-['-'] after:absolute after:right-2 after:-top-1.5 after:text-primary after:text-26 after:font-normal">
                <Link href="/cua-toi">Passport của tôi</Link>
              </li>
              <li className="relative inline-block text-base font-semibold text-primary">Nhận chứng nhận & Quà tặng</li>
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
