import admin from "../config/firebase.js";
import cloudinary from "../config/cloudinary.js";
import FormData from "form-data";
import axios from "axios";
import { getTransformation } from "../utils/functions.js";

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];

const validateFiles = (files, folder) => {
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

export const uploadImages = async (req, res) => {
  try {
    console.log("=== UPLOAD REQUEST START ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("Files:", req.files?.map(f => ({
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    })));

    const idToken = req.headers.authorization?.replace("Bearer ", "");
    if (!idToken) {
      console.warn("Missing Authorization header");
      return res
        .status(401)
        .json({ success: false, error: "Authorization token required" });
    }

    console.log("Verifying token...");
    await admin.auth().verifyIdToken(idToken);
    console.log("Token verified ✅");

    const { userId, folder, listingId } = req.body;
    if (!userId || !folder) {
      console.warn("Missing userId or folder in body", { userId, folder });
      return res
        .status(400)
        .json({ success: false, error: "userId and folder are required" });
    }

    const files = req.files;
    const validationError = validateFiles(files, folder);
    if (validationError) {
      console.warn("File validation failed:", validationError);
      return res.status(400).json({ success: false, error: validationError });
    }

    const uploadedImages = [];

    // --- Profil fotoğrafı ---
    if (folder === "profile_images") {
      console.log("Uploading profile image...");
      const file = files[0];
      console.log("Profile file:", {
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
      });

      const userDoc = await admin.firestore().collection("Users").doc(userId).get();
      console.log("Fetched user doc:", userDoc.exists);

      const prevProfile = userDoc.data()?.profilePicture;
      if (prevProfile?.publicId) {
        console.log("Deleting old profile picture:", prevProfile.publicId);
        try {
          await cloudinary.uploader.destroy(prevProfile.publicId);
        } catch (err) {
          console.error("Old profile delete failed:", err);
        }
      }

      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      const cloudinaryFolder = `${folder}/${userId}`;
      console.log("Uploading to Cloudinary folder:", cloudinaryFolder);

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: cloudinaryFolder,
        transformation: getTransformation(folder),
      });
      console.log("Cloudinary upload success:", result.secure_url);

      await admin.firestore().collection("Users").doc(userId).update({
        profilePicture: {
          url: result.secure_url,
          publicId: result.public_id,
          uploadedAt: new Date(),
        },
      });
      console.log("Firestore profilePicture updated");

      await admin.auth().updateUser(userId, { photoURL: result.secure_url });
      console.log("Firebase Auth photoURL updated");

      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } else {
      // --- İlan fotoğrafları ---
      if (!listingId) {
        console.warn("Missing listingId for listing images upload");
        return res.status(400).json({
          success: false,
          error: "listingId is required for this folder",
        });
      }

      console.log("Uploading listing images... ListingId:", listingId);
      const listingRef = admin.firestore().collection("Listings").doc(listingId);
      const results = [];

      for (const file of files) {
        console.log("Uploading file:", {
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
        });

        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        try {
          const result = await cloudinary.uploader.upload(dataUri, {
            folder,
            transformation: getTransformation(folder),
          });
          console.log("Uploaded to Cloudinary:", result.secure_url);
          results.push(result);
        } catch (err) {
          console.error("Cloudinary upload failed:", err);
          return res.status(500).json({ success: false, error: "Image upload failed" });
        }
      }

      try {
        console.log("Updating Firestore with uploaded images...");
        const batch = admin.firestore().batch();
        results.forEach((result) => {
          uploadedImages.push({
            url: result.secure_url,
            publicId: result.public_id,
          });
          batch.update(listingRef, {
            images: admin.firestore.FieldValue.arrayUnion({
              url: result.secure_url,
              publicId: result.public_id,
              uploadedAt: new Date(),
            }),
          });
        });
        await batch.commit();
        console.log("Firestore batch update committed ✅");
      } catch (err) {
        console.error("Firestore update failed:", err);
        for (const result of results) {
          try {
            await cloudinary.uploader.destroy(result.public_id);
            console.log("Rollback deleted:", result.public_id);
          } catch (err) {
            console.error("Rollback failed:", err);
          }
        }
        return res.status(500).json({ success: false, error: "Database update failed" });
      }
    }

    console.log("=== UPLOAD REQUEST SUCCESS ===");
    res.json({
      success: true,
      message: "Images uploaded successfully",
      uploadedImages,
    });
  } catch (err) {
    console.error("=== UPLOAD REQUEST ERROR ===", err);
    res.status(500).json({ success: false, error: err.message || err });
  }
};


export const deleteImages = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.replace("Bearer ", "");
    if (!idToken) {
      return res
        .status(401)
        .json({ success: false, error: "Authorization token required" });
    }

    await admin.auth().verifyIdToken(idToken);
    const { userId, listingId } = req.body;
    if (!userId || !listingId) {
      return res
        .status(400)
        .json({ success: false, error: "userId and listingId are required" });
    }

    const listingRef = admin.firestore().collection("Listings").doc(listingId);
    const listingDoc = await listingRef.get();

    if (!listingDoc.exists) {
      return res
        .status(404)
        .json({ success: false, error: "Listing not found" });
    }

    const cloudinaryFolderPrefix = `Listings/${userId}/${listingId}`;
    try {
      await cloudinary.api.delete_resources_by_prefix(cloudinaryFolderPrefix);
      await cloudinary.api.delete_folder(cloudinaryFolderPrefix)
    } catch (err) {
      console.log("Cloudinary folder deletion failed:", err.message);
    }

    await listingRef.update({ images: [] });

    return res.json({
      success: true,
      message: `All images and folder for listing '${listingId}' deleted successfully`,
    });
  } catch (err) {
    console.error("deleteImages error:", err);
    return res
      .status(500)
      .json({ success: false, error: err.message || "Internal Server Error" });
  }
};

export const getImages = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, urls: {} });
    const token = authHeader.split(" ")[1];
    await admin.auth().verifyIdToken(token);
    const { publicIds } = req.body;
    if (!publicIds || !Array.isArray(publicIds)) {
      return res.status(400).json({ success: false, urls: {} });
    }
    const urls = {};
    publicIds.forEach((id) => {
      urls[id] = cloudinary.url(id, { type: "private", sign_url: true });
    });
    res.json({ success: true, urls });
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, urls: {} });
  }
};

export const classifyAnimal = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No files uploaded" });
    }
    const idToken = req.headers.authorization?.replace("Bearer ", "");
    if (!idToken) {
      return res
        .status(401)
        .json({ success: false, error: "Authorization token required" });
    }
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file.buffer, {
        filename: file.originalname || "image.jpg",
        contentType: file.mimetype || "image/jpeg",
      });
    });
    const CLOUD_FUNCTION_URL = process.env.CLOUD_FUNCTION_CLASSIFY_ANIMAL;
    if (!CLOUD_FUNCTION_URL) {
      return res.status(500).json({
        success: false,
        error: "CLOUD_FUNCTION_CLASSIFY_ANIMAL not configured",
      });
    }
    const response = await axios.post(CLOUD_FUNCTION_URL, formData, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000,
    });

    res.status(200).json({ success: true, ...response.data });
  } catch (error) {
    console.error("Classification error:", error.message);
    if (error.response) {
      return res
        .status(error.response.status)
        .json({ success: false, error: error.response.data });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};
