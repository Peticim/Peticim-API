import express from "express";
import multer from "multer";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


import { uploadImages } from "../controllers/imageController.js";

router.post("/upload", upload.array("files"), uploadImages);

export default router;
