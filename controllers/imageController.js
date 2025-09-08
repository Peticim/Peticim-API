import cloudinary from "../config/cloudinary.js";
import admin from "../config/firebase.js";

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
      // listings veya diğer custom folder
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
          folder, // frontend’den gelen folder direkt kullanılıyor
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
