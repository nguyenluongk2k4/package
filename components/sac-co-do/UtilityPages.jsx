import { gallery, packages, stations } from "../../data/sac-co-do";
import SectionTitle from "./SectionTitle";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export function CartPage() {
  return (
    <UtilityPage
      eyebrow="Giỏ hàng"
      title="Giỏ hàng của bạn"
      description="Giao diện này giữ chỗ cho luồng chọn gói, số lượng và thanh toán."
    >
      <div className="cart-row">
        <img src={packages[0].image} alt={packages[0].name} />
        <div>
          <h3>{packages[0].name}</h3>
          <p>01 cuốn · Mã ID sẽ được tạo sau khi thanh toán</p>
        </div>
        <strong>{packages[0].priceFormatted}</strong>
      </div>
    </UtilityPage>
  );
}

export function DashboardPage() {
  return (
    <UtilityPage
      eyebrow="Của tôi"
      title="Tiến độ passport cá nhân"
      description="Màn hình tổng hợp số trạm đã đi, dấu đã nhận và phần thưởng đang mở khóa."
    >
      <div className="progress-grid">
        {stations.slice(0, 4).map((station, index) => (
          <article key={station.id}>
            <span>{index < 2 ? "Đã nhận" : "Chưa mở"}</span>
            <h3>{station.name}</h3>
            <p>{station.stamp}</p>
          </article>
        ))}
      </div>
    </UtilityPage>
  );
}

export function PhotoboothPage() {
  return (
    <UtilityPage
      eyebrow="Photobooth"
      title="Khung ảnh mở khóa theo từng trạm"
      description="Sau khi check-in, người dùng có thể dùng frame theo điểm đến để lưu ảnh kỷ niệm."
    >
      <div className="gallery-strip framed">
        {gallery.map((image) => (
          <img key={image} src={image} alt="" />
        ))}
      </div>
    </UtilityPage>
  );
}

export function RewardPage() {
  return (
    <UtilityPage
      eyebrow="Phần thưởng"
      title="Certificate và quà số sau khi hoàn thành"
      description="Hoàn thành 6 trạm để nhận certificate cá nhân và bộ ảnh lưu niệm."
    >
      <div className="reward-card">
        <span>Sắc Cố Đô</span>
        <h3>Certificate of Journey</h3>
        <p>Trao cho người đã hoàn thành đủ 6 dấu mộc Ninh Bình.</p>
      </div>
    </UtilityPage>
  );
}

export function CheckinPage({ stationId }) {
  const station = stations.find((item) => item.id === stationId) || stations[0];

  return (
    <UtilityPage
      eyebrow="Check-in"
      title={`Trạm ${station.name}`}
      description={station.description}
    >
      <div className="checkin-card">
        <img src={station.image} alt={station.name} />
        <div>
          <span className="pill">{station.tag}</span>
          <h3>{station.stamp}</h3>
          <p>Nhập mã ngày tại quầy để xác nhận dấu mộc cho passport.</p>
          <input placeholder="Mã ngày" />
        </div>
      </div>
    </UtilityPage>
  );
}

function UtilityPage({ eyebrow, title, description, children }) {
  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <SectionTitle eyebrow={eyebrow} title={title} description={description} />
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
