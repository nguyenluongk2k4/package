import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  stationAssets,
  stations as fallbackStations,
} from "../../data/sac-co-do";
import { hardcodedProducts as fallbackProducts } from "../../data/products";
import { uploadToCloudinary } from "../cloudinary/client";
import { getFirebaseServices } from "./client";

const defaultArCharacter = {
  id: "default-guide",
  name: "Sắc Cố Đô Guide",
  glbUrl: "/ar/sac-co-do-guide-v3.glb",
  usdzUrl: "/ar/sac-co-do-guide-v3.usdz",
  posterUrl: "",
  animations: ["Idle", "Wave", "Yes", "Sitting", "ThumbsUp", "Dance"],
  defaultAnimation: "Idle",
  isDefault: true,
  status: "active",
};

const stationArCharacters = {
  "trang-an": { id: "nibi-trang-an", name: "Nibi Trang An", glbUrl: "/ar/nibi-trang-an.glb", usdzUrl: "/ar/nibi-trang-an.usdz" },
  "hoa-lu": { id: "nibi-co-do-hoa-lu", name: "Nibi Co Do Hoa Lu", glbUrl: "/ar/nibi-co-do-hoa-lu.glb", usdzUrl: "/ar/nibi-co-do-hoa-lu.usdz" },
  "bai-dinh": { id: "nibi-bai-dinh", name: "Nibi Bai Dinh", glbUrl: "/ar/nibi-bai-dinh.glb", usdzUrl: "/ar/nibi-bai-dinh.usdz" },
  "pho-co-hoa-lu": { id: "nibi-pho-co-hoa-lu", name: "Nibi Pho Co Hoa Lu", glbUrl: "/ar/nibi-pho-co-hoa-lu.glb", usdzUrl: "/ar/nibi-pho-co-hoa-lu.usdz" },
  "tam-coc": { id: "nibi-tam-coc", name: "Nibi Tam Coc", glbUrl: "/ar/nibi-tam-coc.glb", usdzUrl: "/ar/nibi-tam-coc.usdz" },
  "hang-mua": { id: "nibi-hang-mua", name: "Nibi Hang Mua", glbUrl: "/ar/nibi-hang-mua.glb", usdzUrl: "/ar/nibi-hang-mua.usdz" },
};

const localArCharactersById = Object.fromEntries(
  Object.values(stationArCharacters).map((character) => [
    character.id,
    { ...character, posterUrl: "", animations: [], defaultAnimation: "", isDefault: false, status: "active" },
  ])
);

export function getStationArCharacter(stationId) {
  return localArCharactersById[stationArCharacters[stationId]?.id] || defaultArCharacter;
}

function publicStatusFilter(items) {
  return items.filter((item) => item.status !== "archived" && item.status !== "draft");
}

export function normalizeStation(snapshot) {
  const data = snapshot.data ? snapshot.data() : snapshot;
  const id = snapshot.id || data.id || data.slug;
  const heroImage = data.heroImage || data.image || stationAssets[id]?.hero || "";

  return {
    ...data,
    id,
    slug: data.slug || id,
    image: heroImage,
    heroImage,
    gallery: data.gallery || [],
    mapImage: data.mapImage || "",
    status: data.status || "published",
    sortOrder: data.sortOrder ?? 999,
    isFeatured: data.isFeatured ?? true,
  };
}

export function normalizeProduct(snapshot) {
  const data = snapshot.data ? snapshot.data() : snapshot;
  const id = snapshot.id || data.id || data.slug;
  const images = data.images || (data.image ? [data.image] : []);

  return {
    ...data,
    id,
    slug: data.slug || id,
    image: data.image || images[0] || "",
    homeImage: data.homeImage || "",
    images,
    detailImages: data.detailImages || images,
    status: data.status || "published",
    sortOrder: data.sortOrder ?? 999,
    showOnHome: data.showOnHome ?? true,
    showOnProductList: data.showOnProductList ?? true,
    priceFormatted:
      data.priceFormatted || new Intl.NumberFormat("vi-VN").format(data.price || 0) + "đ",
  };
}

export function getFallbackStations() {
  return fallbackStations.map((station, index) =>
    normalizeStation({
      ...station,
      slug: station.slug || station.id,
      heroImage: station.image,
      status: "published",
      sortOrder: index,
      isFeatured: true,
    })
  );
}

export function getFallbackProducts() {
  return fallbackProducts.map((product, index) =>
    normalizeProduct({
      ...product,
      slug: product.slug || product.id,
      images: product.images || [product.image],
      detailImages: product.detailImages || [product.image],
      status: "published",
      sortOrder: index,
      showOnHome: true,
      showOnProductList: true,
    })
  );
}

export async function getPublicStations() {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) {
    return getFallbackStations();
  }

  try {
    const stationQuery = query(collection(db, "stations"), where("status", "==", "published"));
    const snapshot = await getDocs(stationQuery);
    const stations = snapshot.docs.map(normalizeStation).sort((a, b) => a.sortOrder - b.sortOrder);
    const filtered = publicStatusFilter(stations);
    return filtered.length ? filtered : getFallbackStations();
  } catch (error) {
    console.warn("Falling back to local stations:", error);
    return getFallbackStations();
  }
}

export async function getPublicProducts() {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) {
    return getFallbackProducts();
  }

  try {
    const productQuery = query(collection(db, "products"), where("status", "==", "published"));
    const snapshot = await getDocs(productQuery);
    const products = snapshot.docs.map(normalizeProduct).sort((a, b) => a.sortOrder - b.sortOrder);
    const filtered = publicStatusFilter(products);
    return filtered.length ? filtered : getFallbackProducts();
  } catch (error) {
    console.warn("Falling back to local products:", error);
    return getFallbackProducts();
  }
}

export async function getProductBySlugOrId(productId) {
  const products = await getPublicProducts();
  return products.find((product) => product.id === productId || product.slug === productId) || null;
}

export async function getStationBySlugOrId(stationId) {
  const stations = await getPublicStations();
  return stations.find((station) => station.id === stationId || station.slug === stationId) || null;
}

export async function getDefaultArCharacter(characterId) {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) {
    return localArCharactersById[characterId] || defaultArCharacter;
  }

  try {
    if (characterId) {
      const characterSnapshot = await getDoc(doc(db, "arCharacters", characterId));
      if (characterSnapshot.exists()) {
        return { id: characterSnapshot.id, ...characterSnapshot.data() };
      }

      if (localArCharactersById[characterId]) {
        return localArCharactersById[characterId];
      }
    }

    const characterQuery = query(
      collection(db, "arCharacters"),
      where("isDefault", "==", true),
      limit(1)
    );
    const snapshot = await getDocs(characterQuery);
    return snapshot.docs[0]
      ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
      : localArCharactersById[characterId] || defaultArCharacter;
  } catch (error) {
    console.warn("Falling back to default AR character:", error);
    return localArCharactersById[characterId] || defaultArCharacter;
  }
}

export async function upsertDocument(collectionName, id, data) {
  const { db } = getFirebaseServices();
  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  if (id) {
    await setDoc(doc(db, collectionName, id), payload, { merge: true });
    return id;
  }

  const docRef = await addDoc(collection(db, collectionName), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function archiveDocument(collectionName, id) {
  const { db } = getFirebaseServices();
  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  await updateDoc(doc(db, collectionName, id), {
    status: "archived",
    updatedAt: serverTimestamp(),
  });
}

export async function uploadAdminFile(path, file) {
  const folder = path
    .split("/")
    .filter(Boolean)
    .slice(0, -1)
    .join("/");
  const uploaded = await uploadToCloudinary(file, folder || "sac-co-do/admin");
  return uploaded.url;
}
