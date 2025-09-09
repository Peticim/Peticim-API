import express from "express";
import { getCities, getDistricts, getNeighborhoods, getCoordinates } from "../controllers/locationController.js";

const router = express.Router();

router.get("/cities", getCities);
router.get("/districts", getDistricts);
router.get("/neighborhoods", getNeighborhoods);
router.get("/coordinates", getCoordinates);

export default router;
