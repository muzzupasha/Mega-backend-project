import mongoose, {Schema} from "mongoose";

const UserSchema = new Schema({
  
    userName:{
        type:String,
        required:true,
        unique:true,
        trim : true,
        index : true,
        lowercase : true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim : true,
        lowercase : true
    },
     fullName:{
        type:String,
        required:true,
        index : true,
        trim : true,
        
    } ,
    avatar:{
        type:String,  //cloudnaray url
        required:true,
    },
    coverImage:{
        type:String,  //cloudnaray url
        
    },
    watchHistory:[{
        type: Schema.Types.ObjectId,
        ref: Video
    }],
    password:{
        type:String,
        required:[true, "Password is required"],

    },
    refreshToken:{
        type:String,
        
    },


}, {timestamps:true});

UserSchema.pre("save", async function (next){
    if(!this.isModified("password")) return next();


    this.password = await bcrypt.hash(this.password, 10);
    next();

})

UserSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password);
}


UserSchema.methods.generateAccessToken = function (){
  return Jwt.sign({
        _id: this._id,
        email: this.email,
        userName: this.userName,
        fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
}



UserSchema.methods.generateRefreshToken = function (){
  return Jwt.sign({
        _id: this._id,
        
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User =  mongoose.model("User", UserSchema);

