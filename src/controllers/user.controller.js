import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';


// METHOD FOR CREATING ACCESS AND REFRESH TOKENS
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
     
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken}


  } catch (error) {
    throw new ApiError(500, "Error while generating tokens")
  }
}

const registerUser = asyncHandler(async (req, res, )=>{
    // 1 get user details from user
    // 2 validation (not empty)
    // 3 chck if user already exists: userName or email
    // 4 check for images , check for avatar
    // 5 upload them to cloudinary , check for avatar
    // 6 create user object - create entry in db
    // 7 remove password and refresh token fields from response
    // 8 check for user creation
    // 9 return response


       // Step 1
    const {userName, email, fullName, password} = req.body
     console.log("email", email);
      
     // Step 2
     if (
        [userName, email, fullName, password].some((field)=> 
        field?.trim() === "")
     ){
      throw new ApiError(400, "All fields are required")
     }

     // Step 3
     const existedUser = await User.findOne({
        $or : [{ userName }, { email }]
     })

     if (existedUser){
        throw new ApiError(409, "User with this userName or email already exists")
     }


    // Step 4
  //  const avatarLocalPath = req.files?.avatar[0]?.path;
  //  const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
     coverImageLocalPath = req.files.coverImage[0].path
    } 

    
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
     avatarLocalPath = req.files.avatar[0].path
    }

   if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required")
   }

   // Step 5
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if(!avatar){
    throw new ApiError(500, "Error uploading avatar")
  }
  

  // Step 6
 const user = await User.create({
    userName : userName.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    fullName,
  })

  // Step 7

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
 
   // Step 8
  if (!createdUser){
    throw new ApiError(500, "Error while creating user")
  }

  // Step 9
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User created successfully")
  )

     
    
})


const loginUser = asyncHandler(async (req, res)=>{

// 1 req body se data le aao
// 2 check username or email
// 3 find user
// 4 check password
// 5 create access and refresh token
// 6 send cookies


// 1
const {userName, password, email} = req.body

// 2
if (!(email || userName)) {
  throw new ApiError(400, "Email or userName is required")
}

// 3
const user = await User.findOne({
  $or: [{ userName }, { email }]
})

if (!user){
  throw new ApiError(404, "User not found")

}

// 4

const isPasswordValid = await user.isPasswordCorrect(password)

if (!isPasswordValid){
  throw new ApiError(401, "Invalid credentials")
}

// 5
const {refreshToken, accessToken} = await generateAccessAndRefreshTokens(user._id)

const loggedInUser = await User.findById(user._id)
.select("-password -refreshToken")

// 6
const options = {
  httpOnly: true,
  secure: true
 }

 return res
 .status(200)
 .cookie("Access Token", accessToken, options)
 .cookie("Refresh Token", refreshToken, options)
 .json(
  new ApiResponse(200), {
    user : loggedInUser, accessToken, refreshToken, 
  },
  "User logged in successfully"
 )





})

const logoutUser = asyncHandler(async (req, res)=>{
  await User.findByIdAndUpdate(
    req.user._id,{
     $set: {
      refreshToken: undefined
     }
    },
    {
       new: true
    }

)
const options = {
  httpOnly: true,
  secure: true
 }
 return res
 .status(200)
 .clearCookie("accessToken", options)
 .clearCookie("refreshToken", options)
.json(
  new ApiResponse(200, {}, "User logged out successfully")
  )
  
}
)

const refreshAccessToken = asyncHandler(async (req, res)=>{

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request")
    
  }

  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

  const user = await User.findById(decodedToken._id)

  if (!user){
    throw new ApiError(404, "Invalid refresh token")
  }
    
  
  if (user?.refreshToken !== incomingRefreshToken){
    throw new ApiError(401, "refresh token expired or uses") 
}

const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

return res
.status(200)
.cookie("access Token", accessToken, options)
.cookie("refresh Token", refreshToken, options)
.json(
  new ApiResponse(
    200,
    {
      accessToken, refreshToken: newRefreshToken
    },
    "Access Token refreshed successfully"
  )
)})

const changeCurrentPassword = asyncHandler(async (req, res)=>{
  const {currentPassword, newPassword} = req.body

 const user = await User.findById(req.user?._id)

 const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)

 if (!isPasswordCorrect){
   throw new ApiError(401, "Invalid current password")
 }

 user.password = newPassword
 await user.save({ validateBeforeSave: false })

 return res
 .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req,res)=>{
  return res 
  .status(200)
  .json(new ApiResponse(200, req.user, "User fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res)=>{
  const {fullName, email} = req.body

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
     $set : { fullName,
      email: email}
    },
    {
      new: true,
      
    }
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "User details updated successfully"))

}) 

const updateUserAvatar = asyncHandler(async (req, res)=>{
 const avatarLocalPath = req.file?.path

 if (!avatarLocalPath){
   throw new ApiError(400, "Avatar is required")
 }

 const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url){
    throw new ApiError(500, "Error while uploading avatar")
  }

  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {
      new: true
    }

  ).select("-password")

  return res 
  .status(200)
  .json(new ApiResponse(200, user, "Avatar updated successfully"))


})

const updateCoverImage = asyncHandler(async (req, res)=>{
 const coverImageLocalPath = req.file?.path

 if (!coverImageLocalPath){
   throw new ApiError(400, "cover Image is required")
 }

 const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url){
    throw new ApiError(500, "Error while uploading cover")
  }

  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {
      new: true
    }

  ).select("-password")

  return res 
  .status(200)
  .json(new ApiResponse(200, user, "Cover Image updated successfully"))


})

// aggrigataion pipeline thoda hard

const getUserChannelProfile = asyncHandler(async (req, res)=>{
  const {userName} = req.params 

  if (!userName?.trim()) {
    throw new ApiError(400, "userName is required")
  }

  const channel = await User.aggregate([
    {
      $match :{
        userName: userName?.toLowerCase()
      }
    },
    {
      $lookup:{
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup:{
        from: "subscriptions",
        localField: "_id",
        foreignField: "Subscriber",
        as: "subscriptions"
      }
    },
    {
      $addFields:{
        subscriberCount:{
          $size: "$subscribers"
        },
        subscriptionCount:{
          $size: "$subscriptions"
        },
        isSubscribed:{
       $cond: { 
        if: {$in: [req.user?._id, "$subscribers.Subscriber"]},
        then: true,
        else: false
      }
        }
      }
    },
    {
      $project:{
        fullName: 1,
        userName: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        subscriptionCount: 1,
        isSubscribed: 1,
        email: 1,

      }
    }

  ])

  if (!channel?.length){
    throw new ApiError(404, "Channel not found")
  }

  return res
  .status(200)
  .json(new ApiResponse(200, channel[0], "Channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async (req, res)=>{
  const user = await User.aggregate([
    {
      $match:{
       _id:  new  moongoose.Types.ObjestId(req.user._id)
      }
    },
    {
      $lookup:{
        from : "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline:[
          {
            $lookup:{
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline:[
                {
                  $project:{
                    fullName: 1,
                    userName: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first: "$owner"
              }

            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"))
})

export {loginUser , registerUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser,updateAccountDetails ,updateUserAvatar ,updateCoverImage, getUserChannelProfile, getWatchHistory}
