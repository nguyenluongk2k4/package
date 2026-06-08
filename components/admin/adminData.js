export const collectionByResource = {
  stations: "stations",
  products: "products",
  arCharacters: "arCharacters",
};

export const emptyDocs = {
  stations: {
    name: "",
    slug: "",
    tag: "",
    description: "",
    heroImage: "",
    image: "",
    gallery: [],
    mapImage: "",
    hours: "",
    stamp: "",
    status: "draft",
    isFeatured: false,
    sortOrder: 0,
    detail: {
      badge: "",
      headline: "",
      intro: "",
      history: [],
      chapters: [],
      stationCode: "",
      qrCode: "",
      offer: "",
    },
    arGuide: {
      voiceText: "",
      subtitles: [],
      stampName: "",
      modelId: "",
    },
  },
  products: {
    name: "",
    slug: "",
    shortName: "",
    description: "",
    price: 0,
    weight: "",
    badge: "",
    category: "",
    status: "draft",
    sortOrder: 0,
    showOnHome: false,
    showOnProductList: true,
    homePlacement: "",
    images: [],
    detailImages: [],
    features: [],
    variants: [],
    model3d: { glbUrl: "", usdzUrl: "", posterUrl: "" },
  },
  arCharacters: {
    name: "",
    glbUrl: "",
    usdzUrl: "",
    posterUrl: "",
    animations: [],
    defaultAnimation: "",
    isDefault: false,
    status: "draft",
  },
};

export function createId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseJson(value, fallback) {
  try {
    return value.trim() ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function stringifyJson(value) {
  return JSON.stringify(value || [], null, 2);
}
