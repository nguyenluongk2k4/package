import { addDoc, collection, doc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { uploadToCloudinary } from "../cloudinary/client";

export async function saveJourneyProgress({ db, uid, stationId, stationName, source = "app", photoUrl = null }) {
  if (!db || !uid || !stationId) return false;

  const data = {
    stationId,
    stationName: stationName || stationId,
    source,
    updatedAt: serverTimestamp(),
  };

  if (photoUrl) {
    data.photoUrl = photoUrl;
  }

  await setDoc(
    doc(db, "users", uid, "journeyProgress", stationId),
    {
      ...data,
      checkedInAt: serverTimestamp(),
    },
    { merge: true }
  );

  return true;
}

export async function saveArExperience({ db, uid, stationId, stationName, modelId, status = "completed" }) {
  if (!db || !uid || !stationId) return false;

  await addDoc(collection(db, "users", uid, "arExperiences"), {
    stationId,
    stationName: stationName || stationId,
    modelId: modelId || "",
    status,
    createdAt: serverTimestamp(),
  });

  return true;
}

export async function savePhotoboothPhoto({ db, uid, blob, stationId, caption }) {
  if (!db || !uid || !blob) return null;

  const photoId = `${stationId || "photo"}-${Date.now()}`;
  const uploaded = await uploadToCloudinary(blob, `sac-co-do/users/${uid}/photobooth`);

  await setDoc(doc(db, "users", uid, "photoboothPhotos", photoId), {
    stationId: stationId || "",
    caption: caption || "",
    url: uploaded.url,
    cloudinaryPublicId: uploaded.publicId,
    createdAt: serverTimestamp(),
  });

  return { id: photoId, url: uploaded.url };
}

function normalizeDateFragment(value) {
  return String(value).padStart(2, "0");
}

export function buildOrderCode(date = new Date()) {
  const year = date.getFullYear();
  const month = normalizeDateFragment(date.getMonth() + 1);
  const day = normalizeDateFragment(date.getDate());
  const stamp = String(date.getTime()).slice(-6);
  return `SCD-${year}${month}${day}-${stamp}`;
}

export async function createOrderFromCart({
  db,
  uid,
  items,
  customer,
  shippingAddress,
  paymentMethod = "cod",
  notes = "",
  shippingFee = 35000,
  discount = 0,
}) {
  if (!db || !uid) {
    throw new Error("Firebase chua san sang.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Gio hang dang trong.");
  }

  const safeItems = items.map((item) => ({
    cartDocId: item.cartDocId || "",
    productId: item.id || item.productId || item.slug || "",
    slug: item.slug || "",
    name: item.name || "San pham",
    image: item.image || "",
    quantity: Math.max(1, Number(item.quantity || 1)),
    price: Number(item.price || 0),
  }));

  const subtotal = safeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + Number(shippingFee || 0) - Number(discount || 0);
  const orderRef = doc(collection(db, "orders"));
  const orderCode = buildOrderCode();
  const batch = writeBatch(db);

  const payload = {
    orderCode,
    userId: uid,
    customer: {
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
    },
    shippingAddress: {
      province: shippingAddress?.province || "",
      district: shippingAddress?.district || "",
      ward: shippingAddress?.ward || "",
      addressLine: shippingAddress?.addressLine || "",
    },
    items: safeItems.map(({ cartDocId, ...item }) => item),
    subtotal,
    shippingFee: Number(shippingFee || 0),
    discount: Number(discount || 0),
    total,
    paymentMethod: paymentMethod || "cod",
    paymentStatus: "pending",
    orderStatus: "pending",
    trackingCode: "",
    shippingProvider: "",
    notes: notes || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    sepay: paymentMethod === "sepay"
      ? {
          paymentGateway: "sepay",
          checkoutStatus: "pending",
          orderInvoiceNumber: orderCode,
          paymentMethodCode: "BANK_TRANSFER",
          transactionId: "",
          bankCode: "",
          transactionStatus: "",
          paidAmount: 0,
          paidAt: null,
        }
      : {},
  };

  batch.set(orderRef, payload);

  safeItems.forEach((item) => {
    if (!item.cartDocId) return;
    batch.delete(doc(db, "users", uid, "cart", item.cartDocId));
  });

  await batch.commit();

  await addDoc(collection(db, "orders", orderRef.id, "events"), {
    type: "order_created",
    from: null,
    to: "pending",
    message: paymentMethod === "sepay" ? "Nguoi dung tao don SePay cho thanh toan" : "Nguoi dung tao don COD",
    actorUid: uid,
    actorRole: "user",
    createdAt: serverTimestamp(),
  });

  if (customer?.name || customer?.phone) {
    await setDoc(doc(db, "users", uid), {
      fullName: customer?.name || "",
      displayName: customer?.name || "",
      phone: customer?.phone || "",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  return {
    id: orderRef.id,
    orderCode,
    subtotal,
    shippingFee: Number(shippingFee || 0),
    discount: Number(discount || 0),
    total,
  };
}
