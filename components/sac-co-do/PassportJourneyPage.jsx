"use client";

import { useState, useEffect } from "react";
import { stations } from "../../data/sac-co-do";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { collection, getDocs } from "firebase/firestore";

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

// Passive stop card representing a stamp in the album
function PassportStampCard({ stop, progress, index }) {
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
          <a className="passport-detail-link" href={`/checkin/${stop.id}`} style={{ justifyContent: "center" }}>
            Xem chi tiết
            <img src={`${assetBase}/desktop-icon/ic-xem-chi-tiet.svg`} alt="" aria-hidden="true" />
          </a>
        ) : (
          <div 
            style={{ 
              display: "inline-block", 
              width: "100%", 
              padding: "10px", 
              borderRadius: "10px", 
              background: "#f9f8f6", 
              border: "1px dashed #cbd5e0", 
              color: "#718096", 
              fontWeight: "bold", 
              fontSize: "12px", 
              textAlign: "center",
              cursor: "default"
            }}
          >
            Chưa khám phá
          </div>
        )}
      </div>
    </article>
  );
}

export default function PassportJourneyPage() {
  const { user, db } = useFirebaseAuth();
  const [visitedStops, setVisitedStops] = useState({});
  const [loadingStops, setLoadingStops] = useState(true);

  // Load progress stats
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
    </>
  );
}
