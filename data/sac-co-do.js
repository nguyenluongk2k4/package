export const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/ho-chieu", label: "Hộ Chiếu" },
  { href: "/hanh-trinh", label: "Hành trình" },
  { href: "/kich-hoat", label: "Kích hoạt" },
  { href: "/ve-chung-toi", label: "Về chúng tôi" },
];

export const brand = {
  name: "Sắc Cố Đô",
  tagline: "Pop-up passport Ninh Bình",
  description:
    "Một cuốn sổ lưu niệm mở ra hành trình đóng dấu, check-in QR và lưu ảnh tại các điểm văn hóa tiêu biểu của Ninh Bình.",
  primaryCta: { href: "/hanh-trinh", label: "Khám phá ngay" },
  secondaryCta: { href: "/ve-chung-toi", label: "Xem video giới thiệu" },
};

const diaDanhBase = "/assets/dia-danh";
const newBrandBase = "/assets/anh-new";

export const stationAssets = {
  "trang-an": {
    map: `${diaDanhBase}/ban-do.png`,
    hero: `${diaDanhBase}/trang-an/TA1.jpg`,
    gallery: [
      `${diaDanhBase}/trang-an/TA1.jpg`,
      `${diaDanhBase}/trang-an/TA2.jpg`,
      `${diaDanhBase}/trang-an/TA3.jpg`,
      `${diaDanhBase}/trang-an/TA10.jpg`,
    ],
  },
  "hoa-lu": {
    map: `${diaDanhBase}/ban-do.png`,
    hero: `${diaDanhBase}/co-do-hoa-lu/CDHL 5.webp`,
    gallery: [
      `${diaDanhBase}/co-do-hoa-lu/CDHL 5.webp`,
      `${diaDanhBase}/co-do-hoa-lu/CĐHL 6.webp`,
      `${diaDanhBase}/co-do-hoa-lu/CĐHL 1.jpg`,
      `${diaDanhBase}/co-do-hoa-lu/CĐHL 2.jpg`,
    ],
  },
  "bai-dinh": {
    map: `${diaDanhBase}/ban-do.png`,
    hero: `${diaDanhBase}/bai-dinh/Chùa Bái Đính 1.jpg`,
    gallery: [
      `${diaDanhBase}/bai-dinh/Chùa Bái Đính 1.jpg`,
      `${diaDanhBase}/bai-dinh/Chùa Bái Đính 2.jpg`,
      `${diaDanhBase}/bai-dinh/Chùa Bái Đính 3.jpg`,
      `${diaDanhBase}/bai-dinh/Chùa bái đính 4.jpg`,
    ],
  },
  "pho-co-hoa-lu": {
    map: `${diaDanhBase}/ban-do.png`,
    hero: `${diaDanhBase}/pho-co-hoa-lu/PCHL1.jpg`,
    gallery: [
      `${diaDanhBase}/pho-co-hoa-lu/PCHL1.jpg`,
      `${diaDanhBase}/pho-co-hoa-lu/PCHL 2.jpg`,
      `${diaDanhBase}/pho-co-hoa-lu/PCHL 3.jpg`,
      `${diaDanhBase}/pho-co-hoa-lu/IMG_1021.JPG`,
    ],
  },
  "tam-coc": {
    map: `${diaDanhBase}/ban-do.png`,
    hero: `${diaDanhBase}/tam-coc-bich-dong/TC1.jpg`,
    gallery: [
      `${diaDanhBase}/tam-coc-bich-dong/TC1.jpg`,
      `${diaDanhBase}/tam-coc-bich-dong/TC2.jpg`,
      `${diaDanhBase}/tam-coc-bich-dong/TC4.jpg`,
      `${diaDanhBase}/tam-coc-bich-dong/TC5.jpg`,
    ],
  },
  "hang-mua": {
    map: `${diaDanhBase}/ban-do.png`,
    hero: `${diaDanhBase}/hang-mua/HM1.jpg`,
    gallery: [
      `${diaDanhBase}/hang-mua/HM1.jpg`,
      `${diaDanhBase}/hang-mua/HM2.jpg`,
      `${diaDanhBase}/hang-mua/HM3.jpg`,
      `${diaDanhBase}/hang-mua/HM4.jpg`,
    ],
  },
};

export const heroSlides = [
  {
    eyebrow: "Di sản nghìn năm",
    title: "Sắc Cố Đô",
    description:
      "Khám phá vẻ đẹp tiềm ẩn của Ninh Bình thông qua công nghệ AR độc đáo. Mỗi bước chân là một câu chuyện lịch sử, mỗi điểm đến là một dấu ấn trong tấm hộ chiếu di sản của riêng bạn.",
    image: stationAssets["trang-an"].hero,
  },
  {
    eyebrow: "Check-in có câu chuyện",
    title: "Từ Tràng An đến Hoa Lư, mỗi điểm là một lớp ký ức",
    description:
      "Sắc Cố Đô kết hợp vật phẩm giấy, trải nghiệm số và bản đồ điểm đến để chuyến đi có thứ để giữ lại.",
    image: stationAssets["hoa-lu"].hero,
  },
];

export const proofStats = [
  { value: "06", label: "trạm trải nghiệm" },
  { value: "03", label: "gói sản phẩm" },
  { value: "01", label: "mã ID cá nhân" }
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
    image: stationAssets["trang-an"].hero,
    gallery: stationAssets["trang-an"].gallery,
    mapImage: stationAssets["trang-an"].map,
    tag: "Non nước",
    hours: "07:00 - 17:00",
    stamp: "Dấu sóng đá vôi",
    description:
      "Không gian di sản với núi đá vôi và dòng nước xanh, phù hợp làm trạm mở đầu của hành trình.",
  },
  {
    id: "hoa-lu",
    name: "Cố Đô Hoa Lư",
    image: stationAssets["hoa-lu"].hero,
    gallery: stationAssets["hoa-lu"].gallery,
    mapImage: stationAssets["hoa-lu"].map,
    tag: "Kinh đô xưa",
    hours: "07:00 - 17:00",
    stamp: "Dấu cổng thành",
    description:
      "Dấu mốc lịch sử của vùng đất cố đô, nơi cuốn passport bắt đầu kể chuyện bằng ký ức triều đại.",
  },
  {
    id: "bai-dinh",
    name: "Chùa Bái Đính",
    image: stationAssets["bai-dinh"].hero,
    gallery: stationAssets["bai-dinh"].gallery,
    mapImage: stationAssets["bai-dinh"].map,
    tag: "Tâm linh",
    hours: "06:00 - 18:00",
    stamp: "Dấu chuông đồng",
    description:
      "Một trạm lắng và rộng, dành cho trải nghiệm đóng dấu sau khi đi qua hành lang văn hóa tâm linh.",
  },
  {
    id: "pho-co-hoa-lu",
    name: "Phố Cổ Hoa Lư",
    image: stationAssets["pho-co-hoa-lu"].hero,
    gallery: stationAssets["pho-co-hoa-lu"].gallery,
    mapImage: stationAssets["pho-co-hoa-lu"].map,
    tag: "Đêm phố",
    hours: "08:00 - 22:00",
    stamp: "Dấu đèn phố",
    description:
      "Sắc đèn, mái ngói và nhịp dạo chơi chậm rãi, phù hợp cho check-in và photobooth kỷ niệm.",
  },
  {
    id: "tam-coc",
    name: "Tam Cốc - Bích Động",
    image: stationAssets["tam-coc"].hero,
    gallery: stationAssets["tam-coc"].gallery,
    mapImage: stationAssets["tam-coc"].map,
    tag: "Sông núi",
    hours: "07:00 - 17:30",
    stamp: "Dấu thuyền lúa",
    description:
      "Một lát cắt mềm mại của Ninh Bình, nơi trải nghiệm giấy pop-up gặp cảnh quan ngoài đời.",
  },
  {
    id: "hang-mua",
    name: "Hang Múa",
    image: stationAssets["hang-mua"].hero,
    gallery: stationAssets["hang-mua"].gallery,
    mapImage: stationAssets["hang-mua"].map,
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
    image: `${newBrandBase}/frame-1.png`,
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
    image: `${newBrandBase}/vvv.jpg`,
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
    image: `${newBrandBase}/logo.png`,
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

const productBase = "/assets/san-pham";

export const souvenirProducts = [
  {
    id: "com-chay-dang-tui",
    name: "Cơm Cháy Cố Đô Dạng Túi",
    weight: "180g",
    price: 59000,
    priceFormatted: "59.000đ",
    image: `${productBase}/Cơm cháy cố đô dạng túi 180g - 59k_goi.png`,
    badge: "Bán chạy",
    description:
      "Miếng cơm cháy giòn rụm, vị mộc dễ ăn, gói gọn hương vị quà quê Ninh Bình cho những chuyến đi ngắn ngày.",
  },
  {
    id: "com-chay-ruoc-dam-vi",
    name: "Cơm Cháy Cố Đô Ruốc Đậm Vị",
    weight: "300g",
    price: 65000,
    priceFormatted: "65.000đ",
    image: `${productBase}/Cơm cháy cố đô ruốc đậm vị 300g 65k_goi.png`,
    badge: "Đậm vị",
    description:
      "Lớp ruốc bông mặn ngọt phủ đều trên nền cơm cháy vàng giòn, phù hợp mua làm quà hoặc dùng chung trong nhóm.",
  },
  {
    id: "com-chay-vuong-lut",
    name: "Cơm Cháy Cố Đô Vuông Lứt",
    weight: "210g",
    price: 54000,
    priceFormatted: "54.000đ",
    image: `${productBase}/Cơm cháy cố đô vuông lứt 210g 54k_ goi.png`,
    badge: "Gạo lứt",
    description:
      "Phiên bản vuông gọn với gạo lứt thơm bùi, giữ được độ giòn đặc trưng và cảm giác nhẹ nhàng khi thưởng thức.",
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
  `${newBrandBase}/cover photo.jpg`,
  stationAssets["trang-an"].gallery[0],
  stationAssets["hoa-lu"].gallery[0],
  stationAssets["bai-dinh"].gallery[0],
  stationAssets["pho-co-hoa-lu"].gallery[0],
  stationAssets["tam-coc"].gallery[0],
  stationAssets["hang-mua"].gallery[0],
  `${newBrandBase}/frame-1.png`,
];
