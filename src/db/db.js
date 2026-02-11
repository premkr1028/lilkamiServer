import mongoose from "mongoose";

async function connectDb() {
    await mongoose.connect("mongodb+srv://prem:anipaper2810@cluster0.ytly8wx.mongodb.net/lilkami")
    console.log("db connected")
}

export default connectDb