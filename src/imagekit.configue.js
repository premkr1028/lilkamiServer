import ImageKit from "imagekit";
import dotenv from 'dotenv'
dotenv.config()
import { configDotenv } from "dotenv";
const imagekit = new ImageKit({
  publicKey: process.env.PUBLIC_KEY,
  privateKey: process.env.PRIVATE_KEY,
  urlEndpoint: "https://ik.imagekit.io/z2jwotlhm/"
});


export default imagekit


