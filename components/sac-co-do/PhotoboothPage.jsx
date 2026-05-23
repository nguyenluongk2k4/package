"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import TemplateFrame from "./TemplateFrame";
import { getCheckins, isPassportActivated } from "../../lib/db";
import { stations } from "../../data/sac-co-do";

export default function PhotoboothPage() {
  const searchParams = useSearchParams();
  const stationParam = searchParams.get("station");

  const [activated, setActivated] = useState(false);
  const [checkedinIds, setCheckedinIds] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);

  const [useCamera, setUseCamera] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImg, setCapturedImg] = useState(null);
  const [frameStyle, setFrameStyle] = useState("jade"); // "jade" | "gold" | "royal"

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const isAct = isPassportActivated();
    setActivated(isAct);

    if (isAct) {
      const myCheckins = getCheckins();
      setCheckedinIds(myCheckins);

      // Determine initial station
      let initialStation = null;
      if (stationParam) {
        initialStation = stations.find((s) => s.id === stationParam && myCheckins.includes(s.id));
      }
      if (!initialStation && myCheckins.length > 0) {
        initialStation = stations.find((s) => myCheckins.includes(s.id));
      }
      setSelectedStation(initialStation);
    }
  }, [stationParam]);

  // Handle webcam stream
  const startCamera = async () => {
    if (streamRef.current) {
      stopCamera();
    }
    try {
      const constraints = {
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Lỗi truy cập camera: ", err);
      alert("Không thể truy cập camera. Vui lòng cấp quyền camera hoặc chuyển sang tải ảnh lên.");
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (useCamera && activated && selectedStation && !capturedImg) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [useCamera, activated, selectedStation, capturedImg]);

  // Capture snapshot from video
  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const size = Math.min(video.videoWidth, video.videoHeight);
      
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 640;
      tempCanvas.height = 640;
      const ctx = tempCanvas.getContext("2d");

      // Draw square crop
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 640, 640);

      setCapturedImg(tempCanvas.toDataURL("image/jpeg"));
      stopCamera();
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = 640;
          tempCanvas.height = 640;
          const ctx = tempCanvas.getContext("2d");

          // Draw square crop
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 640, 640);

          setCapturedImg(tempCanvas.toDataURL("image/jpeg"));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Render composite Canvas with borders
  useEffect(() => {
    if (capturedImg && canvasRef.current && selectedStation) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // 1. Draw base photo
        ctx.clearRect(0, 0, 640, 640);
        ctx.drawImage(img, 0, 0, 640, 640);

        // 2. Draw Cultural reactive frame (CSS Canvas recreate)
        ctx.save();

        let primaryColor = "#066168"; // Jade
        let secondaryColor = "#f4c344"; // Gold

        if (frameStyle === "jade") {
          primaryColor = "#066168";
          secondaryColor = "#f2ebd9";
        } else if (frameStyle === "gold") {
          primaryColor = "#d4af37";
          secondaryColor = "#f4c344";
        } else if (frameStyle === "royal") {
          primaryColor = "#8b0000";
          secondaryColor = "#d4af37";
        }

        // Draw solid border
        ctx.lineWidth = 24;
        ctx.strokeStyle = primaryColor;
        ctx.strokeRect(12, 12, 616, 616);

        // Draw inner double gold lines
        ctx.lineWidth = 3;
        ctx.strokeStyle = secondaryColor;
        ctx.strokeRect(28, 28, 584, 584);
        ctx.strokeRect(34, 34, 572, 572);

        // Draw Corner decorative circles
        ctx.fillStyle = secondaryColor;
        const cornerOffset = 31;
        const radius = 6;
        ctx.beginPath(); ctx.arc(cornerOffset, cornerOffset, radius, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(640 - cornerOffset, cornerOffset, radius, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cornerOffset, 640 - cornerOffset, radius, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(640 - cornerOffset, 640 - cornerOffset, radius, 0, Math.PI * 2); ctx.fill();

        // Draw station banner name overlay
        ctx.fillStyle = primaryColor;
        ctx.fillRect(160, 560, 320, 52);
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(165, 565, 310, 42);

        // Text title
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px 'Figtree', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`SẮC CỐ ĐÔ • ${selectedStation.name.toUpperCase()}`, 320, 586);

        // Draw cultural stamp
        ctx.fillStyle = "rgba(244,195,68,0.85)";
        ctx.beginPath();
        ctx.arc(540, 100, 38, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(6,97,104,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(540, 100, 33, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(6,97,104,0.9)";
        ctx.font = "9px 'Figtree', sans-serif";
        ctx.fillText("CHECK-IN", 540, 90);
        ctx.font = "bold 12px 'UTM-Azuki', cursive";
        ctx.fillText(selectedStation.name, 540, 102);
        ctx.font = "8px 'Figtree', sans-serif";
        ctx.fillText("PASSPORT", 540, 114);

        ctx.restore();
      };
      img.src = capturedImg;
    }
  }, [capturedImg, selectedStation, frameStyle]);

  const handleDownload = () => {
    if (canvasRef.current && selectedStation) {
      const link = document.createElement("a");
      link.download = `sac-co-do-photobooth-${selectedStation.id}.jpg`;
      link.href = canvasRef.current.toDataURL("image/jpeg", 0.9);
      link.click();
    }
  };

  const handleShare = () => {
    alert("Sao chép liên kết hình ảnh vào clipboard thành công! Hãy chia sẻ tấm ảnh này lên Facebook hoặc Instagram kèm hashtag #SacCoDo #NinhBinh nhé.");
  };

  return (
    <TemplateFrame>
      <InnerBanner />
      <section className="bg-white py-20 relative text-primary">
        <div className="container">
          {!activated ? (
            <NotActivatedView />
          ) : checkedinIds.length === 0 ? (
            <NoCheckinsView />
          ) : (
            <div className="grid grid-cols-12 gap-10">
              {/* Left Column: Photobooth Camera & Canvas view */}
              <div className="lg:col-span-7 col-span-12 flex flex-col items-center">
                <div className="w-full max-w-140 aspect-square rounded-3xl overflow-hidden border border-primary/10 shadow-lg relative bg-black flex items-center justify-center">
                  {!capturedImg ? (
                    useCamera ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="size-full object-cover scale-x-[-1]"
                        />
                        {cameraActive && (
                          <button
                            onClick={capturePhoto}
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-citrusyellow text-primary font-black size-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-lg hover:scale-105 duration-300 z-20 cursor-pointer"
                            aria-label="Chụp ảnh"
                          >
                            <i className="fa-solid fa-camera" />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-10 text-white/60 space-y-4">
                        <i className="fa-solid fa-cloud-arrow-up text-5xl text-citrusyellow" />
                        <h4 className="text-lg font-bold">Tải ảnh của bạn lên</h4>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload-input"
                        />
                        <label
                          htmlFor="file-upload-input"
                          className="site-button butn-bg-shape py-2 px-5 inline-block cursor-pointer font-bold !text-primary"
                        >
                          Chọn tệp ảnh
                        </label>
                      </div>
                    )
                  ) : (
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={640}
                      className="size-full object-contain"
                    />
                  )}
                </div>

                {/* Actions below screen */}
                <div className="w-full max-w-140 flex gap-4 mt-5 flex-wrap">
                  {capturedImg ? (
                    <>
                      <button
                        onClick={() => setCapturedImg(null)}
                        className="sac-outline-button flex-1 py-3 font-bold"
                      >
                        Chụp lại
                      </button>
                      <button
                        onClick={handleDownload}
                        className="site-button butn-bg-shape flex-1 py-3 font-bold flex items-center justify-center gap-1.5"
                      >
                        <i className="fa-solid fa-download" /> Tải về máy
                      </button>
                      <button
                        onClick={handleShare}
                        className="site-button butn-bg-shape py-3 px-4 font-bold flex items-center justify-center"
                        title="Chia sẻ"
                      >
                        <i className="fa-solid fa-share-nodes" />
                      </button>
                    </>
                  ) : (
                    <div className="flex w-full justify-between items-center gap-4">
                      <span className="text-sm font-semibold">Nguồn ảnh:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setUseCamera(true)}
                          className={`px-4 py-2 text-xs font-bold rounded-full border duration-300 ${
                            useCamera ? "bg-primary text-white border-primary" : "border-primary/10 hover:bg-paleaqua/30"
                          }`}
                        >
                          Sử dụng Camera
                        </button>
                        <button
                          onClick={() => setUseCamera(false)}
                          className={`px-4 py-2 text-xs font-bold rounded-full border duration-300 ${
                            !useCamera ? "bg-primary text-white border-primary" : "border-primary/10 hover:bg-paleaqua/30"
                          }`}
                        >
                          Tải ảnh lên
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Settings & Stations filter */}
              <div className="lg:col-span-5 col-span-12 space-y-7.5">
                <div className="bg-lightturquoise/20 p-6.25 border border-paleaqua rounded-3xl">
                  <h3 className="text-xl font-bold mb-4 border-b border-primary/5 pb-2">
                    1. Chọn trạm văn hóa Ninh Bình:
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {stations.map((s) => {
                      const isUnlocked = checkedinIds.includes(s.id);
                      const isSelected = selectedStation?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          disabled={!isUnlocked}
                          onClick={() => {
                            setSelectedStation(s);
                            setCapturedImg(null);
                          }}
                          className={`p-3 text-sm rounded-xl font-bold border flex flex-col items-center gap-1.5 duration-300 ${
                            isSelected
                              ? "border-primary bg-white shadow-sm"
                              : isUnlocked
                              ? "border-primary/10 bg-white/40 hover:border-primary/30"
                              : "border-primary/5 bg-gray-100 text-primary/30 cursor-not-allowed grayscale"
                          }`}
                        >
                          <span className="text-xs uppercase">{s.tag}</span>
                          <span className="text-center line-clamp-1">{s.name}</span>
                          {!isUnlocked && (
                            <span className="text-[10px] text-red-500 font-bold">
                              <i className="fa-solid fa-lock" /> Khóa
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {capturedImg && (
                  <div className="bg-lightturquoise/20 p-6.25 border border-paleaqua rounded-3xl animate-fade-in">
                    <h3 className="text-xl font-bold mb-4 border-b border-primary/5 pb-2">
                      2. Chọn phong cách khung viền:
                    </h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setFrameStyle("jade")}
                        className={`flex-1 p-3 text-xs font-bold rounded-xl border text-center duration-300 ${
                          frameStyle === "jade" ? "border-primary bg-white shadow-sm font-black" : "border-primary/10 hover:border-primary/30"
                        }`}
                      >
                        Cố đô Cổ Kính (Xanh ngọc)
                      </button>
                      <button
                        onClick={() => setFrameStyle("gold")}
                        className={`flex-1 p-3 text-xs font-bold rounded-xl border text-center duration-300 ${
                          frameStyle === "gold" ? "border-primary bg-white shadow-sm font-black" : "border-primary/10 hover:border-primary/30"
                        }`}
                      >
                        Sắc Vàng Hoàng Hôn
                      </button>
                      <button
                        onClick={() => setFrameStyle("royal")}
                        className={`flex-1 p-3 text-xs font-bold rounded-xl border text-center duration-300 ${
                          frameStyle === "royal" ? "border-primary bg-white shadow-sm font-black" : "border-primary/10 hover:border-primary/30"
                        }`}
                      >
                        Kinh Đô Triều Đại (Đỏ)
                      </button>
                    </div>
                  </div>
                )}
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
        Để sử dụng photobooth di sản Ninh Bình ghép khung lưu niệm, bạn vui lòng kích hoạt mã ID passport được in trên bìa sau cuốn sổ tay Sắc Cố Đô.
      </p>
      <Link href="/kich-hoat" className="site-button butn-bg-shape">
        Kích hoạt ngay
      </Link>
    </div>
  );
}

function NoCheckinsView() {
  return (
    <div className="text-center py-20 max-w-135 mx-auto bg-lightturquoise/10 p-8 sm:p-12.5 rounded-3xl border border-paleaqua shadow-sm">
      <div className="size-24 bg-paleaqua/30 text-primary/40 rounded-full flex items-center justify-center text-4xl mx-auto mb-7.5 animate-pulse">
        <i className="fa-solid fa-map-location-dot" />
      </div>
      <h3 className="text-2xl font-bold mb-3.5">Chưa check-in trạm nào!</h3>
      <p className="text-primary/75 mb-7.5 leading-relaxed">
        Hiện tại bạn chưa thực hiện check-in thành công tại trạm di sản nào trong số 6 trạm Ninh Bình. Vui lòng check-in ít nhất 1 trạm để mở khóa khung ảnh photobooth tương ứng.
      </p>
      <div className="flex gap-4 justify-center flex-wrap">
        <Link href="/hanh-trinh" className="site-button butn-bg-shape">
          Xem 6 Trạm trên bản đồ
        </Link>
        <Link href="/cua-toi" className="sac-outline-button">
          Xem Dashboard của tôi
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
            <h1 className="lg:text-60 md:text-52 text-28 relative">Photobooth Di Sản</h1>
          </div>
          <div>
            <ul className="inline-block">
              <li className="text-base pr-7.5 relative inline-block font-semibold text-primary after:content-['-'] after:absolute after:right-2 after:-top-1.5 after:text-primary after:text-26 after:font-normal">
                <Link href="/cua-toi">Passport của tôi</Link>
              </li>
              <li className="relative inline-block text-base font-semibold text-primary">Ghép khung hình Ninh Bình</li>
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
