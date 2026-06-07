import fs from "node:fs";
import { initializeApp, applicationDefault, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { stations, souvenirProducts } from "../data/sac-co-do.js";

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

function serverTimestamp() {
  return FieldValue.serverTimestamp();
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
    souvenirProducts.map((product, index) => {
      const id = product.slug || product.id || slugFrom(product.name);
      return db.collection("products").doc(id).set(
        {
          ...product,
          slug: product.slug || id,
          status: product.status || "published",
          showOnHome: product.showOnHome ?? index < 3,
          showOnProductList: product.showOnProductList ?? true,
          sortOrder: product.sortOrder ?? index,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    })
  );
}

async function seedDefaultArCharacter() {
  await db.collection("arCharacters").doc("sac-co-do-guide").set(
    {
      name: "Hướng dẫn viên Sắc Cố Đô",
      glbUrl: "/ar/sac-co-do-guide.glb",
      usdzUrl: "/ar/sac-co-do-guide.usdz",
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

await seedStations();
await seedProducts();
await seedDefaultArCharacter();
await seedAdminUser();

console.log("Firebase seed completed.");
