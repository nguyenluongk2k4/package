"use client";

import { useState, useEffect, useRef } from "react";
import { stations } from "../../data/sac-co-do";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useToast } from "./ToastProvider";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";

const assetBase = "/assets/ho-chieu-hanh-trinh";

const passportStops = [
  {
    id: "trang-an",
    title: "Tràng An",
    subtitle: "Quần thể danh thắng",
    icon: `${assetBase}/mobile-icon/ic-trang-an.svg`,
  },
  {
    id: "hoa-lu",
    title: "Hoa Lư",
    subtitle: "Cố đô ngàn năm",
    icon: `${assetBase}/mobile-icon/ic-hoa-lu.svg`,
  },
  {
    id: "tam-coc",
    title: "Tam Cốc",
    subtitle: "Vịnh Hạ Long trên cạn",
    icon: `${assetBase}/mobile-icon/ic-tam-coc.svg`,
  },
  {
    id: "bai-dinh",
    title: "Bái Đính",
    subtitle: "Tâm linh hội tụ",
    icon: `${assetBase}/mobile-icon/ic-bai-dinh.svg`,
  },
  {
    id: "hang-mua",
    title: "Hang Múa",
    subtitle: "Đỉnh cao tầm mắt",
    icon: `${assetBase}/mobile-icon/ic-hang-mua.svg`,
  },
  {
    id: "thung-nham",
    title: "Thung Nham",
    subtitle: "Vườn chim trong núi",
    icon: `${assetBase}/mobile-icon/ic-thung-nham.svg`,
  },
];

// Helper to render stop card
function PassportStampCard({ stop, progress, index, onTriggerCheckin }) {
  const isCompleted = !!progress?.checkedIn;
  const hasPhoto = !!progress?.photoUrl;
  
  const defaultStampImage = stations.find((item) => item.id === stop.id)?.image || `${assetBase}/desktop-icon/ic-lock.svg`;

  return (
    <article className={`passport-stop-card ${isCompleted ? "is-unlocked" : "is-locked"}`}>
      <div className="passport-stop-heading">
        <h2>{stop.title}</h2>
        <p>{stop.subtitle}</p>
      </div>

      <div className="passport-stamp-frame" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
        {hasPhoto ? (
          <div className="passport-polaroid-frame" style={{ transform: `rotate(${index % 2 === 0 ? -1.5 : 1.5}deg)` }}>
            <div className="passport-polaroid-img-wrapper">
              <img className="passport-polaroid-img" src={progress.photoUrl} alt={`Kỷ niệm ${stop.title}`} loading="lazy" decoding="async" />
            </div>
            <span className="passport-polaroid-caption">Kỷ niệm {stop.title}</span>
            <span className="passport-polaroid-date">Đã chụp</span>
          </div>
        ) : isCompleted ? (
          <img className="passport-stamp-image" src={defaultStampImage} alt={`Dấu mộc ${stop.title}`} loading="lazy" decoding="async" />
        ) : (
          <>
            <img className="passport-locked-icon" src={stop.icon} alt="" loading="lazy" decoding="async" />
            <img className="passport-lock-icon" src={`${assetBase}/desktop-icon/ic-lock.svg`} alt="" loading="lazy" decoding="async" />
          </>
        )}
      </div>

      <div className="passport-card-actions" style={{ marginTop: "12px", textAlign: "center" }}>
        {isCompleted ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <a className="passport-detail-link" href={`/checkin/${stop.id}`} style={{ justifyContent: "center" }}>
              Xem chi tiết
              <img src={`${assetBase}/desktop-icon/ic-xem-chi-tiet.svg`} alt="" aria-hidden="true" />
            </a>
            <button 
              type="button" 
              className="btn-tiny" 
              onClick={() => onTriggerCheckin(stop)}
              style={{ fontSize: "11px", background: "none", border: "none", color: "#104c27", textDecoration: "underline", cursor: "pointer", fontWeight: "bold" }}
            >
              {hasPhoto ? "Chụp lại ảnh AR" : "Đính kèm ảnh AR"}
            </button>
          </div>
        ) : (
          <button 
            type="button" 
            className="passport-locked-label" 
            onClick={() => onTriggerCheckin(stop)}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "#f5f3ef", border: "1px dashed rgba(16, 76, 39, 0.2)", color: "#104c27", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}
          >
            Chụp ảnh Check-in
          </button>
        )}
      </div>
    </article>
  );
}

// Simulated iOS AR Quick Look Uploader modal
function ARCheckinModal({ stop, onClose, onUploadSuccess }) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [photoFile, setPhotoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const modelViewerRef = useRef(null);

  const handleLaunchAR = async () => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    try {
      showToast("📢 Đang mở camera AR... Đặt Robot 3D xuống nền phẳng và bấm nút chụp của iPhone để lưu ảnh vào Thư viện nhé!", "info");
      await viewer.activateAR();
      setCurrentStep(2);
    } catch (err) {
      console.warn("Model viewer launch failed:", err);
      // Fallback
      setCurrentStep(2);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { uploadToCloudinary } = await import("../../lib/cloudinary/client");
      const uploadResult = await uploadToCloudinary(
        file, 
        `sac-co-do/checkin/${stop.id}`,
        (percent) => setUploadProgress(percent)
      );
      
      const stampSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2012/2012-84.wav");
      stampSound.play().catch(() => {});

      await onUploadSuccess(stop.id, uploadResult.url);
    } catch (err) {
      console.error(err);
      showToast("❌ Lỗi tải ảnh lên Cloudinary. Vui lòng thử lại!", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="ar-checkin-modal">
      <div className="ar-checkin-card">
        <button className="ar-checkin-close" onClick={onClose} disabled={isUploading}>✕</button>
        
        <div className="ar-checkin-header">
          <h2>Check-in AR {stop.title}</h2>
          <p>Tải ảnh chụp từ trình xem AR để đóng dấu Hộ chiếu</p>
        </div>

        <div className="ar-checkin-steps">
          <div className={`ar-checkin-step ${currentStep === 1 ? "" : "opacity-40"}`} style={{ opacity: currentStep === 1 ? 1 : 0.4 }}>
            <span className="ar-checkin-step-num">1</span>
            <div className="ar-checkin-step-content">
              <strong>Mở Camera và Chụp ảnh AR</strong>
              <p>Mở camera AR bên dưới, đặt hướng dẫn viên 3D vào phong cảnh thực tế và sử dụng nút chụp của iPhone để lưu ảnh vào máy.</p>
            </div>
          </div>

          <div className={`ar-checkin-step ${currentStep === 2 ? "" : "opacity-40"}`} style={{ opacity: currentStep === 2 ? 1 : 0.4 }}>
            <span className="ar-checkin-step-num">2</span>
            <div className="ar-checkin-step-content">
              <strong>Chọn ảnh vừa chụp để lưu giữ</strong>
              <p>Đóng AR, quay lại đây bấm nút Chọn ảnh để tải lên Hộ chiếu của bạn.</p>
            </div>
          </div>
        </div>

        <div className="ar-checkin-actions">
          {currentStep === 1 ? (
            <button type="button" className="ar-btn ar-btn-primary" onClick={handleLaunchAR}>
              📷 Bước 1: Mở Camera AR
            </button>
          ) : (
            <button type="button" className="ar-btn ar-btn-primary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              📂 Bước 2: Chọn ảnh từ Thư viện
            </button>
          )}

          {currentStep === 2 && (
            <button type="button" className="ar-btn ar-btn-secondary" onClick={() => setCurrentStep(1)} disabled={isUploading}>
              ↩️ Quay lại Bước 1
            </button>
          )}
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleFileChange} 
          style={{ display: "none" }} 
        />

        <div style={{ width: 0, height: 0, overflow: "hidden", visibility: "hidden" }}>
          <model-viewer
            ref={modelViewerRef}
            src="/ar/sac-co-do-guide-v2.glb"
            ios-src="/ar/sac-co-do-guide-v2.usdz"
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
          />
        </div>

        {isUploading && (
          <div className="lookup-scanner-overlay" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div className="spinner" style={{ width: "50px", height: "50px", border: "4px solid rgba(255, 255, 255, 0.1)", borderTopColor: "#fbd38d", borderRadius: "50%", animation: "spin-loader 1s linear infinite", marginBottom: "20px" }} />
            <div style={{ color: "#fbd38d", fontSize: "16px", fontWeight: "bold", letterSpacing: "0.05em" }}>
              ĐANG TẢI ẢNH LÊN... {uploadProgress}%
            </div>
            <p style={{ color: "#a0aec0", fontSize: "12px", marginTop: "8px", marginBottom: 0 }}>Vui lòng giữ kết nối mạng ổn định</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PassportJourneyPage() {
  const { user, db } = useFirebaseAuth();
  const { showToast } = useToast();
  
  const [visitedStops, setVisitedStops] = useState({});
  const [loadingStops, setLoadingStops] = useState(true);
  const [activeCheckinStop, setActiveCheckinStop] = useState(null);

  // Load progress
  useEffect(() => {
    let active = true;
    if (!db || !user) {
      if (typeof window !== "undefined") {
        const visitedList = JSON.parse(localStorage.getItem("scd_visited_stations") || "[]");
        const photosMap = JSON.parse(localStorage.getItem("scd_station_photos") || "{}");
        const progressMap = {};
        
        // Mặc định hoàn thành Tràng An và Hoa Lư cho tài khoản khách giống mockup ban đầu
        const defaultCompleted = visitedList.length > 0 ? visitedList : ["trang-an", "hoa-lu"];
        defaultCompleted.forEach((id) => {
          progressMap[id] = {
            stationId: id,
            checkedIn: true,
            photoUrl: photosMap[id] || null,
          };
        });
        setVisitedStops(progressMap);
      }
      setLoadingStops(false);
      return;
    }

    async function fetchProgress() {
      try {
        const querySnapshot = await getDocs(collection(db, "users", user.uid, "journeyProgress"));
        if (!active) return;
        const progressMap = {};
        
        if (querySnapshot.empty) {
          const defaultCompleted = ["trang-an", "hoa-lu"];
          defaultCompleted.forEach((id) => {
            progressMap[id] = {
              stationId: id,
              checkedIn: true,
              photoUrl: null,
            };
          });
        } else {
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            progressMap[doc.id] = {
              stationId: doc.id,
              checkedIn: true,
              photoUrl: data.photoUrl || null,
            };
          });
        }
        setVisitedStops(progressMap);
      } catch (err) {
        console.warn("⚠️ [Passport] Lỗi tải tiến trình từ Firestore:", err);
      } finally {
        if (active) setLoadingStops(false);
      }
    }

    fetchProgress();
    return () => {
      active = false;
    };
  }, [user, db]);

  // Handle successful AR photo upload and check-in
  const handleCheckinSuccess = async (stationId, photoUrl) => {
    setActiveCheckinStop(null);

    // Play fireworks confetti
    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
      script.onload = () => {
        window.confetti({
          particleCount: 180,
          spread: 90,
          origin: { y: 0.6 }
        });
      };
      document.body.appendChild(script);
    }

    // 1. Update state locally
    setVisitedStops((prev) => ({
      ...prev,
      [stationId]: {
        stationId,
        checkedIn: true,
        photoUrl,
      },
    }));

    // 2. Update localStorage for fallback
    if (typeof window !== "undefined") {
      const visitedList = JSON.parse(localStorage.getItem("scd_visited_stations") || "[]");
      if (!visitedList.includes(stationId)) {
        visitedList.push(stationId);
        localStorage.setItem("scd_visited_stations", JSON.stringify(visitedList));
      }
      const photosMap = JSON.parse(localStorage.getItem("scd_station_photos") || "{}");
      photosMap[stationId] = photoUrl;
      localStorage.setItem("scd_station_photos", JSON.stringify(photosMap));
    }

    // 3. Write to Firestore
    if (db && user) {
      try {
        const { saveJourneyProgress } = await import("../../lib/firebase/userData");
        // Save progress to users/{uid}/journeyProgress/{stationId}
        await saveJourneyProgress({
          db,
          uid: user.uid,
          stationId,
          stationName: passportStops.find((item) => item.id === stationId)?.title || stationId,
          source: "ios-ar-quicklook",
          photoUrl,
        });

        // Save photobooth record to users/{uid}/photoboothPhotos/{photoId}
        const photoId = `checkin-${stationId}-${Date.now()}`;
        const photoRef = doc(db, "users", user.uid, "photoboothPhotos", photoId);
        await setDoc(photoRef, {
          stationId,
          caption: `Kỷ niệm check-in AR tại ${passportStops.find((item) => item.id === stationId)?.title || stationId}`,
          url: photoUrl,
          createdAt: serverTimestamp(),
        });
        
        showToast("🎉 Đóng dấu mộc thành công và đã thêm ảnh vào bộ sưu tập Photobooth!", "success");
      } catch (err) {
        console.warn("⚠️ [Passport] Lỗi lưu Firestore:", err);
      }
    } else {
      showToast("🎉 Đóng dấu mộc thành công! Hãy đăng nhập để lưu trữ vĩnh viễn.", "success");
    }
  };

  // Calculations for progress stats
  const totalStops = passportStops.length;
  const completedStops = Object.keys(visitedStops).filter((id) => visitedStops[id]?.checkedIn).length;
  const progressPercent = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  const achievements = [
    {
      title: "Kẻ lữ hành tò mò",
      description: "Đã ghé thăm 2 địa điểm di sản",
      active: completedStops >= 2,
      icon: `${assetBase}/desktop-icon/ic-leo-nui.svg`,
    },
    {
      title: "Nhiếp ảnh gia Cố đô",
      description: "Check-in tại 4 địa điểm",
      active: completedStops >= 4,
      icon: `${assetBase}/desktop-icon/ic-thanh-tuu.svg`,
    },
  ];

  return (
    <>
      <SiteHeader />
      <main className="heritage-passport-page">
        <section className="page-title-banner passport-title-banner">
          <img src="/assets/anh-new/cover photo.jpg" alt="" aria-hidden="true" />
          <div>
            <p className="passport-eyebrow">Hộ chiếu hành trình</p>
            <h1>Hộ Chiếu Di Sản</h1>
            <p>
              Nơi lưu giữ dấu ấn của những bước chân khám phá vùng đất Cố đô nghìn năm văn hiến.
              Mỗi điểm dừng chân là một câu chuyện, mỗi con dấu là một kỷ niệm vô giá.
            </p>
          </div>
          <div className="passport-progress-ring" aria-label={`Tiến trình khám phá ${progressPercent}%`}>
            <span>{progressPercent}%</span>
            <small>Tiến trình khám phá</small>
          </div>
        </section>

        <section className="passport-progress-card" aria-label="Tiến độ hộ chiếu">
          <div>
            <span>Tiến độ</span>
            <strong>{completedStops}/{totalStops} trạm</strong>
          </div>
          <strong>{progressPercent}%</strong>
          <div className="passport-progress-bar" aria-hidden="true">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <p>“Bạn đã hoàn thành {progressPercent}% hành trình di sản Ninh Bình”</p>
          <img src={`${assetBase}/desktop-icon/image-decor1.svg`} alt="" aria-hidden="true" />
        </section>

        {loadingStops ? (
          <div className="loading-placeholder-container">
            <div className="spinner" />
          </div>
        ) : (
          <section className="passport-stamp-grid" aria-label="Các dấu mộc hành trình">
            {passportStops.map((stop, index) => (
              <PassportStampCard 
                key={stop.id} 
                stop={stop} 
                progress={visitedStops[stop.id]} 
                index={index} 
                onTriggerCheckin={setActiveCheckinStop}
              />
            ))}
          </section>
        )}

        <section className="passport-lower-grid">
          <article className="passport-achievement-panel">
            <h2>
              <img src={`${assetBase}/desktop-icon/ic-thanh-tuu.svg`} alt="" aria-hidden="true" />
              Thành tựu của bạn
            </h2>
            <div className="passport-achievement-list">
              {achievements.map((item) => (
                <div className={`passport-achievement-item ${item.active ? "is-active" : ""}`} key={item.title}>
                  <span>
                    <img src={item.icon} alt="" aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="passport-offer-box">
              <small>Ưu đãi đặc quyền</small>
              <div>
                <p>
                  <strong>Giảm 15% vé thuyền</strong>
                  Dành cho chặng Tam Cốc sắp tới
                </p>
                <a href="/hanh-trinh">Dùng ngay</a>
              </div>
            </div>
          </article>

          <aside className="passport-story-panel">
            <blockquote>“Mỗi con đường ta đi, mỗi ngọn núi ta qua đều để lại một dấu ấn trong lòng...”</blockquote>
            <p>
              Hành trình của bạn tại Ninh Bình mới chỉ bắt đầu. Tiếp tục khám phá để lấp đầy những
              trang hộ chiếu di sản và nhận những phần quà bất ngờ từ Ban quản lý khu du lịch.
            </p>
            <div className="passport-actions">
              <a className="passport-primary-action" href="/hanh-trinh">
                <img src={`${assetBase}/desktop-icon/ic-tiep-tuc-hanh-trinh.svg`} alt="" aria-hidden="true" />
                Tiếp tục hành trình
              </a>
              <button className="passport-secondary-action" type="button">
                <img src={`${assetBase}/desktop-icon/ic-chia-se-ket-qua.svg`} alt="" aria-hidden="true" />
                Chia sẻ kết quả
              </button>
            </div>
            <div className="passport-memory-image">
              <img src="/assets/dia-danh/trang-an/TA1.jpg" alt="Kỷ niệm hành trình Tràng An" loading="lazy" decoding="async" />
            </div>
          </aside>
        </section>

        <div className="passport-mobile-actions" aria-label="Hành động hộ chiếu">
          <a className="passport-primary-action" href="/hanh-trinh">
            Tiếp tục hành trình
          </a>
          <button className="passport-secondary-action" type="button">
            Chia sẻ thành tựu
          </button>
        </div>
      </main>
      <SiteFooter />

      {activeCheckinStop && (
        <ARCheckinModal 
          stop={activeCheckinStop} 
          onClose={() => setActiveCheckinStop(null)} 
          onUploadSuccess={handleCheckinSuccess}
        />
      )}
    </>
  );
}
