import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export const DEFAULT_COMMERCE_SETTINGS = {
  baseShippingFee: 0,
  freeShippingThreshold: 0,
  defaultProvince: "",
  notes: "",
  facebookUrl: "https://m.me/1063895426816810",
  zaloUrl: "https://zalo.me/0962216876",
};

function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function normalizeCommerceSettings(data = {}) {
  return {
    baseShippingFee: Math.max(0, toNumber(data.baseShippingFee, DEFAULT_COMMERCE_SETTINGS.baseShippingFee)),
    freeShippingThreshold: Math.max(0, toNumber(data.freeShippingThreshold, DEFAULT_COMMERCE_SETTINGS.freeShippingThreshold)),
    defaultProvince: String(data.defaultProvince || DEFAULT_COMMERCE_SETTINGS.defaultProvince || ""),
    notes: String(data.notes || DEFAULT_COMMERCE_SETTINGS.notes || ""),
    facebookUrl: String(data.facebookUrl || DEFAULT_COMMERCE_SETTINGS.facebookUrl || "").trim(),
    zaloUrl: String(data.zaloUrl || DEFAULT_COMMERCE_SETTINGS.zaloUrl || "").trim(),
  };
}

export async function loadCommerceSettings(db) {
  if (!db) {
    return DEFAULT_COMMERCE_SETTINGS;
  }

  const snapshot = await getDoc(doc(db, "appSettings", "commerce"));
  if (!snapshot.exists()) {
    return DEFAULT_COMMERCE_SETTINGS;
  }

  return normalizeCommerceSettings(snapshot.data());
}

export async function saveCommerceSettings(db, values) {
  if (!db) {
    throw new Error("Firebase chưa sẵn sàng.");
  }

  const normalized = normalizeCommerceSettings(values);
  await setDoc(
    doc(db, "appSettings", "commerce"),
    {
      ...normalized,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return normalized;
}
