import mongoose from "mongoose";

const neighborhoodSchema = new mongoose.Schema({
  provinceId: { type: Number, required: true },
  districtId: { type: Number, required: true },
  id: { type: Number, required: true, unique: true },
  province: String,
  district: String,
  name: { type: String, required: true },
  population: Number
}, { collection: "neighborhoods" });

export default mongoose.model("Neighborhood", neighborhoodSchema);
