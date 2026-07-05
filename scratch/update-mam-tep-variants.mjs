import fs from "node:fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (!projectId || !serviceAccountBase64) {
  console.error("Missing config keys.");
  process.exit(1);
}

const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, "base64").toString("utf8"));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId,
  });
}

const db = getFirestore();

async function updateVariants() {
  const docId = "thit-chung-mam-tep-thanh-nguyen";
  console.log(`Updating variants for product: ${docId}...`);
  
  const variants = [
    { label: "Hũ 275g", price: 175000, priceFormatted: "175.000đ" },
    { label: "Hũ 90g", price: 65000, priceFormatted: "65.000đ" }
  ];

  await db.collection("products").doc(docId).update({
    variants: variants
  });

  console.log("Successfully updated variants in Firestore!");
}

updateVariants().catch(console.error);
