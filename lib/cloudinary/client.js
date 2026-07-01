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

export function uploadToCloudinary(file, folder = "sac-co-do", onProgress = null) {
  const config = getCloudinaryConfig();

  if (!config.isConfigured) {
    return Promise.reject(new Error(`Cloudinary env missing: ${config.missingKeys.join(", ")}`));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", config.uploadPreset);
    formData.append("folder", folder);

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            bytes: result.bytes,
            format: result.format,
          });
        } catch (err) {
          reject(new Error("Failed to parse Cloudinary response"));
        }
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.statusText} - ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during Cloudinary upload"));

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`);
    xhr.send(formData);
  });
}
