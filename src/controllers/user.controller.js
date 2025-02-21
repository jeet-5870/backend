import {async_handler} from '../utils/asyncHandler.js'

const registerUser = async_handler(async (req, res, next) => {
  res.status(200).json({message: 'User registered successfully'})
})


export {registerUser}