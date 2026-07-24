"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clock,
  MapPin,
  Tag as TagIcon,
  Lightbulb,
  Smartphone,
  ArrowRight,
  QrCode,
  X,
} from "lucide-react";
import { stations } from "../../data/sac-co-do";
import { getStationBySlugOrId } from "../../lib/firebase/catalog";
import { hasLocalStationQrUnlock, hasStationQrUnlock, saveLocalStationQrUnlock, saveStationQrUnlock } from "../../lib/firebase/userData";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useToast } from "./ToastProvider";

// ─── Nội dung gợi ý vị trí QR cho từng trạm ───

const qrGuide = {
  "trang-an": {
    qrLocation: "Bến thuyền Tràng An — cột mốc bên trái lối lên thuyền",
    qrDescription:
      "Mã QR được đặt tại cột mốc gần khu vực soát vé / lên thuyền, bên trái lối vào bến.",
    qrDetails: [
      "QR nằm trên bảng gỗ nhỏ gần cột mốc đá đầu bến",
      "Cao khoảng 1.2m so với mặt đất, dễ quét",
      "Có logo Sắc Cố Đô bên cạnh",
    ],
    hints: [
      "Vào khu vực bến thuyền Tràng An (cổng chính)",
      "Đi thẳng tới khu vực xếp hàng chờ lên thuyền",
      "Nhìn về phía cột mốc bên trái, cạnh bảng nội quy",
      "QR code được dán trên bảng gỗ nhỏ",
    ],
    tips: "Nên đi buổi sáng để tránh đông. Mang giày chống trượt, mặc áo phao đầy đủ.",
  },
  "hoa-lu": {
    qrLocation: "Cổng thành Hoa Lư — bên phải cổng chính",
    qrDescription:
      "Mã QR được đặt tại tường thành bên phải cổng chính vào khu đền, gần bảng thông tin di tích.",
    qrDetails: [
      "QR gắn trên tường gạch cổ, trong khung kính bảo vệ",
      "Ngang tầm mắt, dễ thấy",
      "Có đèn LED nhỏ chiếu sáng vào buổi tối",
    ],
    hints: [
      "Đi qua cổng chính Hoa Lư (cổng tam quan)",
      "Rẽ phải ngay sau khi vào cổng",
      "Đi dọc tường thành khoảng 10m",
      "QR ở ngay cạnh bảng thông tin di tích",
    ],
    tips: "Khu vực có mái che, QR được bảo vệ khỏi mưa. Giữ trật tự khi quét.",
  },
  "bai-dinh": {
    qrLocation: "Hành lang La Hán — đoạn giữa, gần lối sang tháp chuông",
    qrDescription:
      "Mã QR được đặt tại cột đá đầu tiên của đoạn hành lang La Hán phía Tây, gần lối rẽ lên tháp chuông.",
    qrDetails: [
      "QR được khắc/chế tác trên bề mặt đá tự nhiên của cột hành lang",
      "Có khung đồng nhỏ viền quanh",
      "Bên cạnh có biểu tượng Sắc Cố Đô nhỏ",
    ],
    hints: [
      "Vào cổng Tam Quan chùa Bái Đính",
      "Đi thẳng qua điện Tam Thế",
      "Rẽ trái vào hành lang La Hán",
      "Đi khoảng 50m, tới cột đá thứ 7 bên tay phải",
      "QR nằm trên thân cột, ngang tầm mắt",
    ],
    tips: "Khuôn viên rộng, đi bộ nhiều. Ăn mặc lịch sự. QR có khung kính bảo vệ.",
  },
  "pho-co-hoa-lu": {
    qrLocation: "Cầu đá Kỳ Lân — đầu cầu phía Đông",
    qrDescription:
      "Mã QR đặt tại lan can cầu đá Kỳ Lân (phía Đông), nơi có góc nhìn ra hồ và dãy đèn lồng.",
    qrDetails: [
      "QR gắn trên mặt lan can đá, phẳng, dễ quét",
      "Có đèn LED vàng chiếu sáng ban đêm",
      "Gần biển tên 'Cầu Kỳ Lân'",
    ],
    hints: [
      "Vào khu phố đi bộ Phố Cổ Hoa Lư",
      "Đi về phía cầu Kỳ Lân (cầu đá bắc qua hồ)",
      "Lên cầu, đi về đầu cầu phía Đông (gần quảng trường)",
      "QR trên lan can đá bên phải, ngay cạnh biển tên cầu",
    ],
    tips: "Đẹp nhất sau 18:00 khi lên đèn. QR có đèn LED nên quét được cả buổi tối.",
  },
  "tam-coc": {
    qrLocation: "Bến Văn Lâm — khu vực chờ thuyền, gần cây cổ thụ",
    qrDescription:
      "Mã QR đặt trên thân cây cổ thụ gần bến thuyền Văn Lâm, phía bên phải lối xuống thuyền.",
    qrDetails: [
      "QR được đặt trong khung gỗ nhỏ đóng trên thân cây",
      "Cao khoảng 1.5m, dễ quét",
      "Có mái che nhỏ bằng lá",
    ],
    hints: [
      "Vào bến thuyền Văn Lâm (điểm xuất phát Tam Cốc)",
      "Đi qua khu vực mua vé",
      "Trước khi xuống bến, nhìn bên phải",
      "Cây cổ thụ lớn có tán rộng — QR trên thân cây",
    ],
    tips: "Quét QR trước khi lên thuyền. Mùa lúa chín (tháng 5-6, 9-10) cảnh đẹp nhất.",
  },
  "hang-mua": {
    qrLocation: "Chân núi Múa — cột gỗ đầu lối leo núi",
    qrDescription:
      "Mã QR đặt tại cột gỗ đầu lối leo núi, phía bên trái ngay sau cổng soát vé.",
    qrDetails: [
      "QR trên cột gỗ tròn cao khoảng 1.3m",
      "Có logo Sắc Cố Đô trên đỉnh cột",
      "Có thể quét cả trước khi leo và sau khi xuống",
    ],
    hints: [
      "Vào cổng Hang Múa, qua khu vực soát vé",
      "Trước mặt là bậc đá lên núi",
      "Cột gỗ bên trái lối đi, ngay đầu bậc thang đầu tiên",
      "QR quay mặt về phía lối vào",
    ],
    tips: "QR có thể quét cả trước và sau khi leo. Nên đi sớm hoặc chiều muộn tránh nắng.",
  },
};

function getGuide(stationId) {
  return qrGuide[stationId] || qrGuide["trang-an"];
}

// ─── Helper ảnh ───

function heroImageFor(station, stationId) {
  if (station?.heroImage || station?.image) {
    return station.heroImage || station.image;
  }

  const id = station?.id || stationId;
  const map = {
    "trang-an": "/assets/dia-danh/trang-an/TA1.jpg",
    "hoa-lu": "/assets/dia-danh/co-do-hoa-lu/CDHL 5.webp",
    "bai-dinh": "/assets/dia-danh/bai-dinh/Chùa Bái Đính 1.jpg",
    "pho-co-hoa-lu": "/assets/dia-danh/pho-co-hoa-lu/PCHL1.jpg",
    "tam-coc": "/assets/dia-danh/tam-coc-bich-dong/TC1.jpg",
    "hang-mua": "/assets/dia-danh/hang-mua/HM1.jpg",
  };
  return map[id] || "/assets/dia-danh/trang-an/TA1.jpg";
}

function galleryImageFor(station, stationId) {
  const g = station?.gallery;
  if (g && g.length > 1) return g[1];
  if (g && g.length > 0) return g[0];
  const id = station?.id || stationId;
  const map = {
    "trang-an": "/assets/dia-danh/trang-an/TA2.jpg",
    "hoa-lu": "/assets/dia-danh/co-do-hoa-lu/CĐHL 1.jpg",
    "bai-dinh": "/assets/dia-danh/bai-dinh/Chùa Bái Đính 2.jpg",
    "pho-co-hoa-lu": "/assets/dia-danh/pho-co-hoa-lu/PCHL 2.jpg",
    "tam-coc": "/assets/dia-danh/tam-coc-bich-dong/TC2.jpg",
    "hang-mua": "/assets/dia-danh/hang-mua/HM2.jpg",
  };
  return map[id] || heroImageFor(station, stationId);
}

function stepImageFor(station, stationId, index) {
  const gallery = station?.gallery || [];
  if (gallery.length) return gallery[index % gallery.length];

  const id = station?.id || stationId;
  const fallback = {
    "trang-an": ["/assets/dia-danh/trang-an/TA1.jpg", "/assets/dia-danh/trang-an/TA2.jpg", "/assets/dia-danh/trang-an/TA3.jpg", "/assets/dia-danh/trang-an/TA10.jpg"],
    "hoa-lu": ["/assets/dia-danh/co-do-hoa-lu/CDHL 5.webp", "/assets/dia-danh/co-do-hoa-lu/CĐHL 1.jpg", "/assets/dia-danh/co-do-hoa-lu/CĐHL 2.jpg", "/assets/dia-danh/co-do-hoa-lu/CĐHL 3.jpg"],
    "bai-dinh": ["/assets/dia-danh/bai-dinh/Chùa Bái Đính 1.jpg", "/assets/dia-danh/bai-dinh/Chùa Bái Đính 2.jpg", "/assets/dia-danh/bai-dinh/Chùa Bái Đính 3.jpg", "/assets/dia-danh/bai-dinh/Chùa bái đính 4.jpg"],
    "pho-co-hoa-lu": ["/assets/dia-danh/pho-co-hoa-lu/PCHL1.jpg", "/assets/dia-danh/pho-co-hoa-lu/PCHL 2.jpg", "/assets/dia-danh/pho-co-hoa-lu/PCHL 3.jpg", "/assets/dia-danh/pho-co-hoa-lu/IMG_1021.JPG"],
    "tam-coc": ["/assets/dia-danh/tam-coc-bich-dong/TC1.jpg", "/assets/dia-danh/tam-coc-bich-dong/TC2.jpg", "/assets/dia-danh/tam-coc-bich-dong/TC4.jpg", "/assets/dia-danh/tam-coc-bich-dong/TC5.jpg"],
    "hang-mua": ["/assets/dia-danh/hang-mua/HM1.jpg", "/assets/dia-danh/hang-mua/HM2.jpg", "/assets/dia-danh/hang-mua/HM3.jpg", "/assets/dia-danh/hang-mua/HM4.jpg"],
  };

  return (fallback[id] || fallback["trang-an"])[index % 4];
}

// ─── Component chính ───

export default function JourneyDetailPage({ station, stationId }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, db, loading: authLoading } = useFirebaseAuth();
  const [activeStation, setActiveStation] = useState(station);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isQrUnlocked, setIsQrUnlocked] = useState(false);
  const [isQrUnlockLoading, setIsQrUnlockLoading] = useState(true);
  const isSavingQrUnlockRef = useRef(false);
  const guide = getGuide(stationId || station?.id);

  useEffect(() => {
    let mounted = true;

    async function loadStation() {
      const fbStation = await getStationBySlugOrId(stationId || station?.slug || station?.id);
      if (mounted && fbStation) {
        setActiveStation(fbStation);
      }
    }

    loadStation();
    return () => { mounted = false; };
  }, [station?.id, station?.slug, stationId]);

  const st = activeStation || station;
  const img = heroImageFor(activeStation || station, stationId);
  const sid = st?.id || stationId;
  const checkinSlug = st?.slug || st?.id || stationId;
  const expectedQrValue = `SAC-CODO:${sid}`;

  useEffect(() => {
    let active = true;

    async function loadQrUnlock() {
      if (!sid || authLoading) return;

      setIsQrUnlockLoading(true);
      try {
        const unlocked = user && db
          ? await hasStationQrUnlock({ db, uid: user.uid, stationId: sid })
          : hasLocalStationQrUnlock(sid);
        if (active) setIsQrUnlocked(unlocked);
      } catch (error) {
        console.warn("Could not load QR unlock:", error);
        if (active) setIsQrUnlocked(false);
      } finally {
        if (active) setIsQrUnlockLoading(false);
      }
    }

    loadQrUnlock();
    return () => { active = false; };
  }, [authLoading, db, sid, user]);

  const openCheckin = useCallback(() => {
    router.push(`/checkin/${checkinSlug}`);
  }, [checkinSlug, router]);

  const handleCheckinCta = useCallback(() => {
    if (isQrUnlocked) {
      openCheckin();
      return;
    }
    setShowQrDialog(true);
  }, [isQrUnlocked, openCheckin]);

  const saveQrUnlockAndOpenCheckin = useCallback(async () => {
    if (isSavingQrUnlockRef.current) return;
    isSavingQrUnlockRef.current = true;

    try {
      if (user && db) {
        await saveStationQrUnlock({ db, uid: user.uid, stationId: sid, stationName: st?.name });
      } else {
        saveLocalStationQrUnlock(sid);
      }
      setIsQrUnlocked(true);
    } catch (error) {
      console.warn("Could not save QR unlock:", error);
      showToast("Đã quét đúng QR. Lần sau hãy quét lại nếu trạng thái chưa được lưu.", "info");
    }

    openCheckin();
  }, [db, openCheckin, showToast, sid, st?.name, user]);

  // ── Camera / QR scan using html5-qrcode ──
  useEffect(() => {
    if (!showQrDialog) return;
    let html5QrCode;
    let active = true;

    const timer = setTimeout(async () => {
      try {
        setCameraError("");
        const { Html5Qrcode } = await import("html5-qrcode");
        
        const container = document.getElementById("journey-qr-reader");
        if (!container || !active) return;

        html5QrCode = new Html5Qrcode("journey-qr-reader");

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            const raw = decodedText.trim();
            const isCorrectQr = raw === checkinSlug || raw === expectedQrValue || raw.includes(`/checkin/${checkinSlug}`);
            
            if (isCorrectQr) {
              if (!active) return;
              
              // Close dialog
              setShowQrDialog(false);

              showToast("Kết nối thành công! Đang chuyển hướng...", "success");
              saveQrUnlockAndOpenCheckin();
            } else {
              // Mismatched or invalid QR scanned
              if (!active) return;
              showToast("Mã QR không khớp với địa điểm này! Vui lòng quét đúng mã QR tại trạm.", "error");
            }
          },
          () => {
            // silent fail for frame decoding
          }
        );
      } catch (err) {
        console.warn("Failed to initialize html5-qrcode:", err);
        if (active) {
          setCameraError("Không thể kích hoạt camera quét QR. Vui lòng cấp quyền truy cập camera cho trình duyệt.");
        }
      }
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [showQrDialog, expectedQrValue, checkinSlug, router, showToast, saveQrUnlockAndOpenCheckin]);

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero Banner — style như trang hanh-trinh */}
        <section className="page-title-banner">
          <img src={img} alt={st?.name || ""} />
          <div>
            <p className="eyebrow">{st?.tag || "Trạm văn hóa"}</p>
            <h1>{st?.name || "Địa điểm"}</h1>
            <p>{st?.description || ""}</p>
          </div>
        </section>

        <div className="page-shell">
          {/* CTA Check-in Button at the top */}
          <button
            type="button"
            className="qr-cta"
            onClick={handleCheckinCta}
            disabled={isQrUnlockLoading}
            style={{ margin: "10px 0 32px 0" }}
          >
            <Smartphone size={36} className="qr-cta-icon" strokeWidth={1.6} />
            <span className="qr-cta-text">
              <strong>{isQrUnlocked ? "Tiếp tục trải nghiệm" : "Tôi đã đến nơi — Quét QR ngay"}</strong>
              <small>{isQrUnlocked ? "Địa danh này đã được mở khóa bằng QR" : "Quét đúng mã QR tại trạm để mở AR + Photobooth"}</small>
            </span>
            <ArrowRight size={28} className="qr-cta-arrow" strokeWidth={2.4} />
          </button>

          {/* Thông tin nhanh */}
          <div className="qr-grid-3">
            <div className="qr-info-item">
              <Clock size={18} className="qr-info-icon" />
              <strong>Giờ mở cửa</strong>
              <span>{st?.hours || "07:00 - 17:00"}</span>
            </div>
            <div className="qr-info-item">
              <MapPin size={18} className="qr-info-icon" />
              <strong>Khu vực</strong>
              <span>{st?.tag || "Non nước"}</span>
            </div>
            <div className="qr-info-item">
              <TagIcon size={18} className="qr-info-icon" />
              <strong>Dấu mốc</strong>
              <span>{st?.stamp || "Dấu"}</span>
            </div>
          </div>

          {/* Bước 1: Vị trí đặt QR */}
          <section className="qr-section">
            <h2>Tìm vị trí đặt mã QR</h2>
            <p className="qr-subtitle">
              Mỗi trạm có một mã QR riêng — hãy tìm đúng vị trí dưới đây để bắt đầu trải nghiệm.
            </p>

            <div className="qr-location-layout">
              <div className="qr-location-copy">
                <div className="qr-location-main">
                  <QrCode size={32} className="qr-location-icon" strokeWidth={1.8} />
                  <div>
                    <strong>Vị trí QR:</strong>
                    <p>{guide.qrLocation}</p>
                  </div>
                </div>
                <p className="qr-location-desc">{guide.qrDescription}</p>
                <ul className="qr-detail-list">
                  {guide.qrDetails.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>

              <div className="qr-media-row">
                <img
                  className="qr-location-photo"
                  src={galleryImageFor(st, sid)}
                  alt={`Vị trí đặt QR tại ${st?.name}`}
                  loading="lazy"
                />
              </div>
            </div>
          </section>

          {/* Bước 2: Cách tìm QR */}
          <section className="qr-section">
            <h2>Cách tìm QR</h2>
            <p className="qr-subtitle">
              Đi theo các bước sau để đến đúng vị trí đặt mã QR.
            </p>

            <div className="qr-step-map" aria-label="Bản đồ chỉ đường tới mã QR">
              <svg className="qr-step-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {guide.hints.slice(0, -1).map((_, i) => {
                  const y1 = 12 + i * (76 / Math.max(guide.hints.length - 1, 1));
                  const y2 = 12 + (i + 1) * (76 / Math.max(guide.hints.length - 1, 1));
                  const x1 = i % 2 === 0 ? 24 : 76;
                  const x2 = (i + 1) % 2 === 0 ? 24 : 76;
                  return (
                    <path
                      key={`route-${i}`}
                      className="qr-step-route-line"
                      d={`M${x1} ${y1} C50 ${y1 + 3}, 50 ${y2 - 3}, ${x2} ${y2}`}
                    />
                  );
                })}
              </svg>

              {guide.hints.map((hint, i) => {
                const y = 12 + i * (76 / Math.max(guide.hints.length - 1, 1));
                const x = i % 2 === 0 ? 24 : 76;
                return (
                  <article
                    key={i}
                    className={`qr-step-map-node ${i % 2 === 0 ? "align-right" : "align-left"}`}
                    style={{ "--route-x": `${x}%`, "--route-y": `${y}%` }}
                  >
                    <span className="qr-step-num">{i + 1}</span>
                    <img
                      className="qr-step-image"
                      src={stepImageFor(st, sid, i)}
                      alt={`Minh họa bước ${i + 1} tại ${st?.name}`}
                      loading="lazy"
                    />
                    <span className="qr-step-label">{hint}</span>
                  </article>
                );
              })}
            </div>

            <div className="qr-map-note">
              <MapPin size={18} strokeWidth={2.4} />
              <strong>Sơ đồ nhanh:</strong>
              <span>Xem ảnh bên trên để biết vị trí chính xác</span>
            </div>
          </section>

          {/* Lưu ý + CTA */}
          <section className="qr-section">
            <span className="qr-badge">Ghi nhớ</span>
            <h2>Lưu ý khi tới trạm</h2>

            <div className="qr-tips-content">
              <Lightbulb size={20} className="qr-tips-icon" />
              <p>{guide.tips}</p>
              <p className="qr-tip-extra">
                <strong>Giờ mở cửa:</strong> {st?.hours || "07:00 - 17:00"}
                {" — "}Nên sắp xếp thời gian tới trong khung giờ này để đảm bảo có thể check-in.
              </p>
            </div>

          </section>
        </div>
      </main>
      {showQrDialog ? (
        <div className="qr-scan-dialog" role="dialog" aria-modal="true" aria-labelledby="qr-scan-title">
          <div className="qr-scan-backdrop" onClick={() => setShowQrDialog(false)} />
          <div className="qr-scan-panel">
            <button className="qr-scan-close" type="button" onClick={() => setShowQrDialog(false)} aria-label="Đóng">
              <X size={20} />
            </button>
            <div className="qr-scan-copy">
              <span className="qr-badge">Xác thực tại trạm</span>
              <h2 id="qr-scan-title">Quét mã QR tại {st?.name}</h2>
              <p>Đưa mã QR của trạm vào giữa khung hình để tự động mở trải nghiệm.</p>
            </div>
            <div className="qr-scan-view">
              <div id="journey-qr-reader" />
              {cameraError ? <p className="qr-scan-error" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "90%", textAlign: "center", margin: 0, zIndex: 10 }}>{cameraError}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
      <SiteFooter />
    </>
  );
}
