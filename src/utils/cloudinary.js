import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: 'process.env.CLOUDINARY_API_KEY',
  api_secret: 'process.env.CLOUDINARY_API_SECRET' // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })
    // file has been uploaded
    // console.log("File uploaded", response.url);   // Only for testing if working or not
    fs.unlinkSync(localFilePath) // remove the local file
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath) // remove the local file
    return null;
  }
}



export { uploadOnCloudinary }
