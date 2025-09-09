import express from "express";
import multer from "multer";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

import { uploadImages, checkAnimal, getImages } from "../controllers/imageController.js";

router.post("/upload", upload.array("files"), uploadImages);
router.post("/checkAnimal", upload.array("files"), checkAnimal);
router.post('/', getImages);

export default router;
