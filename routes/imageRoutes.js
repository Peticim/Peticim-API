import express from "express";
import multer from "multer";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

import { uploadImages, getImages, deleteImages } from "../controllers/imageController.js";

router.post("/upload", upload.array("files"), uploadImages);
router.post("/delete", deleteImages);
router.post('/', getImages);

export default router;
