import mongoose from "mongoose";

const citySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  population: Number,
  area: Number,
  postalCode: String,
  altitude: Number,
  areaCode: [Number],
  isCoastal: Boolean,
  isMetropolitan: Boolean,
  nuts: {
    nuts1: {
      code: String,
      name: {
        en: String,
        tr: String
      }
    },
    nuts2: {
      code: String,
      name: String
    },
    nuts3: String
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  maps: {
    googleMaps: String,
    openStreetMap: String
  },
  region: {
    en: String,
    tr: String
  }
}, { collection: "cities" });

export default mongoose.model("City", citySchema);
