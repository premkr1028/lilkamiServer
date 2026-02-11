import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import cors from "cors";
import ImageKit from "imagekit";

// Models
import wallpaperModel from "./models/image.model.js";
import userModel from "./models/user.model.js";

dotenv.config();

const app = express();

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// --- ImageKit Configuration ---
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// --- Multer Configuration (Memory Storage) ---
// This keeps files in RAM temporarily instead of writing to your hard drive
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Optional: Limit size to 5MB
});

// --- Routes ---

// Health Check
app.get("/", (req, res) => {
  res.send("Wallpaper API is running 🚀");
});

// Favicon Fix
app.get('/favicon.ico', (req, res) => res.status(204).end());

/**
 * 📤 Upload Wallpaper
 */
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const { title, description, tags } = req.body;

    // 1. Upload to ImageKit via Buffer
    const response = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: "/wallpapers"
    });

    // 2. Save to MongoDB
    const newWallpaper = await wallpaperModel.create({
      title,
      description,
      tags: tags ? tags.split(",").map(tag => tag.trim()) : [],
      imageUrl: response.url
    });

    res.status(201).json({
      message: "Wallpaper uploaded successfully",
      wallpaper: newWallpaper
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

/**
 * 👤 User Sign Up / Sync
 */
app.post("/signUp", async (req, res) => {
  try {
    const { userId, userName, likedWallpapers, postWallpapers } = req.body;

    // Check if user already exists
    let user = await userModel.findOne({ userId });

    if (!user) {
      user = await userModel.create({
        userId,
        userName,
        likedWallpapers: likedWallpapers || [],
        postWallpapers: postWallpapers || []
      });
      return res.status(201).json({ message: "User created", user });
    }

    res.status(200).json({ message: "User already exists", user });
  } catch (error) {
    console.error("Sign up error:", error);
    res.status(500).json({ message: "Error processing user data" });
  }
});

/**
 * 📥 Get All Wallpapers
 */
app.get("/getWall", async (req, res) => {
  try {
    const allWallpapers = await wallpaperModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "Wallpapers fetched",
      wallData: allWallpapers
    });

  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ message: "Failed to fetch wallpapers" });
  }
});

export default app;