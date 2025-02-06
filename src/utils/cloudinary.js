import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if (!localFilePath) return null;
            
        // UPLOAD FILE ON CLOUDINARY

        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto",

        })
        // FILE UPLOADED ON CLOUDINARY 

        console.log("File uploaded on cloudinary", response.url);
        return response
        
    } catch (error) {
        fs.unlinkSync(localFilePath);
        // DELETE FILE FROM LOCAL STORAGE IF ERROR OCCURS
        
    }
}

export {uploadOnCloudinary};