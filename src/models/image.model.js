import mongoose from "mongoose";

const wallpaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    imageUrl: {
      type: String,
      required: true,
    },

    views: {
      type: Number,
      default: 0,
    },

    type: {
      type: [String],
      enum: ["mobile", "desktop"],
      default: ["desktop"], // 👈 if nothing given, select desktop
    },
    likes: { type: [String], default: [] }, // Array of User IDs,
    postedBy : String,
    postedByName : String
  },
  { timestamps: true }
);

export default mongoose.model("Wallpaper", wallpaperSchema);
