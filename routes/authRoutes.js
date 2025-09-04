import express from "express";
const router = express.Router();

import { sendVerificationEmail, sendPasswordResetEmail } from "../controllers/authController.js";

router.post("/sendVerificationEmail", sendVerificationEmail);
router.post('/sendPasswordResetEmail', sendPasswordResetEmail);

export default router;
