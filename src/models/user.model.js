// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: String,
//       required: true,
//       trim: true,
//     },
// userName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     likedWallpapers: {
//       type: [String],
//      default : []
//     },

//     postWallpapers: {
//       type: [String],
//       default : []
//     },

    
    
//   },
//   { timestamps: true }
// );

// export default mongoose.model("user", userSchema);

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  username: { 
    type: String, 
    unique: true,
    sparse: true 
  },
  fullName: { 
    type: String,
    default: "" 
  },
  // Use this syntax for arrays with defaults
  likedWallpapers: {
    type: [String],
    default: []
  },
  postWallpapers: {
    type: [String],
    default: []
  }
}, { timestamps: true });




export default mongoose.model("user", userSchema);