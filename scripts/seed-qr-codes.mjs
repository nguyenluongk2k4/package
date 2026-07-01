import fs from "node:fs";
import { initializeApp, applicationDefault, cert, getApps } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import XLSX from "xlsx";

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

// 1. Load environment configs
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
  console.error("❌ Thất bại: Thiếu NEXT_PUBLIC_FIREBASE_PROJECT_ID trong .env.local.");
  process.exit(1);
}

// 2. Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    projectId,
  });
}

const db = getFirestore();
const xlsxPath = "./public/qr.xlsx";

async function seedQrCodes() {
  if (!fs.existsSync(xlsxPath)) {
    console.error(`❌ Thất bại: Không tìm thấy file Excel tại đường dẫn ${xlsxPath}`);
    process.exit(1);
  }

  console.log("📖 Đang đọc file Excel public/qr.xlsx...");
  const workbook = XLSX.readFile(xlsxPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  if (rows.length === 0) {
    console.error("❌ Thất bại: File Excel rỗng hoặc sai định dạng.");
    process.exit(1);
  }

  console.log(`🔍 Tìm thấy ${rows.length} mã trong file Excel.`);
  const batch = db.batch();
  let count = 0;

  for (const row of rows) {
    const code = row["Activation Code"];
    if (!code) continue;

    const cleanCode = String(code).trim();
    const docRef = db.collection("activationCodes").doc(cleanCode);

    batch.set(
      docRef,
      {
        code: cleanCode,
        status: "active",
        usedBy: null,
        usedEmail: null,
        usedAt: null,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    count++;
  }

  console.log(`🚀 Đang tải lên Firestore ${count} mã kích hoạt...`);
  await batch.commit();
  console.log(`✅ Thành công! Đã thêm/cập nhật ${count} mã vào bảng activationCodes.`);
}

seedQrCodes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Gặp lỗi trong quá trình chạy script:", err);
    process.exit(1);
  });
