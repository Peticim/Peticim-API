import admin from "../config/firebase.js";
export const verifyToken = async (authHeader) => {
  if (!authHeader) throw new Error("Authorization token required");
  const token = authHeader.replace("Bearer ", "");
  const decoded = await admin.auth().verifyIdToken(token);
  return decoded.uid;
};
