import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
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
