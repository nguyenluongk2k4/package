const productModelBase = "/assets/san-pham/models";

export const hardcodedProducts = [
  {
    id: "passport",
    slug: "pop-up-passport-ninh-binh",
    name: "Pop-up Passport Ninh Bình",
    shortName: "Passport Ninh Bình",
    category: "Sản phẩm du lịch",
    price: 150000,
    priceFormatted: "150.000đ",
    badge: "Sản phẩm chính",
    weight: "",
    description: "Cuốn sổ pop-up lưu giữ hành trình đóng dấu, check-in QR và kỷ niệm tại các điểm văn hóa tiêu biểu của Ninh Bình.",
    image: "/assets/san-pham/remove-bg/passport.png",
    href: "/san-pham/pop-up-passport-ninh-binh",
  },
  {
    id: "com-chay-dang-tui",
    slug: "com-chay-dang-tui",
    name: "Cơm Cháy Cố Đô Dạng Túi",
    shortName: "Cơm Cháy Dạng Túi",
    category: "Đặc sản Ninh Bình",
    price: 59000,
    priceFormatted: "59.000đ",
    badge: "Bán chạy",
    weight: "180g",
    description: "Miếng cơm cháy giòn rụm, vị mộc dễ ăn, gói gọn hương vị quà quê Ninh Bình cho những chuyến đi ngắn ngày.",
    image: "/assets/san-pham/remove-bg/Cơm cháy cố đô dạng túi 180g - 59k_goi-Photoroom.png",
    href: "/san-pham/com-chay-dang-tui",
  },
  {
    id: "com-chay-ruoc-dam-vi",
    slug: "com-chay-ruoc-dam-vi",
    name: "Cơm Cháy Cố Đô Ruốc Đậm Vị",
    shortName: "Cơm Cháy Ruốc",
    category: "Đặc sản Ninh Bình",
    price: 65000,
    priceFormatted: "65.000đ",
    badge: "Đậm vị",
    weight: "300g",
    description: "Lớp ruốc bông mặn ngọt phủ đều trên nền cơm cháy vàng giòn, phù hợp mua làm quà hoặc dùng chung trong nhóm.",
    image: "/assets/san-pham/remove-bg/Cơm cháy cố đô ruốc đậm vị 300g 65k_goi-Photoroom.png",
    href: "/san-pham/com-chay-ruoc-dam-vi",
  },
  {
    id: "com-chay-vuong-lut",
    slug: "com-chay-vuong-lut",
    name: "Cơm Cháy Cố Đô Vuông Lứt",
    shortName: "Cơm Cháy Vuông Lứt",
    category: "Đặc sản Ninh Bình",
    price: 54000,
    priceFormatted: "54.000đ",
    badge: "Gạo lứt",
    weight: "210g",
    description: "Phiên bản vuông gọn với gạo lứt thơm bùi, giữ được độ giòn đặc trưng và cảm giác nhẹ nhàng khi thưởng thức.",
    image: "/assets/san-pham/remove-bg/Cơm cháy cố đô vuông lứt 210g 54k_ goi-Photoroom.png",
    href: "/san-pham/com-chay-vuong-lut",
  },
].map((product) => ({
  ...product,
  model3d: {
    glbUrl: `${productModelBase}/${product.id}.glb`,
    usdzUrl: `${productModelBase}/${product.id}.usdz`,
    posterUrl: product.image,
  },
}));

export function getHardcodedProductBySlugOrId(value) {
  return hardcodedProducts.find((product) => product.slug === value || product.id === value);
}
