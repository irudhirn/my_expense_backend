import { promisify } from "util";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/userModel.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
    token = req.headers.authorization.split(" ").pop();
  }
  
  // 1) See if token exists
  if(!token) return next(new AppError("You are not logged in!", 401));

  // 2) Verify token
  // const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  // console.log("decoded", decoded); // o/p -> { id: '6645dd1708e82d3ba79701b3', iat: 1715898188, exp: 1718490188 } // This id is the same id we got in response of signup

  const isAccessTokenExpired = decoded.exp < Date.now() / 1000;
  if(isAccessTokenExpired) return next(new AppError("Access token expired!", 401));

  // 3) Check if user still exists
  const curUser = await User.findById(decoded.id).populate("role");
  if(!curUser) return res.status(400).json({ ok: false, status: "fail", message: "This user does not exists." });

  // 4) Check if user has changed password after token was issued
  if(curUser.isPasswordChangedPostLogin(decoded.iat)) return res.status(401).json({ ok: false, status: "fail", message: "Password has been changed recently! Please login again." });

  req.user = curUser;

  next();
})

export default protect;