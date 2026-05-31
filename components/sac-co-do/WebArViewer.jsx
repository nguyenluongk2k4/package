"use client";

import React, { useEffect, useRef, useState } from "react";

const AR_MODEL_SRC = "/ar/sac-co-do-guide.glb";
const AR_IOS_MODEL_SRC = "/ar/sac-co-do-guide.usdz";

// Định nghĩa thông tin thuyết minh và âm thanh cho từng trạm
const STATION_GUIDES = {
  "trang-an": {
    name: "Khu du lịch sinh thái Tràng An",
    voiceText: "Chào mừng bạn đến với Quần thể di sản thế giới Tràng An! Tôi là hướng dẫn viên ảo của bạn. Nơi đây là sự hòa quyện tuyệt mỹ giữa những dòng sông xanh biếc uốn lượn, những hang động xuyên thủy kỳ bí và những vách núi đá vôi dựng đứng ngàn năm. Hãy chạm vào tôi để ngắm cuốn sổ passport Sắc Cố Đô trên tay tôi, và bấm nút Đóng dấu ngay phía dưới để ghi lại dấu mộc Tràng An xinh đẹp này vào cuốn sổ của bạn nhé!",
    stampName: "Dấu sóng đá vôi",
    subtitles: [
      { time: 0, text: "👋 Xin chào! Chào mừng bạn đến với Khu di sản thế giới Tràng An!" },
      { time: 5000, text: "🚣 Nơi đây nổi tiếng với dòng sông xanh biếc và hang động xuyên thủy kỳ bí." },
      { time: 11000, text: "📖 Tôi đang cầm trên tay cuốn sổ passport Sắc Cố Đô - sản phẩm du lịch Ninh Bình." },
      { time: 17000, text: "✨ Hãy chạm vào tôi để xoay ngắm, và nhấn 'Đóng dấu ngay' để check-in nhé!" }
    ]
  },
  "hoa-lu": {
    name: "Cố Đô Hoa Lư",
    voiceText: "Kính chào du khách đã đến với Cố đô Hoa Lư - kinh đô đầu tiên của nhà nước phong kiến trung ương tập quyền Việt Nam! Nơi đây hơn một ngàn năm trước đã ghi dấu triều đại Đinh, Lê, Lý lẫy lừng cát cứ. Hãy cùng tôi chiêm ngưỡng đền thờ vua Đinh, vua Lê cổ kính, và đừng quên ấn Đóng dấu cổng thành trên cuốn passport Sắc Cố Đô để mở khóa hành trình lịch sử của bạn nào!",
    stampName: "Dấu cổng thành",
    subtitles: [
      { time: 0, text: "🏯 Kính chào du khách đã đến với vùng đất di tích lịch sử Cố đô Hoa Lư!" },
      { time: 5000, text: "👑 Nơi đây hơn 1000 năm trước là kinh đô lẫy lừng của triều Đinh, Lê, Lý." },
      { time: 11000, text: "📖 Cuốn sổ Sắc Cố Đô sẽ giúp bạn lưu giữ cột mốc lịch sử hào hùng này." },
      { time: 17000, text: "🔴 Hãy chạm vào tôi để tương tác và nhấn 'Đóng dấu ngay' phía dưới nhé!" }
    ]
  },
  "bai-dinh": {
    name: "Chùa Bái Đính",
    voiceText: "Chào mừng bạn đến với Chùa Bái Đính - quần thể chùa lớn sở hữu nhiều kỷ lục châu Á và Việt Nam! Hãy lắng nghe tiếng chuông đồng vang vọng giữa thung lũng đá vôi thanh tịnh, cảm nhận sự an yên trong tâm hồn. Tôi đang cầm cuốn sổ passport Sắc Cố Đô linh thiêng, hãy cùng tôi đóng chiếc dấu mộc chuông đồng may mắn này vào hành trình tâm linh của bạn.",
    stampName: "Dấu chuông đồng",
    subtitles: [
      { time: 0, text: "🌸 Chào mừng bạn đến với đại danh thắng tâm linh Chùa Bái Đính!" },
      { time: 5000, text: "🔔 Hãy cùng lắng nghe tiếng chuông đồng thanh tịnh giữa thung lũng đá." },
      { time: 11000, text: "📖 Cuốn sổ Sắc Cố Đô trên tay tôi đã sẵn sàng đón nhận dấu ấn bình an." },
      { time: 17000, text: "✨ Hãy nhấn 'Đóng dấu ngay' để ghi nhận dấu mộc tâm linh cát tường này nhé!" }
    ]
  },
  "pho-co-hoa-lu": {
    name: "Phố Cổ Hoa Lư",
    voiceText: "Chào mừng bạn đến với không gian lung linh của Phố Cổ Hoa Lư về đêm! Những sắc màu đèn lồng rực rỡ soi bóng xuống hồ Kỳ Lân cổ kính, những gian hàng làng nghề truyền thống mang đậm nét xưa. Hãy cầm cuốn sổ passport Sắc Cố Đô trên tay, chạm vào tôi để thưởng ngoạn vẻ đẹp lãng mạn này và đóng dấu mộc đèn phố lung linh kỷ niệm nhé!",
    stampName: "Dấu đèn phố",
    subtitles: [
      { time: 0, text: "🏮 Chào mừng bạn đến với không gian lung linh của Phố Cổ Hoa Lư!" },
      { time: 5000, text: "✨ Sắc đèn lồng rực rỡ và nhịp dạo chơi chậm rãi sẽ khiến bạn say đắm." },
      { time: 11000, text: "📖 Đừng quên ghi lại khoảnh khắc lãng mạn này vào cuốn passport Sắc Cố Đô." },
      { time: 17000, text: "📸 Chạm vào tôi để xoay nhân vật và nhấn 'Đóng dấu ngay' để lưu niệm!" }
    ]
  },
  "tam-coc": {
    name: "Tam Cốc - Bích Động",
    voiceText: "Chào mừng du khách đến với Tam Cốc Bích Động, nơi được mệnh danh là Nam thiên đệ nhị động! Hãy tưởng tượng bạn đang ngồi trên con thuyền nhỏ uốn lượn dọc theo dòng sông Ngô Đồng, xuyên qua ba hang động tự nhiên bên dưới những cánh đồng lúa chín vàng ươm. Hãy cùng tôi lưu giữ nét mềm mại nên thơ này bằng dấu thuyền lúa đỏ thắm trên cuốn sổ Sắc Cố Đô nhé!",
    stampName: "Dấu thuyền lúa",
    subtitles: [
      { time: 0, text: "🌾 Chào mừng bạn đến với Nam thiên đệ nhị động Tam Cốc - Bích Động!" },
      { time: 5000, text: "🚣 Dòng sông Ngô Đồng uốn lượn xuyên qua những hang động lúa chín vàng." },
      { time: 11000, text: "📖 Cuốn sổ Sắc Cố Đô cầm sản phẩm sẽ ghi lại hành trình sơn thủy hữu tình này." },
      { time: 17000, text: "🛶 Hãy nhấn nút 'Đóng dấu ngay' bên dưới để nhận dấu thuyền lúa đỏ thắm nhé!" }
    ]
  },
  "hang-mua": {
    name: "Đỉnh Hang Múa",
    voiceText: "Chúc mừng bạn đã chinh phục gần năm trăm bậc đá để đến với đỉnh Hang Múa - nơi ngắm trọn vẹn vẻ đẹp thung lũng lúa Tam Cốc từ trên cao! Phía sau tôi chính là tượng rồng khổng lồ uốn lượn trên đỉnh núi nhấp nhô. Hãy cùng tôi đóng con dấu long đỉnh quyền lực cuối cùng để hoàn thành xuất sắc cuốn sổ passport Sắc Cố Đô của bạn ngay bây giờ nào!",
    stampName: "Dấu long đỉnh",
    subtitles: [
      { time: 0, text: "🧗 Chúc mừng bạn đã chinh phục thành công đỉnh núi Hang Múa kỳ vĩ!" },
      { time: 5000, text: "🐉 Từ đây, bạn có thể ngắm trọn rồng khổng lồ uốn lượn trên đỉnh núi nhấp nhô." },
      { time: 11000, text: "🏆 Đây là trạm đóng dấu long đỉnh quyền lực để hoàn thành cuốn passport." },
      { time: 17000, text: "👑 Chạm vào tôi để tương tác và nhấn 'Đóng dấu ngay' để hoàn thành hành trình!" }
    ]
  }
};

export default function WebArViewer({ stationId, onClose, onCheckinSuccess }) {
  const guide = STATION_GUIDES[stationId] || STATION_GUIDES["trang-an"];
  const videoRef = useRef(null);
  const modelViewerRef = useRef(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isMutedMusic, setIsMutedMusic] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [modelAnimation, setModelAnimation] = useState("Idle");
  const [showStampEffect, setShowStampEffect] = useState(false);
  const [checkinComplete, setCheckinComplete] = useState(false);
  const [arStatus, setArStatus] = useState("idle");
  const [modelLoadFailed, setModelLoadFailed] = useState(false);
  const [isSecureBrowserContext, setIsSecureBrowserContext] = useState(true);
  const synthRef = useRef(null);
  const voiceUtteranceRef = useRef(null);
  const musicAudioRef = useRef(null);
  const cancelIntentionalRef = useRef(false);

  // 1. Khởi động Camera điện thoại làm nền
  useEffect(() => {
    let stream = null;
    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Trình duyệt không hỗ trợ truy cập Camera.");
        }
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // Ưu tiên camera sau
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCameraPermission(true);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setHasCameraPermission(false);
        setErrorMessage("Không thể mở Camera sau. Hệ thống sẽ tự động chuyển sang chế độ AR giả lập (Camera ảo 3D).");
      }
    }

    startCamera();

    // Khởi tạo Text to Speech
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      setIsSecureBrowserContext(window.isSecureContext);
    }

    // Nhạc nền sáo trúc Ninh Bình êm dịu (CDN nhẹ nhàng)
    musicAudioRef.current = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"); // Thay thế bằng nhạc sáo trúc nhẹ
    musicAudioRef.current.loop = true;
    musicAudioRef.current.volume = 0.15; // Âm lượng nhỏ làm nền

    return () => {
      // Cleanup camera stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      // Stop speech
      if (synthRef.current) {
        try { cancelIntentionalRef.current = true; synthRef.current.cancel() } catch (_) {};
      }
      // Stop music
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const handleArStatus = (event) => {
      setArStatus(event.detail?.status || "idle");
    };
    const handleLoad = () => setModelLoadFailed(false);
    const handleError = () => setModelLoadFailed(true);

    viewer.addEventListener("ar-status", handleArStatus);
    viewer.addEventListener("load", handleLoad);
    viewer.addEventListener("error", handleError);

    return () => {
      viewer.removeEventListener("ar-status", handleArStatus);
      viewer.removeEventListener("load", handleLoad);
      viewer.removeEventListener("error", handleError);
    };
  }, []);

  // 2. Xử lý giọng nói thuyết minh đồng bộ với phụ đề và cử chỉ nhân vật 3D
  const startSpeech = () => {
    if (!synthRef.current) return;

    // Hủy giọng nói cũ nếu đang phát
    try { cancelIntentionalRef.current = true; synthRef.current.cancel() } catch (_) {};

    // Phát nhạc nền
    if (musicAudioRef.current && !isMutedMusic) {
      musicAudioRef.current.play().catch(e => console.log("Music play blocked:", e));
    }

    const utterance = new SpeechSynthesisUtterance(guide.voiceText);
    utterance.lang = "vi-VN";
    utterance.rate = 0.95; // Giọng đọc thong thả truyền cảm
    utterance.pitch = 1.05; // Cao độ nhẹ nhàng ấm áp

    // Thay đổi animation của Robot 3D khi bắt đầu nói
    utterance.onstart = () => {
      setIsPlayingVoice(true);
      setModelAnimation("Wave"); // Robot vẫy tay chào khi mở đầu
      
      // Chuyển sang cử chỉ gật đầu biểu cảm nói chuyện sau 3 giây vẫy tay
      setTimeout(() => {
        if (synthRef.current.speaking) {
          setModelAnimation("Yes"); // Cử chỉ đồng ý/nói chuyện gật đầu
        }
      }, 3000);
    };

    utterance.onend = () => {
      setIsPlayingVoice(false);
      setModelAnimation("Idle"); // Quay lại trạng thái đứng im thở
      setCurrentSubtitle("✨ Hãy chạm vào nhân vật để xoay và khám phá!");
    };

    utterance.onerror = (e) => {
      if (!cancelIntentionalRef.current) { console.error("SpeechSynthesis error:", e) }
      cancelIntentionalRef.current = false;
      setIsPlayingVoice(false);
      setModelAnimation("Idle");
    };

    voiceUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);

    // Chạy phụ đề theo dòng thời gian đồng bộ
    guide.subtitles.forEach((sub) => {
      setTimeout(() => {
        if (synthRef.current.speaking) {
          setCurrentSubtitle(sub.text);
          // Robot phản ứng đổi động tác theo nội dung nói
          if (sub.text.includes("Sắc Cố Đô")) {
            setModelAnimation("Sitting"); // Robot cúi xuống chỉ tay vào sản phẩm
          } else if (sub.text.includes("Đóng dấu ngay")) {
            setModelAnimation("ThumbsUp"); // Robot giơ ngón tay cái khích lệ
          }
        }
      }, sub.time);
    });
  };

  // Tắt/Mở âm thanh nền
  const toggleMusic = () => {
    if (musicAudioRef.current) {
      if (isMutedMusic) {
        musicAudioRef.current.play().catch(e => console.log(e));
        setIsMutedMusic(false);
      } else {
        musicAudioRef.current.pause();
        setIsMutedMusic(true);
      }
    }
  };

  // 3. Thực hiện Đóng dấu Check-in (Đóng dấu Passport số)
  const launchNativeAr = async () => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setIsSecureBrowserContext(false);
      setArStatus("failed");
      setErrorMessage("AR track mặt đất cần HTTPS. Link http://172.x.x.x:3000 chỉ xem preview, trình duyệt điện thoại sẽ chặn camera/AR thật.");
      return;
    }

    const viewer = modelViewerRef.current;
    if (!viewer || typeof viewer.activateAR !== "function") {
      setArStatus("unsupported");
      setErrorMessage("Thiết bị hoặc trình duyệt chưa hỗ trợ WebAR đặt nhân vật xuống nền. Bạn vẫn có thể dùng chế độ xem 3D mô phỏng trên camera.");
      return;
    }

    try {
      setArStatus("launching");
      await viewer.activateAR();
      if (!isPlayingVoice) {
        startSpeech();
      }
    } catch (err) {
      console.error("Native AR launch error:", err);
      setArStatus("failed");
      setErrorMessage("Không mở được chế độ AR thật. Hãy thử Chrome Android/Safari iOS hoặc tiếp tục xem mô phỏng trên camera.");
    }
  };

  const handleCheckin = () => {
    // Stop speaking
    if (synthRef.current) {
      try { cancelIntentionalRef.current = true; synthRef.current.cancel() } catch (_) {};
    }
    
    // Robot nhảy múa ăn mừng (Dance!)
    setModelAnimation("Dance");
    setIsPlayingVoice(false);
    setCurrentSubtitle("🎉 Tuyệt vời! Bạn đang nhận dấu mộc Sắc Cố Đô...");
    setShowStampEffect(true);

    // Phát âm thanh tiếng đóng dấu gỗ "cộp" một phát cực kỳ giòn giã!
    const stampSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2012/2012-84.wav"); // Âm thanh tiếng búa/cộc
    stampSound.play().catch(e => console.log(e));

    setTimeout(() => {
      setCheckinComplete(true);
      
      // Kích hoạt pháo hoa chúc mừng nếu có
      if (typeof window !== "undefined") {
        // Tải thư viện pháo hoa canvas-confetti động
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
        script.onload = () => {
          window.confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
        };
        document.body.appendChild(script);
      }

      // Lưu trạng thái vào LocalStorage để đồng bộ Passport
      const visitedStations = JSON.parse(localStorage.getItem("scd_visited_stations") || "[]");
      if (!visitedStations.includes(stationId)) {
        visitedStations.push(stationId);
        localStorage.setItem("scd_visited_stations", JSON.stringify(visitedStations));
      }

      // Thông báo thành công ra trang ngoài sau 3 giây
      setTimeout(() => {
        if (onCheckinSuccess) {
          onCheckinSuccess(stationId);
        }
      }, 2500);

    }, 1500);
  };

  return (
    <div className="webar-shell">
      

      {/* 1. LAYER CAMERA NỀN (FULL SCREEN VIDEO) */}
      <div className="webar-camera-layer">
        {hasCameraPermission !== false ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="webar-camera-video"
          />
        ) : (
          // Khung cảnh 3D/Giả lập Ninh Bình hùng vĩ làm nền nếu không có Camera
          <div 
            className="webar-camera-fallback"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1627483262112-039e9a0a4031?auto=format&fit=crop&w=1200&q=80')` }}
          />
        )}
        
        {/* Lớp phủ chuyển màu tạo chiều sâu điện ảnh */}
        <div className="webar-camera-vignette" />
      </div>

      {/* 2. LAYER 3D MODEL VIEWER (NHÂN VẬT 3D TRONG SUỐT NỔI TRÊN CAMERA) */}
      <div className="webar-stage">
        <model-viewer
          ref={modelViewerRef}
          src={AR_MODEL_SRC}
          ios-src={AR_IOS_MODEL_SRC}
          alt="AR 3D Tour Guide"
          ar-modes="webxr scene-viewer quick-look"
          ar
          ar-placement="floor"
          ar-scale="fixed"
          camera-controls
          disable-zoom
          shadow-intensity="1.5"
          shadow-softness="0.8"
          exposure="1.2"
          autoplay
          animation-name={modelAnimation}
          className="webar-model"
          style={{ "--poster-color": "transparent" }}
        >
          {/* Sổ tay passport Ninh Bình (sản phẩm) 3D mô phỏng treo trước ngực Robot */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs flex items-center gap-1.5 border border-white/20 shadow-lg pointer-events-none animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            🤖 Đang cầm: Passport Sắc Cố Đô
          </div>
        </model-viewer>
      </div>

      {/* 3. GIAO DIỆN TƯƠNG TÁC ĐÈ LÊN CAMERA (UI LAYER - Z-20) */}
      
      {/* Header Bar */}
      <header className="webar-header w-full px-6 py-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600 border border-amber-400 flex items-center justify-center font-bold text-lg shadow-lg shadow-red-600/30 text-amber-100 animate-bounce">
            AR
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-amber-200 uppercase">Sắc Cố Đô - WebAR</h1>
            <p className="text-xs text-neutral-300 font-light truncate max-w-[200px]">{guide.name}</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-xl hover:bg-red-600 transition-colors shadow-md backdrop-blur-sm active:scale-95"
        >
          ✕
        </button>
      </header>

      {/* Center Toast Warning if virtual camera */}
      {hasCameraPermission === false && (
        <div className="z-20 max-w-[85%] bg-amber-500/90 text-neutral-900 text-xs px-4 py-2.5 rounded-xl text-center font-medium shadow-xl border border-amber-300 mx-6 animate-pulse">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Footer Area: Subtitles, Voice Trigger & Checkin Buttons */}
      <footer className="webar-panel w-full px-6 pb-8 flex flex-col items-center gap-5 z-20 bg-gradient-to-t from-black/90 to-transparent pt-10">
        
        {/* Bong bóng phụ đề / Thoại của hướng dẫn viên */}
        <div className="webar-caption w-full max-w-md bg-black/60 border border-amber-500/30 backdrop-blur-md px-5 py-4 rounded-2xl shadow-2xl flex flex-col gap-2 min-h-[90px] justify-center transition-all duration-300">
          {currentSubtitle ? (
            <p className="text-sm text-neutral-100 text-center leading-relaxed font-medium transition-all duration-300">
              {currentSubtitle}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-xs text-amber-300 font-semibold tracking-wider uppercase animate-pulse">Trải nghiệm âm thanh sinh động</p>
              <p className="text-xs text-neutral-400 text-center">Bấm nút Micro để hướng dẫn viên 3D thuyết minh nhé!</p>
            </div>
          )}
        </div>

        {/* Bàn điều khiển chính */}
        <div className="webar-ar-card w-full max-w-md space-y-2">
          <button
            onClick={launchNativeAr}
            disabled={modelLoadFailed || arStatus === "launching"}
            className={`webar-primary-action w-full min-h-14 rounded-2xl border px-5 text-sm font-bold uppercase tracking-wider shadow-xl transition-all active:scale-95 ${
              modelLoadFailed
                ? "cursor-not-allowed border-white/10 bg-white/10 text-neutral-400"
                : "border-cyan-300/40 bg-cyan-500 text-neutral-950 shadow-cyan-900/30 hover:bg-cyan-300"
            }`}
          >
            {arStatus === "launching" ? "Đang mở AR..." : "Mở AR thật để track mặt đất"}
          </button>
          <p className="text-center text-[11px] leading-relaxed text-neutral-300">
            Preview trong trang chỉ để xem model. Muốn nhân vật bám dưới đất, hãy mở AR thật trên điện thoại qua HTTPS rồi lia camera xuống nền phẳng.
          </p>
          {modelLoadFailed && (
            <p className="rounded-xl border border-red-400/30 bg-red-950/70 px-3 py-2 text-center text-xs text-red-100">
              Chưa tìm thấy file GLB. Hãy đặt model vào public/ar/sac-co-do-guide.glb.
            </p>
          )}
          {(arStatus === "unsupported" || arStatus === "failed") && errorMessage && (
            <p className="rounded-xl border border-amber-400/30 bg-amber-950/70 px-3 py-2 text-center text-xs text-amber-100">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="webar-controls w-full max-w-md flex items-center justify-center gap-5">
          
          {/* Nút bật/tắt nhạc sáo trúc nền */}
          <button
            onClick={toggleMusic}
            className={`w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-lg backdrop-blur-md shadow-lg transition-all active:scale-95 ${
              isMutedMusic ? "bg-black/40 text-neutral-400" : "bg-amber-600/30 text-amber-300 border-amber-400/40"
            }`}
            title="Tắt/mở nhạc nền"
          >
            {isMutedMusic ? "🔇" : "🎵"}
          </button>

          {/* Nút bấm để nói (Voice Guide Trigger) */}
          <button
            onClick={startSpeech}
            className={`webar-voice-action flex-1 max-w-[200px] h-14 rounded-full font-semibold text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 border transition-all active:scale-95 ${
              isPlayingVoice
                ? "bg-amber-500 border-amber-400 text-black animate-pulse"
                : "bg-red-600 hover:bg-red-500 border-red-500 text-white shadow-red-700/20"
            }`}
          >
            <span className="text-lg">{isPlayingVoice ? "🔊" : "🎙️"}</span>
            {isPlayingVoice ? "Đang thuyết minh..." : "Phát Thuyết Minh"}
          </button>

          {/* Nút bấm Đóng dấu Passport */}
          <button
            onClick={handleCheckin}
            disabled={checkinComplete}
            className={`w-12 h-12 rounded-full border flex items-center justify-center text-lg backdrop-blur-md shadow-lg transition-all active:scale-95 ${
              checkinComplete
                ? "bg-green-600/80 border-green-500 text-white cursor-not-allowed"
                : "bg-red-600 border-red-500 text-white hover:bg-red-500 shadow-red-700/20"
            }`}
            title="Đóng dấu check-in"
          >
            {checkinComplete ? "✓" : "💮"}
          </button>
        </div>

        {/* Nút bấm hành động to Đóng dấu Passport chính thức */}
        {!checkinComplete && (
          <button
            onClick={handleCheckin}
            className="webar-stamp-action w-full max-w-xs h-12 rounded-xl bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-bold text-sm tracking-widest uppercase shadow-lg shadow-red-700/30 border border-amber-400/30 flex items-center justify-center gap-2 active:scale-98"
          >
            💮 ĐÓNG DẤU PASSPORT SỐ
          </button>
        )}

        {/* Ký hiệu copyright */}
        <p className="text-[10px] text-neutral-500 font-light select-none">
          Sắc Cố Đô WebAR © 2026 Ninh Binh Experience.
        </p>
      </footer>

      {/* 4. HIỆU ỨNG ĐÓNG DẤU ĐỎ CHÓT (STAMP OVERLAY EFFECT) */}
      {showStampEffect && (
        <div className="absolute inset-0 bg-black/75 z-40 flex flex-col items-center justify-center animate-fade-in pointer-events-none">
          <div className="relative flex flex-col items-center gap-6 animate-scale-up">
            
            {/* Vòng tròn con dấu đỏ */}
            <div className="w-40 h-40 rounded-full border-[6px] border-red-600 flex flex-col items-center justify-center text-red-600 font-extrabold uppercase tracking-widest bg-amber-50/5 p-4 shadow-2xl shadow-red-600/30 border-dashed animate-pulse">
              <span className="text-xs text-red-500 font-semibold tracking-normal">Sắc Cố Đô</span>
              <div className="w-full h-[3px] bg-red-600 my-1"></div>
              <span className="text-center text-sm leading-tight max-w-[120px]">{guide.stampName}</span>
              <div className="w-full h-[3px] bg-red-600 my-1"></div>
              <span className="text-[10px] text-red-500">ĐÃ CHECK-IN</span>
            </div>

            {/* Chữ chúc mừng */}
            <div className="text-center text-white">
              <h2 className="text-2xl font-bold tracking-wide text-amber-200">Đóng Dấu Thành Công!</h2>
              <p className="text-xs text-neutral-300 mt-1">Hành trình của bạn đã được ghi dấu ấn cố đô.</p>
            </div>
          </div>
        </div>
      )}

      {/* Thêm CSS Keyframe Animations cục bộ */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .webar-shell {
          position: fixed;
          inset: 0;
          z-index: 9999;
          overflow: hidden;
          min-width: 100vw;
          min-height: 100dvh;
          background: #000;
          color: #fff;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          user-select: none;
          touch-action: none;
        }
        .webar-camera-layer {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background: #111827;
        }
        .webar-camera-video,
        .webar-camera-fallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .webar-camera-video {
          opacity: 0.94;
          transform: scaleX(-1);
        }
        .webar-camera-fallback {
          background-position: center;
          background-size: cover;
          opacity: 0.72;
          filter: blur(1px);
        }
        .webar-camera-vignette {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            radial-gradient(circle at 50% 42%, transparent 0 34%, rgba(0, 0, 0, 0.18) 58%, rgba(0, 0, 0, 0.68) 100%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.68), transparent 24%, transparent 52%, rgba(0, 0, 0, 0.86));
        }
        .webar-stage {
          position: absolute;
          left: 0;
          right: 0;
          top: 72px;
          bottom: 278px;
          z-index: 10;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          pointer-events: none;
        }
        .webar-model {
          display: block;
          width: min(92vw, 620px);
          height: min(58vh, 520px) !important;
          max-height: 100%;
          background: transparent;
          pointer-events: auto;
          --poster-color: transparent;
        }
        .webar-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 72px;
          padding-block: 14px;
          padding-inline: clamp(16px, 4vw, 28px);
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.78), transparent);
        }
        .webar-header > div:first-child {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .webar-header h1,
        .webar-header p {
          margin: 0;
        }
        .webar-header h1 {
          color: #fde68a;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .webar-header p {
          max-width: min(58vw, 280px);
          overflow: hidden;
          color: rgba(255, 255, 255, 0.78);
          font-size: 12px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .webar-header button {
          width: 42px;
          height: 42px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.52);
          color: #fff;
          font-size: 22px;
        }
        .webar-panel {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 30;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 18px clamp(14px, 4vw, 24px) max(16px, env(safe-area-inset-bottom));
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          background: linear-gradient(180deg, rgba(6, 8, 13, 0) 0%, rgba(6, 8, 13, 0.84) 18%, rgba(6, 8, 13, 0.98) 100%) !important;
        }
        .webar-caption,
        .webar-ar-card {
          width: min(100%, 520px);
          max-width: 520px;
          border-radius: 18px;
        }
        .webar-caption {
          min-height: 64px;
          padding: 12px 16px;
        }
        .webar-caption p {
          font-size: 13px;
          line-height: 1.45;
        }
        .webar-ar-card {
          padding: 12px;
          border: 1px solid rgba(125, 211, 252, 0.22);
          background: rgba(8, 20, 28, 0.72);
          backdrop-filter: blur(16px);
        }
        .webar-primary-action {
          min-height: 58px;
          border-radius: 16px;
          font-size: 13px;
          letter-spacing: 0.04em;
        }
        .webar-ar-card > p {
          margin: 8px auto 0;
          max-width: 380px;
        }
        .webar-controls {
          display: grid;
          grid-template-columns: 52px minmax(0, 1fr) 52px;
          gap: 10px;
          width: min(100%, 520px);
          max-width: 520px;
        }
        .webar-controls > button:first-child,
        .webar-controls > button:last-child {
          width: 52px;
          height: 52px;
          border-radius: 50%;
        }
        .webar-voice-action {
          max-width: none;
          border-radius: 16px;
        }
        .webar-stamp-action {
          max-width: 520px;
          height: 50px;
          border-radius: 16px;
        }
        @media (max-width: 560px) {
          .webar-stage {
            top: 68px;
            bottom: 318px;
          }
          .webar-model {
            width: 112vw;
            height: 48vh !important;
          }
          .webar-panel {
            gap: 10px;
            padding-top: 14px;
          }
          .webar-caption {
            min-height: 58px;
          }
          .webar-ar-card > p {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}
