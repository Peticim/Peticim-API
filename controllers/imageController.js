import admin from "../config/firebase.js";
import cloudinary from "../config/cloudinary.js";
import axios from "axios";
import FormData from "form-data";
import {
  validateFiles,
  uploadToCloudinary,
  deleteCloudinaryFolder,
  updateFirestoreArrayField,
} from "../utils/imageHelpers.js";
import { verifyToken } from "../utils/functions.js";

const uploadProfileImage = async (file, userId) => {
  const result = await uploadToCloudinary(file, `profile_images/${userId}`);
  const userDoc = await admin.firestore().collection("Users").doc(userId).get();
  const prevProfile = userDoc.data()?.profilePicture;
  if (prevProfile?.publicId) {
    try {
      await cloudinary.uploader.destroy(prevProfile.publicId);
    } catch {}
  }
  await admin
    .firestore()
    .collection("Users")
    .doc(userId)
    .update({
      profilePicture: { ...result, uploadedAt: new Date() },
    });
  await admin.auth().updateUser(userId, { photoURL: result.url });
  return result;
};

const uploadListingImages = async (files, listingId, folder) => {
  const listingRef = admin.firestore().collection("Listings").doc(listingId);
  const uploadedImages = [];

  for (const file of files) {
    const result = await uploadToCloudinary(file, folder);
    uploadedImages.push({ ...result, uploadedAt: new Date() });
  }

  await updateFirestoreArrayField(listingRef, "images", uploadedImages);
  return uploadedImages;
};

export const uploadImages = async (req, res) => {
  try {
    await verifyToken(req.headers.authorization);
    const { userId, folder, listingId } = req.body;

    if (!userId || !folder)
      return res
        .status(400)
        .json({ success: false, error: "userId and folder are required" });

    const files = req.files;
    if (!files || files.length === 0)
      return res
        .status(400)
        .json({ success: false, error: "No files uploaded" });

    const validationError = validateFiles(files, folder);
    if (validationError)
      return res.status(400).json({ success: false, error: validationError });

    let uploadedImages = [];
    if (folder === "profile_images") {
      uploadedImages.push(await uploadProfileImage(files[0], userId));
    } else {
      if (!listingId)
        return res.status(400).json({
          success: false,
          error: "listingId is required for this folder",
        });
      uploadedImages = await uploadListingImages(files, listingId, folder);
    }

    res.json({
      success: true,
      message: "Images uploaded successfully",
      uploadedImages,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || err });
  }
};

export const deleteImages = async (req, res) => {
  try {
    await verifyToken(req.headers.authorization);
    const { userId, listingId } = req.body;
    if (!userId || !listingId)
      return res
        .status(400)
        .json({ success: false, error: "userId and listingId are required" });

    const listingRef = admin.firestore().collection("Listings").doc(listingId);
    const listingDoc = await listingRef.get();
    if (!listingDoc.exists)
      return res
        .status(404)
        .json({ success: false, error: "Listing not found" });

    await deleteCloudinaryFolder(`Listings/${userId}/${listingId}`);
    await listingRef.update({ images: [] });

    res.json({
      success: true,
      message: `All images and folder for listing '${listingId}' deleted successfully`,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: err.message || "Internal Server Error" });
  }
};

export const getImages = async (req, res) => {
  try {
    await verifyToken(req.headers.authorization);
    const { publicIds } = req.body;
    if (!publicIds || !Array.isArray(publicIds))
      return res.status(400).json({ success: false, urls: {} });

    const urls = {};
    publicIds.forEach((id) => {
      urls[id] = cloudinary.url(id, { type: "private", sign_url: true });
    });

    res.json({ success: true, urls });
  } catch (err) {
    res.status(401).json({ success: false, urls: {} });
  }
};
