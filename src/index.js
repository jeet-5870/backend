// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
  path: './env'
})


connectDB()
.then(() => {
  app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running at port: ${process.env.PORT}`)
  })
})
.catch((err) => {
  console.log("MONGODB connection FAILED !!!", err)
})








// import mongoose from "mongoose"
// import { DB_NAME } from "./constant"


// (async () => {
//   try {
//     const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
// console.log(`\nMONGODB connected !! DB HOST: ${connectionInstance.connection.host}`)
//   } catch (error) {
// console.log("MONGODB connection FAILED ", error)
// process.exit(1)
//     throw err
//   }
// })()