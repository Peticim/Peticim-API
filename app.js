import express from "express";

// CONFIGS
import * as dotenv from "dotenv";
dotenv.config();

import "./config/firebase.js";

// DB
import { connectDB } from "./config/mongodb.js";
await connectDB();

// ROUTES
import imageRoutes from "./routes/imageRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import listingRoutes from './routes/listingRoutes.js'

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARES
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Hello API is working!");
});
app.use("/api/image", imageRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/listing", listingRoutes);

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is working on http://localhost:${PORT}`);
  });
}

export default app;
