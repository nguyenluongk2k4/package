import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

const principles = [
  {
    title: "Di sản có thể chạm",
    description: "Mỗi điểm đến được chuyển thành một dấu mộc, một vật phẩm giấy và một khoảnh khắc check-in có thể lưu lại.",
  },
  {
    title: "Công nghệ đứng sau trải nghiệm",
    description: "AR, QR và passport số chỉ xuất hiện khi cần, giúp hành trình ngoài đời vẫn là trung tâm.",
  },
  {
    title: "Mở rộng theo mùa",
    description: "Hệ thống trạm có thể bổ sung tuyến mới, nội dung mới và phần thưởng mới mà không phá vỡ cấu trúc sản phẩm.",
  },
];

const milestones = [
  ["01", "Khảo sát tuyến", "Chọn các điểm có câu chuyện rõ, dễ định vị và phù hợp hành vi tham quan."],
  ["02", "Thiết kế dấu mộc", "Biến biểu tượng của từng trạm thành ngôn ngữ đồ họa thống nhất."],
  ["03", "Kết nối AR", "Gắn nội dung thuyết minh, check-in và passport số vào đúng ngữ cảnh."],
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="about-page">
        <section className="about-hero">
          <div className="about-hero-copy">
            <p className="eyebrow">Về chúng tôi</p>
            <h1>Sắc Cố Đô biến chuyến đi Ninh Bình thành một bộ sưu tập dấu ấn.</h1>
            <p>
              Dự án kết hợp thiết kế passport giấy, bản đồ trải nghiệm và công nghệ AR để mỗi điểm đến có một lý do dừng lại,
              một câu chuyện để nghe và một dấu mộc để mang về.
            </p>
            <div className="about-hero-actions">
              <a className="btn primary" href="/hanh-trinh">Xem hành trình</a>
              <a className="btn ghost" href="/ho-chieu">Xem hộ chiếu</a>
            </div>
          </div>
          <figure className="about-hero-media">
            <img src="/assets/anh-new/cover photo.jpg" alt="Sắc Cố Đô - Hành trình di sản Ninh Bình" decoding="async" fetchPriority="high" />
            <figcaption>Passport văn hóa cho hành trình di sản.</figcaption>
          </figure>
        </section>

        <section className="about-mission">
          <div>
            <p className="eyebrow">Mục tiêu</p>
            <h2>Giữ nhịp khám phá thật, thêm lớp ghi nhớ số.</h2>
          </div>
          <p>
            Sắc Cố Đô không thay thế trải nghiệm tham quan bằng màn hình. Website và AR chỉ đóng vai trò mở khóa thuyết minh,
            hướng dẫn check-in và lưu tiến trình, để du khách vẫn nhìn cảnh thật, đi tuyến thật và có vật chứng thật sau chuyến đi.
          </p>
        </section>

        <section className="about-principles" aria-label="Nguyên tắc thiết kế">
          {principles.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </section>

        <section className="about-process">
          <div className="about-process-heading">
            <p className="eyebrow">Cách chúng tôi xây dựng</p>
            <h2>Từ địa điểm thật đến passport số</h2>
          </div>
          <div className="about-process-list">
            {milestones.map(([number, title, description]) => (
              <article key={number}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
