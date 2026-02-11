import connectDb from "./src/db/db.js"
import app from "./src/index.js"
connectDb()
app.listen(3000, ()=>{
    console.log("server is running")
})