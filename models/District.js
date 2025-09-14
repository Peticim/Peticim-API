import mongoose from "mongoose";

const districtSchema = new mongoose.Schema({
  provinceId: { type: Number, required: true },
  id: { type: Number, required: true, unique: true },
  province: String,
  name: { type: String, required: true },
  population: Number,
  area: Number,
  postalCode: String
}, { collection: "districts" });

export default mongoose.model("District", districtSchema);
