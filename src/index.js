import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import cors from "cors";
import ImageKit from "imagekit";
import { Webhook } from "svix";
// Models
import wallpaperModel from "./models/image.model.js";
import userModel from "./models/user.model.js";
import bodyParser from "body-parser";
import connectDB from "./db/db.js";
dotenv.config();

const app = express();

// --- Middleware ---
// Note: Webhook route needs raw body, so we place it BEFORE express.json() 
// or use the specific handler within the route.
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

// --- Multer Configuration ---
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// --- Routes ---

/**
 * 👤 User Sign Up / Sync (Clerk Webhook)
 * We use express.raw to ensure the signature verification works correctly.
 */
app.post('/api/webhooks/clerk', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  // Verify the webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  const payload = req.body.toString();
  const headers = req.headers;
  try {
    const evt = wh.verify(payload, headers);
    const eventType = evt.type;

    if (eventType === 'user.created') {
      const userData = evt.data;

      // 1. Safe data extraction
      const { id, first_name, last_name, username, email_addresses } = userData;
      const email = email_addresses?.[0]?.email_address;
      const fullName = `${first_name ?? ''} ${last_name ?? ''}`.trim();

      // 2. Check if user already exists to prevent "Duplicate Key" errors
      const existingUser = await userModel.findOne({ clerkId: id });

      if (!existingUser) {
        const user = await userModel.create({
          clerkId: id,
          email,
          userName: username || `user_${id.slice(-6)}`, // Fallback username
          fullName,
        });
        console.log("User successfully created:", user._id);
      } else {
        console.log("User already exists, skipping creation.");
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.status(400).json({ message: 'Webhook verification failed' });
  }
});

// Standard JSON middleware for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Wallpaper API is running 🚀");
});

/**
 * 📤 Upload Wallpaper
 */
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const { title, description, tags, postedBy, postedByName } = req.body;

    // 1. Upload to ImageKit
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
      imageUrl: response.url,
      postedBy,
      postedByName
    });
    const updatedUser = await userModel.findOneAndUpdate(
      { clerkId: postedBy },
      { $push: { postWallpapers: newWallpaper._id } }, // Use _id
      { new: true }
    );

    if (!updatedUser) {
      // Optional: Handle case where user isn't found
      console.warn("Wallpaper created but user not found to link.");
    }
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

app.get("/api/get-my-wallpaper", async (req, res) => {
  try {
    // 1. Extract the specific field from the body
   const { id } = req.query;
  
    // 2. Use 'await' because database queries take time
    const myWallpapers = await wallpaperModel.find({ postedBy: id });

    // 3. Send the response
    res.status(200).json({
      success: true,
      wallpaper: myWallpapers
    });
  } catch (error) {
    // 4. Always include error handling for DB failures
    res.status(500).json({
      success: false,
      message: "Error fetching wallpapers",
      error: error.message
    });
  }
});

app.put("/api/wallpaper/like", async (req, res) => {
  const { wallpaperId, userId, doing } = req.body;
  
  try {   
    const updateQuery = doing === "like" 
      ? { $addToSet: { likes: userId } } 
      : { $pull: { likes: userId } };

    const updatedWallpaper = await wallpaperModel.findByIdAndUpdate(
      wallpaperId,
      updateQuery,
      { new: true }
    );

    // 🛡️ Safety check: If wallpaperId was invalid
    if (!updatedWallpaper) {
      return res.status(404).json({ success: false, message: "Wallpaper not found" });
    }

    res.status(200).json({ 
      success: true, 
      likesCount: updatedWallpaper.likes.length,
      likes: updatedWallpaper.likes 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// Favicon Fix
app.get('/favicon.ico', (req, res) => res.status(204).end());
connectDB()
export default app;  