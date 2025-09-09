import cloudinary from "../config/cloudinary.js";
import admin from "../config/firebase.js";

import tf from "@tensorflow/tfjs-node";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

let model = null;
const animalClasses = [
  "cat",
  "dog",
  "bird",
  "horse",
  "sheep",
  "cow",
  "elephant",
  "bear",
  "zebra",
  "giraffe",
  "rabbit",
  "hamster",
  "turtle",
  "chicken",
  "duck",
  "goose",
  "pig",
];
const loadModel = async () => {
  if (!model) model = await cocoSsd.load();
};

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

// Genel fotoğraf upload fonksiyonu
export const uploadImages = async (req, res) => {
  try {
    const { userId, folder, listingId } = req.body;
    const files = req.files;
    if (!userId || !folder) {
      return res
        .status(400)
        .json({ success: false, error: "userId and folder are required" });
    }
    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No files uploaded" });
    }
    if (folder === "profile_images" && files.length > 1) {
      return res.status(400).json({
        success: false,
        error: "You can upload only 1 profile image",
      });
    } else if (folder !== "profile_images" && files.length > 5) {
      return res.status(400).json({
        success: false,
        error: "You can upload a maximum of 5 images per listing",
      });
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
        return res.status(400).json({
          success: false,
          error: "listingId is required for this folder",
        });
      }
      const listingRef = admin
        .firestore()
        .collection("Listings")
        .doc(listingId);
      const batch = admin.firestore().batch();
      const uploadPromises = files.map(async (file) => {
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString(
          "base64"
        )}`;
        return cloudinary.uploader.upload(dataUri, {
          folder,
          type: "private",
          transformation: getTransformation(folder),
        });
      });
      const results = await Promise.all(uploadPromises);
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

export const checkAnimal = async (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ error: "No files uploaded" });

  try {
    await loadModel();
    const results = [];

    for (const file of req.files) {
      const imageTensor = tf.node.decodeImage(file.buffer, 3);
      const predictions = await model.detect(imageTensor);
      imageTensor.dispose();

      const isAnimal = predictions.some((p) =>
        animalClasses.includes(p.class.toLowerCase())
      );

      results.push({
        filename: file.originalname,
        isAnimal,
        predictions,
      });
    }

    res.status(200).json({ results });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Animal detection failed", details: error.message });
  }
};
