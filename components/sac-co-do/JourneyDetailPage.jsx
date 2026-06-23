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
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

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
  const [activeStation, setActiveStation] = useState(station);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
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

  // ── Camera / QR scan ──
  const startCamera = useCallback(async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("Không thể mở camera. Vui lòng kiểm tra quyền truy cập.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Bật/tắt camera khi dialog mở/đóng
  useEffect(() => {
    if (showQrDialog) {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [showQrDialog, startCamera, stopCamera]);

  // Poll scan mỗi 800ms bằng BarcodeDetector nếu có
  useEffect(() => {
    if (!showQrDialog) return;
    let mounted = true;

    async function pollScan() {
      if (!window.BarcodeDetector) return;
      if (!detectorRef.current) {
        try {
          detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
        } catch {
          return;
        }
      }
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      try {
        const barcodes = await detectorRef.current.detect(video);
        for (const barcode of barcodes) {
          const raw = barcode.rawValue.trim();
          if (raw === expectedQrValue) {
            if (!mounted) return;
            stopCamera();
            setShowQrDialog(false);
            router.push(`/checkin/${checkinSlug}`);
            return;
          }
        }
      } catch {
        // ignore
      }
    }

    const interval = setInterval(pollScan, 800);
    return () => { mounted = false; clearInterval(interval); };
  }, [showQrDialog, expectedQrValue, checkinSlug, router, stopCamera]);

  function handleQrConfirm() {
    stopCamera();
    setShowQrDialog(false);
    router.push(`/checkin/${checkinSlug}`);
  }

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
            <span className="qr-badge">Bước 1</span>
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
            <span className="qr-badge">Bước 2</span>
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

            <button
              type="button"
              className="qr-cta"
              onClick={() => setShowQrDialog(true)}
            >
              <Smartphone size={36} className="qr-cta-icon" strokeWidth={1.6} />
              <span className="qr-cta-text">
                <strong>Tôi đã đến nơi — Quét QR ngay</strong>
                <small>Quét đúng mã QR tại trạm để mở AR + Photobooth</small>
              </span>
              <ArrowRight size={28} className="qr-cta-arrow" strokeWidth={2.4} />
            </button>
          </section>
        </div>
      </main>
      {showQrDialog ? (
        <div className="qr-scan-dialog" role="dialog" aria-modal="true" aria-labelledby="qr-scan-title">
          <div className="qr-scan-backdrop" onClick={() => { stopCamera(); setShowQrDialog(false); }} />
          <div className="qr-scan-panel">
            <button className="qr-scan-close" type="button" onClick={() => { stopCamera(); setShowQrDialog(false); }} aria-label="Đóng">
              <X size={20} />
            </button>
            <div className="qr-scan-copy">
              <span className="qr-badge">Xác thực tại trạm</span>
              <h2 id="qr-scan-title">Quét mã QR tại {st?.name}</h2>
              <p>Đưa mã QR của trạm vào giữa khung hình để tự động mở trải nghiệm.</p>
            </div>
            <div className="qr-scan-view">
              <video ref={videoRef} className="qr-scan-camera" autoPlay playsInline muted />
              <div className="qr-scan-overlay" />
              {cameraError ? <p className="qr-scan-error">{cameraError}</p> : null}
            </div>
            {!window.BarcodeDetector ? (
              <p className="qr-scan-fallback-note">
                Trình duyệt của bạn chưa hỗ trợ quét QR tự động.{' '}
                <button className="qr-scan-confirm" type="button" onClick={handleQrConfirm}>
                  Vào trải nghiệm ngay
                </button>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      <SiteFooter />
    </>
  );
}
