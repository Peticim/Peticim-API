import cloudinary from "../config/cloudinary.js";
import admin from "../config/firebase.js";

const getTransformation = (folder) => {
  if (folder === "profile_images") {
    return [
      { width: 400, height: 400, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ];
  } else if (folder === "listings") {
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
  // Fonksiyon adını güncelledim
  try {
    const { userId, folder, listingId } = req.body;

    // Gelen dosyaların varlığını kontrol et
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

    // Yükleme dizisini oluştur
    const uploadedImages = [];

    // Tek bir profil fotoğrafı yerine çoklu liste fotoğrafı yüklemesi için mantığı ayrıştırma
    if (folder === "profile_images") {
      // Sadece ilk dosyayı al, çünkü profil fotoğrafı tektir
      const file = files[0];

      // Eski profil fotoğrafını silme
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

      // Dosyayı Cloudinary'ye yükle
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString(
        "base64"
      )}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        type: "private",
        transformation: getTransformation(folder),
      });

      // Firebase'i güncelle
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
    } else if (folder === "listings") {
      if (!listingId) {
        return res.status(400).json({
          success: false,
          error: "listingId is required for listings",
        });
      }

      const listingRef = admin
        .firestore()
        .collection("Listings")
        .doc(listingId);
      const batch = admin.firestore().batch();

      // Çoklu dosyaları döngüye al
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

      // Yüklenen her bir dosyanın bilgisini Firestore'a ekle
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
    } else {
      // Desteklenmeyen klasör türü
      return res
        .status(400)
        .json({ success: false, error: "Unsupported folder type" });
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

export const getSignedImages = async (req, res) => {
  try {
    const { publicIds } = req.query;
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken)
      return res.status(401).json({ success: false, error: "Unauthorized" });
    await admin.auth().verifyIdToken(idToken);
    const ids = JSON.parse(publicIds);
    const urls = ids.map((id) =>
      cloudinary.url(id, {
        type: "private",
        sign_url: true,
      })
    );
    res.json({ success: true, urls });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message || err });
  }
};
