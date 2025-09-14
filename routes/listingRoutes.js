import express from 'express'
import { incrementListingView } from "../controllers/listingController.js";

const router = express.Router();

router.post("/incrementView", incrementListingView);

export default router;
