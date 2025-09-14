// routes/views.js
import express from "express";
import View from "../models/View.js";
import admin from "../config/firebase.js";

const router = express.Router();
const db = admin.firestore();

export const incrementListingView = async (req, res) => {
  const { listingId, viewerId } = req.body;
  if (!listingId || !viewerId) {
    return res
      .status(400)
      .json({ message: "listingId ve viewerId gereklidir." });
  }
  try {
    const existingView = await View.findOne({
      listingId: listingId,
      viewerId: viewerId,
    });
    if (existingView) {
      return res.status(200).json({
        message: "Zaten görüntülenmiş, sayaç artırılmadı.",
      });
    }
    const newView = new View({ listingId, viewerId });
    await newView.save();
    const listingRef = db.collection("Listings").doc(listingId);
    await listingRef.update({
      views: admin.firestore.FieldValue.increment(1),
    });
    const updatedDoc = await listingRef.get();
    const updatedListing = updatedDoc.data();
    res.status(200).json({
      message: "Görüntüleme sayısı başarıyla artırıldı!",
      views: updatedListing.views,
    });
  } catch (error) {
    console.error("Görüntüleme işleminde hata oluştu:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

export default router;
