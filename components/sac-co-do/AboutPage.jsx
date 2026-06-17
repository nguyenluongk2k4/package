import { Eye, Rocket } from "lucide-react";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

const coreValues = [
  {
    title: "Di sản",
    description: "Tôn vinh những giá trị văn hóa và lịch sử.",
  },
  {
    title: "Kết nối",
    description: "Gắn kết con người với điểm đến và cộng đồng địa phương.",
  },
  {
    title: "Sáng tạo",
    description: "Mang đến những trải nghiệm mới mẻ và khác biệt.",
  },
  {
    title: "Bền vững",
    description: "Phát triển hài hòa giữa kinh tế, văn hóa và cộng đồng.",
  },
  {
    title: "Lưu giữ",
    description: "Biến mỗi chuyến đi thành những ký ức đáng nhớ.",
  },
];

const missionPoints = [
  "Mang đến những trải nghiệm du lịch sáng tạo, tương tác và giàu cảm xúc.",
  "Kết nối du khách với văn hóa, lịch sử và con người địa phương.",
  "Hỗ trợ quảng bá các sản phẩm đặc trưng, làng nghề và cộng đồng bản địa.",
  "Góp phần phát triển du lịch bền vững và kinh tế sáng tạo tại Việt Nam.",
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="about-page">
        <section className="about-hero">
          <div className="about-hero-copy">
            <p className="eyebrow">Về chúng tôi</p>
            <h1 style={{ fontFamily: "var(--font-heading, 'Baloo 2'), sans-serif", fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: "800", color: "var(--ink)", lineHeight: "1.2", marginBottom: "20px" }}>
              SẮC CỐ ĐÔ – Lưu giữ hành trình, chạm đến di sản
            </h1>
            
            <h3 style={{ fontSize: "19px", color: "var(--brand-2)", fontFamily: "var(--font-heading, 'Baloo 2'), sans-serif", fontWeight: "700", lineHeight: "1.4", marginTop: "20px", marginBottom: "16px" }}>
              Liệu một chuyến đi có thể để lại nhiều hơn những bức ảnh?
            </h3>
            
            <p style={{ color: "var(--ink)", fontSize: "15px", lineHeight: "1.7", margin: "0" }}>
              Sắc Cố Đô được hình thành từ câu hỏi đơn giản ấy để kiến tạo nên những hành trình sâu sắc tại cố đô. Ninh Bình là vùng đất nơi thiên nhiên, lịch sử và văn hóa giao hòa để tạo nên những dấu ấn rất riêng. Từ Quần thể Danh thắng Tràng An, Cố đô Hoa Lư, Tam Cốc – Bích Động đến những làng nghề truyền thống và đặc sản địa phương, mỗi địa danh đều mang trong mình những câu chuyện đáng để khám phá và ghi nhớ.
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
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <p className="eyebrow">Mục tiêu & Sứ mệnh</p>
              <h2 style={{ margin: 0 }}>Hành Trình Kết Nối Di Sản & Du Khách</h2>
            </div>
            <div className="about-mission-media" style={{ width: "100%", height: "280px", borderRadius: "16px", overflow: "hidden", border: "2px solid rgba(16, 76, 39, 0.25)" }}>
              <img src="/assets/ninh-binh-heritage.png" alt="Hành trình di sản Ninh Bình" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", color: "var(--ink)", fontSize: "15px", lineHeight: "1.75" }}>
            <p>
              Tuy nhiên, giữa nhịp sống hiện đại, nhiều chuyến đi thường chỉ dừng lại ở việc tham quan và check-in. Chúng tôi tin rằng du lịch không chỉ là nhìn ngắm, mà còn là hành trình trải nghiệm, kết nối và lưu giữ những giá trị văn hóa của mỗi vùng đất.
            </p>
            <p>
              Vì vậy, SẮC CỐ ĐÔ ra đời với mong muốn xây dựng một hệ sinh thái trải nghiệm di sản sáng tạo, giúp du khách khám phá Ninh Bình theo cách mới mẻ và có chiều sâu hơn. Thông qua Hộ chiếu Di sản Pop-up, hệ thống sưu tầm dấu mộc tại các điểm đến, những câu chuyện lịch sử được kể lại theo cách gần gũi cùng mạng lưới sản phẩm đặc trưng địa phương được tuyển chọn, chúng tôi hy vọng mỗi chuyến đi sẽ trở thành một hành trình đáng nhớ.
            </p>
            <p>
              Không chỉ dừng lại ở việc quảng bá du lịch, SẮC CỐ ĐÔ mong muốn góp phần kết nối du khách với văn hóa bản địa, lan tỏa giá trị của các làng nghề, đặc sản và cộng đồng địa phương, từ đó tạo ra những giá trị bền vững cho điểm đến.
            </p>
            <p style={{ fontStyle: "italic", fontWeight: "700", color: "var(--brand)", borderLeft: "4px solid var(--brand-2)", paddingLeft: "16px", marginTop: "12px", fontSize: "16px" }}>
              "Chúng tôi tin rằng mỗi con dấu được sưu tầm, mỗi trang hộ chiếu được lấp đầy và mỗi câu chuyện được lưu giữ đều là những ký ức đẹp của hành trình khám phá."
            </p>
          </div>
        </section>

        <section className="about-vision-mission" aria-label="Tầm nhìn và Sứ mệnh">
          <div className="vision-card">
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Eye size={26} style={{ color: "var(--brand)", flexShrink: 0 }} /> Tầm Nhìn
            </h2>
            <p>
              Trở thành hệ sinh thái trải nghiệm di sản và sản phẩm địa phương hàng đầu Việt Nam, góp phần lan tỏa vẻ đẹp văn hóa và lịch sử của từng vùng đất đến với cộng đồng trong nước và quốc tế.
            </p>
          </div>

          <div className="mission-card">
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Rocket size={26} style={{ color: "var(--brand)", flexShrink: 0 }} /> Sứ Mệnh
            </h2>
            <ul className="mission-list">
              {missionPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        <section style={{ marginTop: "64px" }} aria-label="Giá trị cốt lõi">
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <p className="eyebrow" style={{ display: "inline-block" }}>Nền tảng</p>
            <h2 style={{ fontFamily: "var(--font-heading, 'Baloo 2'), sans-serif", color: "var(--ink)", fontSize: "36px", fontWeight: "800", marginTop: "8px" }}>
              Giá Trị Cốt Lõi
            </h2>
          </div>
          <div className="about-values-grid">
            {coreValues.map((item) => (
              <article key={item.title}>
                <h3 style={{ fontFamily: "var(--font-heading, 'Baloo 2'), sans-serif", color: "var(--brand)", fontSize: "22px", fontWeight: "800", marginBottom: "10px", marginTop: 0 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "14px", lineHeight: "1.5", color: "var(--muted)", margin: 0 }}>
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
