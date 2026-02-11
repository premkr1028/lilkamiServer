import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
userName: {
      type: String,
      required: true,
      trim: true,
    },
    likedWallpapers: {
      type: [String],
     default : []
    },

    postWallpapers: {
      type: [String],
      default : []
    },

    
    
  },
  { timestamps: true }
);

export default mongoose.model("user", userSchema);