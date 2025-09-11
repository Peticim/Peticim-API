import admin from "../config/firebase.js";
import cloudinary from "../config/cloudinary.js";
import FormData from "form-data";
import axios from "axios";

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];

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
    const idToken = req.headers.authorization?.replace("Bearer ", "");
    if (!idToken) {
      return res
        .status(401)
        .json({ success: false, error: "Authorization token required" });
    }
    await admin.auth().verifyIdToken(idToken);

    const { userId, folder, listingId } = req.body;
    const files = req.files;

    if (!userId || !folder) {
      return res
        .status(400)
        .json({ success: false, error: "userId and folder are required" });
    }

    const validationError = validateFiles(files, folder);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const uploadedImages = [];

    if (folder === "profile_images") {
      const file = files[0];
      const userDoc = await admin
        .firestore()
        .collection("Users")
        .doc(userId)
        .get();
      const prevProfile = userDoc.data()?.profilePicture;

      if (prevProfile?.publicId) {
        try {
          await cloudinary.uploader.destroy(prevProfile.publicId, {
            type: "private",
          });
        } catch (err) {
          console.log("Eski profil fotoğrafı silinemedi:", err);
        }
      }

      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString(
        "base64"
      )}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        type: "private",
        transformation: getTransformation(folder),
      });

      await admin
        .firestore()
        .collection("Users")
        .doc(userId)
        .update({
          profilePicture: {
            publicId: result.public_id,
            uploadedAt: new Date(),
          },
        });
      await admin.auth().updateUser(userId, { photoURL: result.secure_url });

      uploadedImages.push({
        publicId: result.public_id,
        secureUrl: result.secure_url,
      });
    } else {
      if (!listingId) {
        return res
          .status(400)
          .json({
            success: false,
            error: "listingId is required for this folder",
          });
      }

      const listingRef = admin
        .firestore()
        .collection("Listings")
        .doc(listingId);
      const results = [];


      for (const file of files) {
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString(
          "base64"
        )}`;
        try {
          const result = await cloudinary.uploader.upload(dataUri, {
            folder,
            type: "private",
            transformation: getTransformation(folder),
          });
          results.push(result);
        } catch (err) {
          console.error("Cloudinary upload failed:", err);
          return res
            .status(500)
            .json({ success: false, error: "Image upload failed" });
        }
      }

      try {
        const batch = admin.firestore().batch();
        results.forEach((result) => {
          uploadedImages.push({
            publicId: result.public_id,
            secureUrl: result.secure_url,
          });
          batch.update(listingRef, {
            images: admin.firestore.FieldValue.arrayUnion({
              publicId: result.public_id,
              uploadedAt: new Date(),
            }),
          });
        });
        await batch.commit();
      } catch (err) {
        console.error("Firestore update failed:", err);
        for (const result of results) {
          try {
            await cloudinary.uploader.destroy(result.public_id, {
              type: "private",
            });
          } catch (err) {
            console.log("Rollback failed:", err);
          }
        }
        return res
          .status(500)
          .json({ success: false, error: "Database update failed" });
      }
    }

    res.json({
      success: true,
      message: "Images uploaded successfully",
      uploadedImages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message || err });
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
      return res
        .status(500)
        .json({
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

    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Internal server error",
      });
  }
};
