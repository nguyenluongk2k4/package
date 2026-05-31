const passportOptions = [
  {
    number: "01",
    badge: "Dễ bắt đầu",
    title: "Sổ đơn tiêu chuẩn",
    description: "Một cuốn passport pop-up cho khách đi cá nhân hoặc mua thử trải nghiệm.",
    price: "150.000đ",
    icon: "/assets/passport_icon.svg",
  },
  {
    number: "02",
    badge: "Tiết kiệm 30k",
    title: "Combo đồng hành",
    description: "Hai cuốn passport cho cặp đôi, nhóm bạn hoặc gia đình nhỏ đi cùng nhau.",
    price: "270.000đ",
    icon: "/assets/combo_passport_icon.svg",
  },
  {
    number: "03",
    badge: "Quà tặng",
    title: "Hộp quà Sắc Cố Đô",
    description: "Phiên bản đóng hộp để tặng khách du lịch, đối tác hoặc người thân.",
    price: "200.000đ",
    icon: "/assets/gift_box_icon.svg",
  },
];

const productBenefits = [
  "Chất liệu cao cấp",
  "Thiết kế độc quyền",
  "Ý nghĩa lưu giữ hành trình",
];

export default function PassportVersionSection({ className = "" }) {
  return (
    <section className={`passport-version-section ${className}`.trim()} id="san-pham-noi-bat">
      <div className="passport-version-copy">
        <p className="passport-version-eyebrow">Sản phẩm</p>
        <h2>
          Chọn phiên bản
          <span>Passport</span>
        </h2>
        <div className="passport-version-ribbon">Phù hợp chuyến đi</div>
        <p className="passport-version-lead">
          Từ bản cá nhân đến combo đồng hành và hộp quà tặng.
        </p>

        <div className="passport-option-list">
          {passportOptions.map((item) => (
            <article className="passport-option-card" key={item.number}>
              <div className="passport-option-number">{item.number}</div>
              <div className="passport-option-icon" aria-hidden="true">
                <img src={item.icon} alt="" loading="lazy" decoding="async" />
              </div>
              <div className="passport-option-copy">
                <span>{item.badge}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <strong>{item.price}</strong>
            </article>
          ))}
        </div>

        <div className="passport-benefit-strip">
          {productBenefits.map((benefit) => (
            <span key={benefit}>{benefit}</span>
          ))}
        </div>
      </div>

      <div className="passport-version-visual" aria-label="Bộ sản phẩm passport Ninh Bình">
        <div className="passport-product-platform" aria-hidden="true" />
        <img className="passport-product-image" src="/assets/san-pham.png" alt="Các phiên bản Ninh Bình Passport" loading="eager" decoding="async" />
      </div>
    </section>
  );
}
