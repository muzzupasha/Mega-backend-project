import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js";
dotenv.config({
    path: './.env'
});

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on port : ${process.env.PORT}`);
    })
    app.on("error", (error)=>{
        console.log("Express error : ", error);
        throw error;
    })

})
.catch((err)=>{
console.log("Mongodb connection error : " , err);
})



























/*
(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/ ${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("Express error : ", error);
            throw error;
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`Server is running on port : ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("Mongodb connection error : " , error);
    }
})()
*/
