import fs from "node:fs";
import { initializeApp, applicationDefault, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { stations } from "../data/sac-co-do.js";
import { hardcodedProducts } from "../data/products.js";

function loadLocalEnv(fileName) {
  if (!fs.existsSync(fileName)) return;

  const content = fs.readFileSync(fileName, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=");
    }
  }
}

loadLocalEnv(".env.local");

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8"));
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  return null;
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const serviceAccount = getServiceAccount();

if (!projectId) {
  console.error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    projectId,
  });
}

const db = getFirestore();
const auth = getAuth();
const seedMode = process.argv[2] || "all";

function serverTimestamp() {
  return FieldValue.serverTimestamp();
}

function saleCompareAtPrice(value) {
  const price = Number(value || 0);
  if (!price) return 0;

  const min = Math.ceil((price * 1.05) / 1000);
  const max = Math.floor((price * 1.1) / 1000);
  const candidates = [];

  for (let amount = min; amount <= max; amount += 1) {
    candidates.push(amount);
  }

  const target = (price / 1000) * 1.08;
  const saleEndingCandidates = candidates.filter((amount) => amount % 10 === 9);
  const choices = saleEndingCandidates.length ? saleEndingCandidates : candidates;
  const closest = choices.reduce((best, amount) =>
    Math.abs(amount - target) < Math.abs(best - target) ? amount : best,
  choices[0]);

  return closest * 1000;
}

function slugFrom(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seedStations() {
  await Promise.all(
    stations.map((station, index) => {
      const id = station.slug || station.id || slugFrom(station.name);
      return db.collection("stations").doc(id).set(
        {
          ...station,
          slug: station.slug || id,
          status: station.status || "published",
          isFeatured: station.isFeatured ?? true,
          sortOrder: station.sortOrder ?? index,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    })
  );
}

async function seedProducts() {
  await Promise.all(
    hardcodedProducts.map((product, index) => {
      const id = product.slug || product.id || slugFrom(product.name);

      const payload = {
        id: product.id || id,
        slug: product.slug || id,
        name: product.name || "",
        shortName: product.shortName || product.name || "",
        description: product.description || "",
        story: product.story || "",
        storyTitle: product.storyTitle || "",
        price: Number(product.price || 0),
        priceFormatted: product.priceFormatted || "",
        compareAtPrice: Number(product.compareAtPrice || saleCompareAtPrice(product.price)),
        saleLabel: product.saleLabel || "Ưu đãi hành trình",
        weight: product.weight || "",
        badge: product.badge || "",
        category: product.category || "",
        status: product.status || "published",
        sortOrder: product.sortOrder ?? index,
        showOnHome: product.showOnHome ?? true,
        showOnProductList: product.showOnProductList ?? true,
        homePlacement: product.homePlacement || "",
        image: product.image || "",
        homeImage: product.homeImage || product.image || "",
        images: product.images || (product.image ? [product.image] : []),
        detailImages: product.detailImages || product.images || (product.image ? [product.image] : []),
        features: product.features || [],
        variants: product.variants || [],
        href: product.href || `/san-pham/${product.slug || id}`,
        ingredients: product.ingredients || "",
        usage: product.usage || "",
        shelfLife: product.shelfLife || "",
        storage: product.storage || "",
        note: product.note || "",
        homeVisualOffsetX: product.homeVisualOffsetX || "",
        homeVisualOffsetY: product.homeVisualOffsetY || "",
        model3d: {
          glbUrl: "",
          usdzUrl: "",
          posterUrl: "",
        },
        updatedAt: serverTimestamp(),
      };

      return db.collection("products").doc(id).set(
        payload,
        { merge: true }
      );
    })
  );
}

async function seedProductSales() {
  const snapshot = await db.collection("products").get();

  if (snapshot.empty) {
    await seedProducts();
    return;
  }

  await Promise.all(
    snapshot.docs.map((productDoc) => {
      const product = productDoc.data();
      const price = Number(product.price || 0);
      const variants = Array.isArray(product.variants)
        ? product.variants.map((variant) => ({
            ...variant,
            compareAtPrice: saleCompareAtPrice(variant.price),
          }))
        : [];

      return productDoc.ref.set(
        {
          storyTitle: product.storyTitle || "",
          compareAtPrice: saleCompareAtPrice(price),
          saleLabel: product.saleLabel || "Ưu đãi hành trình",
          variants,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    })
  );
}

const PRODUCT_TRANSLATABLE_FIELDS = [
  "name",
  "shortName",
  "category",
  "description",
  "story",
  "storyTitle",
  "badge",
  "ingredients",
  "usage",
  "shelfLife",
  "storage",
  "note",
  "saleLabel",
  "saleNote",
];

// Only writes "<field>_en" keys (merge:true), never touches price, images, status,
// or any other field — safe to run even if admins have already customized products
// directly in Firestore beyond what's in data/products.js.
async function seedProductTranslations() {
  await Promise.all(
    hardcodedProducts.map((product) => {
      const id = product.slug || product.id || slugFrom(product.name);
      const payload = {};

      for (const field of PRODUCT_TRANSLATABLE_FIELDS) {
        const enValue = product[`${field}_en`];
        if (enValue) {
          payload[`${field}_en`] = enValue;
        }
      }

      if (Object.keys(payload).length === 0) {
        return Promise.resolve();
      }

      payload.updatedAt = serverTimestamp();

      return db.collection("products").doc(id).set(payload, { merge: true });
    })
  );
}

async function seedPassportProduct() {
  const detailImages = [
    "/assets/san-pham/pop-up-passport/IMG_3447.JPG",
    "/assets/san-pham/pop-up-passport/IMG_3448.JPG",
    "/assets/san-pham/pop-up-passport/IMG_3449.JPG",
    "/assets/san-pham/pop-up-passport/IMG_3450.JPG",
    "/assets/san-pham/pop-up-passport/IMG_3451.JPG",
    "/assets/san-pham/pop-up-passport/IMG_3452.JPG",
    "/assets/san-pham/pop-up-passport/IMG_3453.JPG",
  ];
  const removeBackgroundImage = "/assets/san-pham/remove-bg/popup-passport.png";

  await db.collection("products").doc("pop-up-passport-ninh-binh").set(
    {
      id: "passport",
      slug: "pop-up-passport-ninh-binh",
      price: 289000,
      priceFormatted: "289.000đ",
      compareAtPrice: 329000,
      saleLabel: "Ưu đãi hành trình",
      image: removeBackgroundImage,
      homeImage: removeBackgroundImage,
      images: [removeBackgroundImage, ...detailImages],
      detailImages,
      href: "/san-pham/pop-up-passport-ninh-binh",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

async function seedDefaultArCharacter() {
  await db.collection("arCharacters").doc("sac-co-do-guide").set(
    {
      name: "Hướng dẫn viên Sắc Cố Đô",
      glbUrl: "/ar/sac-co-do-guide-v3.glb",
      usdzUrl: "/ar/sac-co-do-guide-v3.usdz",
      posterUrl: "",
      animations: ["Idle"],
      defaultAnimation: "Idle",
      isDefault: true,
      status: "active",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

async function getOrCreateAdminUser() {
  const configuredUid = process.env.FIREBASE_ADMIN_UID;
  const adminEmail = process.env.FIREBASE_ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const adminPassword = process.env.FIREBASE_ADMIN_PASSWORD;

  if (configuredUid) {
    return { uid: configuredUid, email: adminEmail || "" };
  }

  if (!adminEmail || !adminPassword) {
    return null;
  }

  try {
    const user = await auth.getUserByEmail(adminEmail);
    return { uid: user.uid, email: user.email || adminEmail };
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }

    const user = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: "Sắc Cố Đô Admin",
      emailVerified: true,
    });
    return { uid: user.uid, email: user.email || adminEmail };
  }
}

async function seedAdminUser() {
  const adminUser = await getOrCreateAdminUser();

  if (!adminUser?.uid) {
    console.log("Skipping admin seed. Set FIREBASE_ADMIN_UID or FIREBASE_ADMIN_EMAIL + FIREBASE_ADMIN_PASSWORD.");
    return;
  }

  await db.collection("adminUsers").doc(adminUser.uid).set(
    {
      active: true,
      role: "admin",
      email: adminUser.email || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`Admin seeded: ${adminUser.email || adminUser.uid}`);
}

if (seedMode === "products-only") {
  await seedProducts();
  console.log("Firebase product seed completed.");
} else if (seedMode === "product-translations-only") {
  await seedProductTranslations();
  console.log("Firebase product translation (_en fields) seed completed.");
} else if (seedMode === "product-sales-only") {
  await seedProductSales();
  console.log("Firebase product sale metadata seed completed.");
} else if (seedMode === "passport-only") {
  await seedPassportProduct();
  console.log("Firebase passport product seed completed.");
} else {
  await seedStations();
  await seedProducts();
  await seedDefaultArCharacter();
  await seedAdminUser();
  console.log("Firebase seed completed.");
}
