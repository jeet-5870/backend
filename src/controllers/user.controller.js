import { async_handler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/api_error.js'
import { User } from '../models/user.model.js'
import { cloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/api_response.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens")
  }
}

const registerUser = async_handler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res


  const { fullName, email, username, password } = req.body
  //console.log("email: ", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required")
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists")
  }
  //console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }


  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
  }


  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
  )

})

const loginUser = async_handler(async (req, res) => {
  // req body -> data
  // username email
  // find user
  // check password
  // generate token and refresh token
  // send cookie

  const { username, password, email } = req.body
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required")
  }

  const user = await User.findOne({ $or: [{ usrname }, { email }] })

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  const isPasswordcorrect = await user.isPasswordcorrect(password)

  if (!isPasswordcorrect) {
    throw new ApiError(401, "Password not found")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const Options = {
    httpOnly: true,
    secure: true
  }


  return res.status(200)
    .cookie("accessToken", accessToken, Options)
    .cookie("refreshToken", refreshToken, Options)
    .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"))



})

const logoutUser = async_handler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined
    }
  }, {
    new: true
  })
  const Options = {
    httpOnly: true,
    secure: true
  }


  return res
    .status(200)
    .clearCookie("accessToken", Options)
    .clearCookie("refreshToken", Options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = async_handler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (incomingRefreshToken) {
    throw new ApiError(400, "Refresh Token is required")
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)


    const user = await User.findById(decodedToken._id)

    if (!user) {
      throw new ApiError(400, "Invalid Refresh Token")
    }

    if (!incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(400, "Invalid Refresh Token")
    }

    const Options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, newrefreshToken } = await generateAccessAndRefreshToken(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, Options)
      .cookie("refreshToken", refreshToken, Options)
      .json(new ApiResponse(200, {
        accessToken, newrefreshToken
      }, "Access Token Refreshed Successfully"))
  } catch (error) {
    throw new ApiError(400, "Invalid Refresh Token")
  }

})

const currentUserPassword = async_handler(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  const user = User.findById(req.user?._id)
  const isPasswordcorrect = await user.isPasswordcorrect(oldPassword)

  if (!isPasswordcorrect) {
    throw new ApiError(400, "Old Password is incorrect")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })


  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))



})

const getCurrentUser = async_handler(async (req, res) => {
  return yes
    .status
    .json(200, req.user, "User fetched successfully")
})

const updateAccountDetails = async_handler(async (req, res) => {
  const { fullName, email, username } = req.body

  if (!fullName && !email) {
    throw new ApiError(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email
      }
    },
    { new: true }
  ).select("-password -refreshToken")

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User details updated successfully"))


})

const updateUserAvatar = async_handler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }


  const avatar = await updateOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar")
  }

  const user = await User.finfByIdAndUpdate(
    req?.user._id, {
    $set: {
      avatar: avatar.url
    }
  }, { new: true }).select("-password -refreshToken")

  return res
    .status(200)
    .json(new ApiResponse(200, User, "Avatar updated successfully"))

})


const updateUserCoverImage = async_handler(async (req, res) => {
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }


  const coverImage = await updateOnCloudinary(coverImageLocalPath)

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading cover image")
  }

  const user = await User.findByIdAndUpdate(
    req?.user._id, {
    $set: {
      coverImage: coverImage.url
    }
  }, { new: true }).select("-password -refreshToken")

  return res
    .status(200)
    .json(new ApiResponse(200, User, "Cover Image updated successfully"))

})

const getUserChannelProfile = async_handler(async (req, res) => {
  const { username } = req.params

  if (!username) {
    throw new ApiError(400, "Username is required")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    $lookup: {
      from: "subscriptions",
      Localfield: "_id",
      foreignField: "channel",
      as: "subscribers"
    },
    $lookup: {
      from: "subscriptions",
      Localfield: "_id",
      foreignField: "subscriber",
      as: "subscriptions"
    },
    {
      $addFields: {
        subscriberCount: { $size: "$subscribers" },
        subscriptionCount: { $size: "$subscriptions" },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"]
            },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        password: 1,
        refreshToken: 1,
        subscribers: 1,
        subscriptions: 1
      }
    }
  ])
  if (!channel?.length) {
    throw new ApiError(404, "Channel not found")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel fetched successfully"))
})

const getWatchHistory = async_handler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory"
      },
      pipeline: [
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
          }
        },
        {
          $addFields: {
            owner: {
              $first: "$owner"
            }
          }
        }
      ]
    },

  ])

  return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch History fetched successfully"))
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  currentUserPassword,
  updateAccountDetails,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
}