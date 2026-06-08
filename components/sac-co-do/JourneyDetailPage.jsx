"use client";

import { useEffect, useState } from "react";
import { stations } from "../../data/sac-co-do";
import { getStationBySlugOrId } from "../../lib/firebase/catalog";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

const detailAssetBase = "/assets/chi-tiet-hanh-trinh";

const stationDetailCopy = {
  "trang-an": {
    stationCode: "TRANG-AN-04",
    badge: "Di sản kép UNESCO",
    headline: "Hồn nước giữa miền đá vôi",
    intro:
      "Tràng An mở ra hành trình bằng nhịp chèo chậm trên mặt nước xanh. Mỗi hang động, bến đền và vách núi đều giữ một lớp ký ức của vùng cố đô.",
    history: [
      "Được UNESCO công nhận là Di sản Văn hóa và Thiên nhiên Thế giới năm 2014.",
      "Hệ thống hang động xuyên thủy nối các thung lũng đá vôi bằng những dòng nước trong.",
    ],
    chapters: [
      { label: "Chặng 1", title: "Bến thuyền Tràng An", description: "Khởi đầu hành trình trên dòng sông Ngô Đồng xanh biếc." },
      { label: "Chặng 2", title: "Đền Trình", description: "Dừng lại trước không gian linh thiêng ẩn mình bên vách đá." },
      { label: "Chặng 3", title: "Hang Địa Linh", description: "Đi xuyên lớp đá vôi để mở khóa dấu mốc đầu tiên." },
    ],
  },
  "hoa-lu": {
    stationCode: "HOA-LU-02",
    badge: "Kinh đô đầu tiên",
    headline: "Dấu son triều đại",
    intro:
      "Hoa Lư kể chuyện bằng mái ngói rêu phong, nền thành cũ và những khoảng sân yên tĩnh. Đây là trạm dành cho người muốn chạm vào chiều sâu lịch sử Ninh Bình.",
    history: [
      "Từng là kinh đô của nhà nước phong kiến trung ương tập quyền đầu tiên tại Việt Nam.",
      "Không gian đền thờ vua Đinh, vua Lê gợi lại cấu trúc quyền lực và văn hóa hơn một nghìn năm trước.",
    ],
    chapters: [
      { label: "Chặng 1", title: "Cổng thành xưa", description: "Bước qua lớp đá cổ để bắt đầu câu chuyện cố đô." },
      { label: "Chặng 2", title: "Đền vua Đinh", description: "Nghe lớp ký ức về một triều đại mở nước." },
      { label: "Chặng 3", title: "Sân rồng Hoa Lư", description: "Đóng dấu cổng thành vào passport hành trình." },
    ],
  },
  "bai-dinh": {
    stationCode: "BAI-DINH-03",
    badge: "Tâm linh đại cảnh",
    headline: "Tiếng chuông trong thung núi",
    intro:
      "Bái Đính là khoảng lặng rộng lớn của hành trình. Những hành lang dài, tượng Phật và âm chuông tạo nên một trạm trải nghiệm chậm rãi, trang nghiêm.",
    history: [
      "Quần thể chùa có quy mô lớn, kết nối kiến trúc mới với không gian chùa cổ trên núi.",
      "Các hành lang La Hán và tháp chuông là điểm dừng giàu biểu tượng cho trải nghiệm AR.",
    ],
    chapters: [
      { label: "Chặng 1", title: "Cổng Tam Quan", description: "Bắt đầu lộ trình trong không gian kiến trúc lớn." },
      { label: "Chặng 2", title: "Hành lang La Hán", description: "Đi giữa những lớp tượng và câu chuyện tu tập." },
      { label: "Chặng 3", title: "Tháp chuông", description: "Mở dấu chuông đồng cho passport tâm linh." },
    ],
  },
  "pho-co-hoa-lu": {
    stationCode: "PHO-CO-05",
    badge: "Đêm phố di sản",
    headline: "Ánh đèn trên mặt hồ",
    intro:
      "Phố Cổ Hoa Lư mang màu sắc mềm và gần gũi hơn: đèn lồng, mặt nước, gian hàng thủ công và những góc ảnh lưu niệm sau hoàng hôn.",
    history: [
      "Không gian phố tái hiện chất liệu văn hóa truyền thống trong nhịp tham quan hiện đại.",
      "Đây là trạm lý tưởng để kích hoạt photobooth, chia sẻ ảnh và nhận dấu đèn phố.",
    ],
    chapters: [
      { label: "Chặng 1", title: "Cầu đá Kỳ Lân", description: "Ngắm mặt hồ phản chiếu dãy đèn lồng." },
      { label: "Chặng 2", title: "Dãy gian hàng", description: "Gặp chất liệu thủ công và món quà địa phương." },
      { label: "Chặng 3", title: "Sân khấu đêm", description: "Đóng dấu đèn phố sau khung giờ lên đèn." },
    ],
  },
  "tam-coc": {
    stationCode: "TAM-COC-06",
    badge: "Sông núi mùa lúa",
    headline: "Ba hang giữa cánh đồng",
    intro:
      "Tam Cốc - Bích Động là phần dịu nhất của tuyến đi: thuyền lướt qua đồng lúa, núi đá dựng hai bên và những hang nước thấp mở ra từng khúc cảnh.",
    history: [
      "Tên Tam Cốc gắn với ba hang xuyên núi: Hang Cả, Hang Hai và Hang Ba.",
      "Bích Động bổ sung lớp trải nghiệm chùa động, đưa hành trình từ sông nước lên không gian núi.",
    ],
    chapters: [
      { label: "Chặng 1", title: "Bến Văn Lâm", description: "Lên thuyền và bắt đầu lộ trình qua đồng lúa." },
      { label: "Chặng 2", title: "Hang Cả", description: "Đi vào đoạn hang dài nhất của tuyến Tam Cốc." },
      { label: "Chặng 3", title: "Bích Động", description: "Mở dấu thuyền lúa trong không gian chùa động." },
    ],
  },
  "hang-mua": {
    stationCode: "HANG-MUA-07",
    badge: "Tầm nhìn toàn cảnh",
    headline: "Nấc thang lên đỉnh rồng",
    intro:
      "Hang Múa là trạm nhiều năng lượng nhất: leo bậc đá, nhìn xuống thung lũng Tam Cốc và hoàn thành hành trình bằng dấu mốc long đỉnh.",
    history: [
      "Điểm ngắm cảnh nổi bật với tuyến bậc đá dẫn lên đỉnh núi hình rồng.",
      "Từ đỉnh cao có thể quan sát nhịp sông, đồng lúa và các khối núi đá vôi đặc trưng Ninh Bình.",
    ],
    chapters: [
      { label: "Chặng 1", title: "Chân núi Múa", description: "Chuẩn bị tuyến leo và kiểm tra passport." },
      { label: "Chặng 2", title: "Đường bậc đá", description: "Theo từng nấc lên cao để mở góc nhìn rộng hơn." },
      { label: "Chặng 3", title: "Đỉnh rồng", description: "Hoàn thành dấu long đỉnh và nhận ưu đãi cuối chặng." },
    ],
  },
};

const stationFallbackCopy = {
  "trang-an": {
    name: "Tràng An",
    tag: "Non nước",
    stamp: "Dấu sóng đá vôi",
    description: "Không gian di sản với núi đá vôi và dòng nước xanh, phù hợp làm trạm mở đầu của hành trình.",
  },
  "hoa-lu": {
    name: "Cố Đô Hoa Lư",
    tag: "Kinh đô xưa",
    stamp: "Dấu cổng thành",
    description: "Dấu mốc lịch sử của vùng đất cố đô, nơi cuốn passport bắt đầu kể chuyện bằng ký ức triều đại.",
  },
  "bai-dinh": {
    name: "Chùa Bái Đính",
    tag: "Tâm linh",
    stamp: "Dấu chuông đồng",
    description: "Một trạm lắng và rộng, dành cho trải nghiệm đóng dấu sau khi đi qua hành lang văn hóa tâm linh.",
  },
  "pho-co-hoa-lu": {
    name: "Phố Cổ Hoa Lư",
    tag: "Đêm phố",
    stamp: "Dấu đèn phố",
    description: "Sắc đèn, mái ngói và nhịp dạo chơi chậm rãi, phù hợp cho check-in và photobooth kỷ niệm.",
  },
  "tam-coc": {
    name: "Tam Cốc - Bích Động",
    tag: "Sông núi",
    stamp: "Dấu thuyền lúa",
    description: "Một lát cắt mềm mại của Ninh Bình, nơi trải nghiệm giấy pop-up gặp cảnh quan ngoài đời.",
  },
  "hang-mua": {
    name: "Hang Múa",
    tag: "Tầm nhìn",
    stamp: "Dấu long đỉnh",
    description: "Trạm kết giàu năng lượng với góc nhìn toàn cảnh, mở khóa phần thưởng sau khi hoàn thành hành trình.",
  },
};

function normalizeChapter(chapter) {
  if (Array.isArray(chapter)) {
    return {
      label: chapter[0] || "",
      title: chapter[1] || "",
      description: chapter[2] || "",
    };
  }

  return {
    label: chapter?.label || "",
    title: chapter?.title || "",
    description: chapter?.description || "",
  };
}

function normalizeDetail(detail) {
  return {
    ...detail,
    history: Array.isArray(detail.history) ? detail.history.filter(Boolean) : [],
    chapters: Array.isArray(detail.chapters) ? detail.chapters.map(normalizeChapter) : [],
  };
}

function withCleanFallback(station) {
  return {
    ...station,
    ...(stationFallbackCopy[station?.id] || {}),
  };
}

function getDetail(station) {
  return normalizeDetail({
    ...(stationDetailCopy[station.id] || stationDetailCopy["trang-an"]),
    ...(station.detail || {}),
  });
}

export function getStationById(stationId) {
  return stations.find((station) => station.id === stationId);
}

export default function JourneyDetailPage({ station, stationId }) {
  const [activeStation, setActiveStation] = useState(withCleanFallback(station));
  const detail = getDetail(activeStation);

  useEffect(() => {
    let mounted = true;

    async function loadStation() {
      const firebaseStation = await getStationBySlugOrId(stationId || station?.slug || station?.id);
      if (mounted && firebaseStation) {
        setActiveStation(withCleanFallback(firebaseStation));
      }
    }

    loadStation();

    return () => {
      mounted = false;
    };
  }, [station?.id, station?.slug, stationId]);

  return (
    <>
      <SiteHeader />
      <main className="journey-detail-page">
        <a className="journey-detail-back" href="/hanh-trinh">
          Quay lại hành trình
        </a>

        <div className="journey-detail-layout">
          <div className="journey-detail-main">
            <section className="journey-detail-hero">
              <img src={activeStation.heroImage || activeStation.image} alt={activeStation.name} loading="eager" decoding="async" />
              <div className="journey-detail-hero-stamp" aria-hidden="true">
                <span>{activeStation.stamp}</span>
              </div>
              <div className="journey-detail-hero-copy">
                <span>{detail.badge}</span>
                <h1>{activeStation.name}</h1>
                <div className="journey-detail-hero-meta">
                  <p className="journey-detail-hero-location">
                    <img src={`${detailAssetBase}/desktop-icon/ic-dia-diem.svg`} alt="" aria-hidden="true" />
                    {activeStation.tag}
                  </p>
                  <p className="journey-detail-hero-time">
                    <img src={`${detailAssetBase}/mobile-icon/ic-time.svg`} alt="" aria-hidden="true" />
                    {activeStation.hours}
                  </p>
                </div>
              </div>
            </section>

            <section className="journey-detail-content-grid">
              <article className="journey-detail-story">
                <h2>{detail.headline}</h2>
                <p>{detail.intro}</p>
              </article>

              <article className="journey-detail-history-card">
                <h2>Thông tin lịch sử</h2>
                {detail.history.map((item, index) => (
                  <p key={`${item}-${index}`}>
                    <img
                      src={`${detailAssetBase}/desktop-icon/${index === 0 ? "ic-certificate.svg" : "ic-nui.svg"}`}
                      alt=""
                      aria-hidden="true"
                    />
                    {item}
                  </p>
                ))}
              </article>
            </section>

            <section className="journey-detail-route">
              <div className="journey-detail-route-line" aria-hidden="true" />
              <h2>Hành trình khám phá</h2>
              <div className="journey-detail-chapters">
                {detail.chapters.map(({ label, title, description }, index) => (
                  <article key={`${label}-${title}-${index}`}>
                    <span>{label}</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="journey-detail-side">
            <section className="journey-detail-station-card">
              <div className="journey-detail-stamp">
                <img src={`${detailAssetBase}/desktop-icon/ic-lau-dai.svg`} alt="" aria-hidden="true" />
              </div>
              <p className="journey-detail-eyebrow">Trạm dừng chân</p>
              <h2>{activeStation.name} Station</h2>

              <dl>
                <div>
                  <dt>Giờ mở cửa</dt>
                  <dd>{activeStation.hours}</dd>
                </div>
                <div>
                  <dt>Trạng thái</dt>
                  <dd className="is-open">Đang hoạt động</dd>
                </div>
              </dl>

              <div className="journey-detail-ar-guide">
                <h3>Hướng dẫn check-in AR</h3>
                {[
                  "Bật dịch vụ định vị trên thiết bị di động.",
                  "Quét mã QR tại trạm để truy cập cổng thực tế ảo.",
                  "Hướng camera về phía khu vực được đánh dấu.",
                  "Chạm vào màn hình để tương tác và đóng dấu.",
                ].map((step, index) => (
                  <p key={step}>
                    <span>{index + 1}</span>
                    {step}
                  </p>
                ))}
              </div>

              <div className="journey-detail-qr">
                <img src={`${detailAssetBase}/desktop-icon/qr-mockup.svg`} alt={`QR trải nghiệm ${activeStation.name}`} loading="lazy" decoding="async" />
              </div>

              <a className="journey-detail-primary-action" href={`/checkin/${activeStation.slug || activeStation.id}`}>
                <img src={`${detailAssetBase}/desktop-icon/ic-mo-trai-nghiem-qr.svg`} alt="" aria-hidden="true" />
                Mở trải nghiệm AR
              </a>

              <form className="journey-detail-code-form">
                <strong>Không mở được AR?</strong>
                <label htmlFor="station-code">Nhập mã ngay tại quầy để nhận dấu trực tiếp vào hộ chiếu di sản.</label>
                <div>
                  <input id="station-code" type="text" placeholder="Nhập mã xác thực" />
                  <button type="button" aria-label="Đóng dấu passport">
                    <img src="/assets/view-ar/desktop-app/ic-dong-dau-passport.svg" alt="" aria-hidden="true" />
                  </button>
                </div>
              </form>
            </section>

            <section className="journey-detail-offer">
              <strong>Ưu đãi đặc quyền</strong>
              <p>Hoàn thành bộ dấu {activeStation.name} để nhận món quà di sản đặc biệt tại Trung tâm Du khách.</p>
            </section>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
