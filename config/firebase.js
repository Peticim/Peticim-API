import "dotenv/config";
import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        projectId: process.env.FIREBASE_PROJECT_ID,
      }),
    });
  } catch (error) {
    console.error("Firebase Admin SDK başlatılırken hata oluştu:", error);
  }
}

export default admin;
