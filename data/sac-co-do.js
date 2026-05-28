export const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/hanh-trinh", label: "Hành trình" },
  { href: "/kich-hoat", label: "Kích hoạt" },
  { href: "/ve-chung-toi", label: "Về chúng tôi" },
];

export const brand = {
  name: "Sắc Cố Đô",
  tagline: "Pop-up passport Ninh Bình",
  description:
    "Một cuốn sổ lưu niệm mở ra hành trình đóng dấu, check-in QR và lưu ảnh tại các điểm văn hóa tiêu biểu của Ninh Bình.",
  primaryCta: { href: "/san-pham", label: "Chọn sổ passport" },
  secondaryCta: { href: "/hanh-trinh", label: "Xem hành trình" },
};

export const heroSlides = [
  {
    eyebrow: "Sưu tầm dấu ấn cố đô",
    title: "Mang Ninh Bình vào một cuốn passport pop-up",
    description:
      "Đi qua từng trạm văn hóa, quét QR, đóng dấu vào sổ và mở khóa photobooth kỷ niệm trên hành trình của riêng bạn.",
    image: "/gowilds/assets/images/hero/hero-four_img-1.jpg",
  },
  {
    eyebrow: "Check-in có câu chuyện",
    title: "Từ Tràng An đến Hoa Lư, mỗi điểm là một lớp ký ức",
    description:
      "Sắc Cố Đô kết hợp vật phẩm giấy, trải nghiệm số và bản đồ điểm đến để chuyến đi có thứ để giữ lại.",
    image: "/gowilds/assets/images/place/place-20.jpg",
  },
];

export const proofStats = [
  { value: "06", label: "trạm trải nghiệm" },
  { value: "03", label: "gói sản phẩm" },
  { value: "01", label: "mã ID cá nhân" },
  { value: "100%", label: "mobile-first" },
];

export const steps = [
  {
    number: "01",
    title: "Mua sổ passport",
    description: "Chọn gói Sắc Cố Đô, nhận cuốn sổ pop-up kèm mã ID in riêng.",
  },
  {
    number: "02",
    title: "Kích hoạt ID",
    description: "Nhập mã SCD trên website để mở hành trình cá nhân trên thiết bị.",
  },
  {
    number: "03",
    title: "Đi trạm và đóng dấu",
    description: "Quét QR tại điểm đến, nhập mã ngày, mở photobooth và phần thưởng số.",
  },
];

export const stations = [
  {
    id: "trang-an",
    name: "Tràng An",
    image: "/gowilds/assets/images/place/place-20.jpg",
    tag: "Non nước",
    hours: "07:00 - 17:00",
    stamp: "Dấu sóng đá vôi",
    description:
      "Không gian di sản với núi đá vôi và dòng nước xanh, phù hợp làm trạm mở đầu của hành trình.",
  },
  {
    id: "hoa-lu",
    name: "Cố Đô Hoa Lư",
    image: "/gowilds/assets/images/place/place-21.jpg",
    tag: "Kinh đô xưa",
    hours: "07:00 - 17:00",
    stamp: "Dấu cổng thành",
    description:
      "Dấu mốc lịch sử của vùng đất cố đô, nơi cuốn passport bắt đầu kể chuyện bằng ký ức triều đại.",
  },
  {
    id: "bai-dinh",
    name: "Chùa Bái Đính",
    image: "/gowilds/assets/images/place/place-22.jpg",
    tag: "Tâm linh",
    hours: "06:00 - 18:00",
    stamp: "Dấu chuông đồng",
    description:
      "Một trạm lắng và rộng, dành cho trải nghiệm đóng dấu sau khi đi qua hành lang văn hóa tâm linh.",
  },
  {
    id: "pho-co-hoa-lu",
    name: "Phố Cổ Hoa Lư",
    image: "/gowilds/assets/images/place/place-23.jpg",
    tag: "Đêm phố",
    hours: "08:00 - 22:00",
    stamp: "Dấu đèn phố",
    description:
      "Sắc đèn, mái ngói và nhịp dạo chơi chậm rãi, phù hợp cho check-in và photobooth kỷ niệm.",
  },
  {
    id: "tam-coc",
    name: "Tam Cốc - Bích Động",
    image: "/gowilds/assets/images/place/place-24.jpg",
    tag: "Sông núi",
    hours: "07:00 - 17:30",
    stamp: "Dấu thuyền lúa",
    description:
      "Một lát cắt mềm mại của Ninh Bình, nơi trải nghiệm giấy pop-up gặp cảnh quan ngoài đời.",
  },
  {
    id: "hang-mua",
    name: "Hang Múa",
    image: "/gowilds/assets/images/place/place-25.jpg",
    tag: "Tầm nhìn",
    hours: "06:00 - 18:00",
    stamp: "Dấu long đỉnh",
    description:
      "Trạm kết giàu năng lượng với góc nhìn toàn cảnh, mở khóa phần thưởng sau khi hoàn thành hành trình.",
  },
];

export const packages = [
  {
    id: "single",
    name: "Sổ Đơn Tiêu Chuẩn",
    shortName: "Sổ Đơn Tiêu Chuẩn",
    subtitle: "1 cuốn sổ + 1 mã",
    price: 150000,
    priceFormatted: "150.000đ",
    image: "/gowilds/assets/images/shop/product-big-1.jpg",
    badge: "Dễ bắt đầu",
    description: "Một cuốn passport pop-up cho khách đi cá nhân hoặc mua thử trải nghiệm.",
    features: [
      "01 cuốn sổ pop-up Sắc Cố Đô",
      "01 mã ID kích hoạt SCD",
      "Bản đồ check-in 6 trạm",
      "Mở khóa photobooth và certificate",
    ],
  },
  {
    id: "combo",
    name: "Combo Đồng Hành",
    shortName: "Combo Đồng Hành (2 Sổ)",
    subtitle: "2 cuốn sổ + 2 mã",
    price: 270000,
    priceFormatted: "270.000đ",
    image: "/gowilds/assets/images/shop/product-big-2.jpg",
    badge: "Tiết kiệm 30k",
    description: "Hai cuốn passport cho cặp đôi, nhóm bạn hoặc gia đình nhỏ đi cùng nhau.",
    features: [
      "02 cuốn sổ pop-up Sắc Cố Đô",
      "02 mã ID kích hoạt riêng",
      "Theo dõi tiến độ từng người",
      "Gợi ý lịch trình đi trong ngày",
    ],
  },
  {
    id: "gift",
    name: "Hộp Quà Sắc Cố Đô",
    shortName: "Hộp Quà Tặng Sắc Cố Đô",
    subtitle: "Đóng hộp quà tặng",
    price: 200000,
    priceFormatted: "200.000đ",
    image: "/gowilds/assets/images/shop/mockup.png",
    badge: "Quà tặng",
    description: "Phiên bản đóng hộp để tặng khách du lịch, đối tác hoặc người thân.",
    features: [
      "01 cuốn sổ pop-up bản quà tặng",
      "Thiệp lời nhắn cá nhân",
      "Hộp bảo vệ và tem niêm phong",
      "Mã ID kích hoạt đầy đủ tính năng",
    ],
  },
];

export const values = [
  {
    title: "Giữ ký ức bằng vật phẩm thật",
    description: "Cuốn sổ có pop-up, dấu mộc và chất liệu cầm nắm được, để chuyến đi không trôi qua như một album ảnh.",
  },
  {
    title: "Kết nối offline và online",
    description: "Mỗi trạm có QR, mã ngày, photobooth và dữ liệu tiến độ để người dùng vừa đi vừa mở khóa nội dung.",
  },
  {
    title: "Tôn trọng bản sắc địa phương",
    description: "Hình ảnh, điểm đến và câu chuyện được thiết kế xoay quanh tinh thần cố đô Ninh Bình.",
  },
];

export const gallery = [
  "/gowilds/assets/images/gallery/gallery-7.jpg",
  "/gowilds/assets/images/gallery/gallery-8.jpg",
  "/gowilds/assets/images/gallery/gallery-9.jpg",
  "/gowilds/assets/images/place/des-single-1.jpg",
  "/gowilds/assets/images/place/des-single-2.jpg",
  "/gowilds/assets/images/gallery/cta.jpg",
];
