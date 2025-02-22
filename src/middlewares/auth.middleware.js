import jwt from "jsonwebtoken"
import async_handler from "express-async-handler"
import ApiError from "../utils/ApiError.js"
import User from "../models/User.js"

export const verifyJWT = async_handler(async (req, _, next) => {
  try {
    const token = req.cookies?.accessToken || req.header
      ("Authorization")?.replace("Bearer ", "")

    if (!token) {
      throw new ApiError(401, "Unauthorized")
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

    await User.findById(decodedToken?._id).select("-password -refreshToken")

    if (!User) {
      throw new ApiError(401, "Unauthorized")
    }

    req.user = user;
    next()
  } catch (error) {
    throw new
      ApiError(401, error?.message || "Unauthorized")
  }





})