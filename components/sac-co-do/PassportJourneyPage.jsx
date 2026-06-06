import { stations } from "../../data/sac-co-do";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

const assetBase = "/assets/ho-chieu-hanh-trinh";

const passportStops = [
  {
    id: "trang-an",
    title: "Tràng An",
    subtitle: "Quần thể danh thắng",
    status: "completed",
    stamp: stations.find((item) => item.id === "trang-an")?.image,
  },
  {
    id: "hoa-lu",
    title: "Hoa Lư",
    subtitle: "Cố đô ngàn năm",
    status: "completed",
    stamp: stations.find((item) => item.id === "hoa-lu")?.image,
  },
  {
    id: "tam-coc",
    title: "Tam Cốc",
    subtitle: "Vịnh Hạ Long trên cạn",
    status: "locked",
    icon: `${assetBase}/mobile-icon/ic-tam-coc.svg`,
  },
  {
    id: "bai-dinh",
    title: "Bái Đính",
    subtitle: "Tâm linh hội tụ",
    status: "locked",
    icon: `${assetBase}/mobile-icon/ic-bai-dinh.svg`,
  },
  {
    id: "hang-mua",
    title: "Hang Múa",
    subtitle: "Đỉnh cao tầm mắt",
    status: "locked",
    icon: `${assetBase}/mobile-icon/ic-hang-mua.svg`,
  },
  {
    id: "thung-nham",
    title: "Thung Nham",
    subtitle: "Vườn chim trong núi",
    status: "locked",
    icon: `${assetBase}/mobile-icon/ic-thung-nham.svg`,
  },
];

const achievements = [
  {
    title: "Kẻ lữ hành tò mò",
    description: "Đã ghé thăm 2 địa điểm di sản",
    active: true,
    icon: `${assetBase}/desktop-icon/ic-leo-nui.svg`,
  },
  {
    title: "Nhiếp ảnh gia Cố đô",
    description: "Check-in tại 4 địa điểm",
    active: false,
    icon: `${assetBase}/desktop-icon/ic-thanh-tuu.svg`,
  },
];

function PassportStampCard({ stop }) {
  const unlocked = stop.status === "completed";

  return (
    <article className={`passport-stop-card ${unlocked ? "is-unlocked" : "is-locked"}`}>
      <div className="passport-stop-heading">
        <h2>{stop.title}</h2>
        <p>{stop.subtitle}</p>
      </div>

      <div className="passport-stamp-frame">
        {unlocked ? (
          <img className="passport-stamp-image" src={stop.stamp} alt={`Dấu mộc ${stop.title}`} loading="lazy" decoding="async" />
        ) : (
          <>
            <img className="passport-locked-icon" src={stop.icon} alt="" loading="lazy" decoding="async" />
            <img className="passport-lock-icon" src={`${assetBase}/desktop-icon/ic-lock.svg`} alt="" loading="lazy" decoding="async" />
          </>
        )}
      </div>

      {unlocked ? (
        <a className="passport-detail-link" href={`/checkin/${stop.id}`}>
          Xem chi tiết
          <img src={`${assetBase}/desktop-icon/ic-xem-chi-tiet.svg`} alt="" aria-hidden="true" />
        </a>
      ) : (
        <span className="passport-locked-label">Chưa mở khóa</span>
      )}
    </article>
  );
}

export default function PassportJourneyPage() {
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
          <div className="passport-progress-ring" aria-label="Tiến trình khám phá 33%">
            <span>33%</span>
            <small>Tiến trình khám phá</small>
          </div>
        </section>

        <section className="passport-progress-card" aria-label="Tiến độ hộ chiếu">
          <div>
            <span>Tiến độ</span>
            <strong>2/6 trạm</strong>
          </div>
          <strong>33%</strong>
          <div className="passport-progress-bar" aria-hidden="true">
            <span />
          </div>
          <p>“Bạn đã hoàn thành 33% hành trình di sản Ninh Bình”</p>
          <img src={`${assetBase}/desktop-icon/image-decor1.svg`} alt="" aria-hidden="true" />
        </section>

        <section className="passport-stamp-grid" aria-label="Các dấu mộc hành trình">
          {passportStops.map((stop) => (
            <PassportStampCard key={stop.id} stop={stop} />
          ))}
        </section>

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
