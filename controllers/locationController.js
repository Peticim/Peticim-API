import { getDB } from "../config/mongodb.js";
import fetch from "node-fetch";

export const getCities = async (req, res) => {
  try {
    const db = await getDB();
    const cities = await db.collection("cities").find({}).toArray();
    res.json(cities);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "DB hatası" });
  }
};

export const getDistricts = async (req, res) => {
  const { provinceId } = req.query;
  if (!provinceId) return res.status(400).json({ error: "cityId gerekli" });

  try {
    const db = await getDB();
    const districts = await db.collection("districts")
      .find({ provinceId: parseInt(provinceId) })
      .toArray();
    res.json(districts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "DB hatası" });
  }
};

export const getNeighborhoods = async (req, res) => {
  const { districtId } = req.query;
  if (!districtId) return res.status(400).json({ error: "districtId gerekli" });

  try {
    const db = await getDB();
    const neighborhoods = await db.collection("neighborhoods")
      .find({ districtId: parseInt(districtId) })
      .toArray();
    res.json(neighborhoods);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "DB hatası" });
  }
};

export const getCoordinates = async (req, res) => {
  const { city, district, neighborhood } = req.query;
  if (!city || !district || !neighborhood) return res.status(400).json({ error: "city, district ve neighborhood gerekli" });

  const query = encodeURIComponent(`${neighborhood}, ${district}, ${city}, Turkey`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "pet-adoption-app (youremail@example.com)" }
    });
    const data = await response.json();
    if (!data[0]) return res.status(404).json({ error: "Konum bulunamadı" });

    res.json({ latitude: data[0].lat, longitude: data[0].lon });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Konum sorgusu hatası" });
  }
};
