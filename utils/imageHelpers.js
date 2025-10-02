import admin from "../config/firebase.js";
import cloudinary from "../config/cloudinary.js";

export const validateFiles = (files, folder) => {
  const MAX_FILE_SIZE = 30 * 1024 * 1024;
  const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/heic",
    "image/heif",
    "image/bmp",
    "image/tiff",
    "image/webp",
  ];
  if (!files || files.length === 0) {
    return "Dosya yüklenmedi.";
  }
  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return `Geçersiz dosya tipi: ${file.mimetype}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Dosya çok büyük: ${file.originalname || "unknown"}`;
    }
  }
  if (folder === "profile_images" && files.length > 1) {
    return "Profil fotoğrafı için sadece 1 tane fotoğraf yükleyebilirsin.";
  } else if (folder !== "profile_images" && files.length > 5) {
    return "Her ilan için maksimum 5 fotoğraf yüklenebilir.";
  }
  return null;
};

// Cloudinary upload öncesi resim düzenlemeleri
const getTransformation = (folder) => {
  if (folder === "profile_images") {
    return [
      { width: 400, height: 400, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ];
  } else if (folder.includes("Listings")) {
    return [
      { width: 1200, height: 1200, crop: "limit" },
      { quality: "auto:good" },
      { fetch_format: "auto" },
    ];
  } else {
    return [];
  }
};

export const uploadToCloudinary = async (file, folder) => {
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    transformation: getTransformation(folder),
  });
  return { url: result.secure_url, publicId: result.public_id };
};

export const deleteCloudinaryFolder = async (folderPrefix) => {
  try {
    await cloudinary.api.delete_resources_by_prefix(folderPrefix);
    await cloudinary.api.delete_folder(folderPrefix);
  } catch (err) {
    console.warn("Cloudinary folder deletion failed:", err.message);
  }
};

export const updateFirestoreArrayField = async (docRef, field, values) => {
  const batch = admin.firestore().batch();
  values.forEach((val) => {
    batch.set(
      docRef,
      { [field]: admin.firestore.FieldValue.arrayUnion(val) },
      { merge: true }
    );
  });
  await batch.commit();
};
