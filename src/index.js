
import express from "express";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import wallpaperModel from "./models/image.model.js";
import cors from "cors"
dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
console.log(process.env.IMAGEKIT_PUBLIC_KEY)

import ImageKit from "imagekit";
import userModel from "./models/user.model.js";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});
app.get("/", (req,res)=>{
  res.send("lilkami")
})
app.get('/favicon.ico', (req, res) => res.status(204).end());
// Multer temp storage
const upload = multer({ dest: "temp/" });

// 📤 Upload Wallpaper
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const data = req.body;

    const fileBuffer = fs.readFileSync(req.file.path);

    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: req.file.originalname,
      folder: "/wallpapers"
    });

    fs.unlinkSync(req.file.path); // remove temp file

    const newWallpaper = await wallpaperModel.create({
      title: data.title,
      description: data.description,
      tags: data.tags?.split(",") || [],
      imageUrl: response.url
    });

    res.status(201).json({
      message: "Wallpaper uploaded",
      wallpaper: newWallpaper
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
});
app.post("/signUp", async (req, res) => {
  try {
    const data = req.body;
    const user = await userModel.create({
      userId: data.userId,
      userName: data.userName,
      likedWallpapers: data.likedWallpapers || [],
      postWallpapers: data.postWallpapers || []
    });

    res.status(201).json({
      message: "user created",
      user: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating user" });
  }
});
// 📥 Get All Wallpapers
app.get("/getWall", async (req, res) => {
  try {
    const allWallpapers = await wallpaperModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "Wallpapers fetched",
      wallData: allWallpapers
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch wallpapers" });
  }
});

export default app;
