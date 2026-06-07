const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

export function getCloudinaryConfig() {
  const missingKeys = [];
  if (!cloudName) missingKeys.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  if (!uploadPreset) missingKeys.push("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET");

  return {
    cloudName,
    uploadPreset,
    isConfigured: missingKeys.length === 0,
    missingKeys,
  };
}

export async function uploadToCloudinary(file, folder = "sac-co-do") {
  const config = getCloudinaryConfig();

  if (!config.isConfigured) {
    throw new Error(`Cloudinary env missing: ${config.missingKeys.join(", ")}`);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);
  formData.append("folder", folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorText}`);
  }

  const result = await response.json();
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    bytes: result.bytes,
    format: result.format,
  };
}
