// import mongoose from "mongoose";

// async function connectDb() {
//     await mongoose.connect("mongodb+srv://prem:anipaper2810@cluster0.ytly8wx.mongodb.net/lilkami")
//     console.log("db connected")
// }

// export default connectDb

// db.js or similar
import mongoose from 'mongoose';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Connection error:", error);
  }
};

export default connectDB;