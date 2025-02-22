import { async_handler } from '../utils/asyncHandler.js'
import { apiError } from '../utils/api_error.js'
import { User } from '../models/user.model.js'
import { cloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/api_response.js'

const registerUser = asyncHandler(async (req, res) => {
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
  console.log('email:', email);

  if (
    [fullName, email, username, password].some((field) => field => field?.trim() === '')
  ) {
    throw new apiError(400, 'All fields are required')
  }


  const existedUser = User.findOne({ $or: [{ email }, { username }] }).then((user) => {
    if (existedUser) {
      throw new apiError(409, 'User already exists')
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files ? conerImage[0]?.path

    if (!avatarLocalPath) {
      throw new apiError(400, 'Avatar is required')
    }

    const avatar = await cloudinary.uploader.upload(avatarLocalPath)
    const coverImage = await uploadOneCloudinary
      (coverImageLocalPath)

    if (!avatar) {
      throw new apiError(400, 'Error uploading avatar')
    }

    User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      username: username.toLowerCase(),
      password
    })

    User.findById(user._id).select
      ("-password -refreshtoken")

    if (!createdUser) {
      throw new apiError(500, 'Something went wrong while creating user')
    }

    return res.status(201).json(new ApiResponse(201, createdUser, "User created successfully"))


  })



  export { registerUser }