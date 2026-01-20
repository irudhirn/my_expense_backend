import crypto from "crypto";
import sendMail from "../utils/email.js";
import { User } from "../models/userModel.js";
import AppError from "../utils/appError.js";
import asyncHandler from "../utils/asyncHandler.js";
import generatePassword, { generateRandomPassword } from "../utils/generatePassword.js";
import { signAccessToken, signRefreshToken, signToken } from "../utils/signToken.js";
import { Role } from "../models/roleModel.js";
import { deleteImagesFromS3, processAndUploadImage } from "../services/image/imageService.js";

export const createPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  const hashedPassword = await generatePassword(password);

  res.status(200).json({ ok: true, message: "Password generated successfully!", data: { password: hashedPassword } });
})

export const signup = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, username, email, password, confirmPassword } = req.body;
  
  if(!firstName?.trim() || !lastName?.trim() || !username?.trim() || !email?.trim() || !password?.trim()){
    return res.status(400).json({ ok: false, status: "fail", message: "All fields are required!" })
  }
  
  // const existingUser = await User.findOne({ username, email }); // not secured - This finds a user if either username or email matches. An attacker could use someone's email with a new username to trigger "already exists" or vice versa.
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  
  // if(!!existingUser) return next(new AppError("User with provided Username OR Email already exists.\nTry with different Username OR Email!", 400)); // Don't expose which field exists. An attacker can use this to enumerate (discover) existing accounts. After trying few permutation & combinations of email/username & common passwords, attacker knows valid usernames/emails for targeted phishing or brute-force attacks.
  if (existingUser) return next(new AppError("An account with these credentials already exists", 400));
  
  const user = await User.create({ firstName, lastName, username, email, password, passwordConfirm: confirmPassword });

  user.password = undefined; // don't expose in response
  user.passwordConfirm = undefined; // don't expose in response
  
  res.status(201).json({ ok: true, status: "success", message: "Signup successful!", data: { user } })
});

export const login = asyncHandler(async (req, res, next) => {
  // const { username, email, password } = req.body;
  const { userId, password } = req.body;

  // if(((!username || typeof username !== "string") && (!email || typeof email !== "string")) || !password){
  if(((!userId || typeof userId !== "string")) || !password){
    return next(new AppError("Invalid credentials!", 400));
  }

  const user = await User.findOne({ $or: [{username: userId}, {email: userId}] }).select("+password +role").populate({ path: "role", select: "-__v -updatedAt" });
  // const user = await User.findOne({username}).select("+password");
  // console.log("user",user);

  if(!user || !(await user.isPasswordCorrect(password, user.password))) return next(new AppError("Invalid credentials!", 400));

  const token = signToken(user?._id);
  const accessToken = signAccessToken(user?._id);
  const refreshToken = signRefreshToken(user?._id);

  const cookieOptions = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000)), // 24 * 60 * 60 * 1000 = 1d
    secure: false,
    httpOnly: true,
    // sameSite: 'Lax'
    sameSite: 'None'
  }
  // if(process.env.NODE_ENV === "production") cookieOptions["secure"] = true;
  // if(process.env.NODE_ENV !== "development") cookieOptions["secure"] = true;

  // res.cookie('jwt', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, cookieOptions);

  // res.status(200).json({ ok: true, status: "success", message: "Login successful!", token, data: { user } });
  res.status(200).json({ ok: true, status: "success", message: "Login successful!", token: accessToken, data: { user } });
});

export const adminLogin = asyncHandler(async (req, res, next) => {
  const { userId, password } = req.body;

  // if(((!username || typeof username !== "string") && (!email || typeof email !== "string")) || !password){
  if(((!userId || typeof userId !== "string")) || !password){
    return next(new AppError("Invalid credentials!", 400));
  }

  // const role = await Role.findOne({ $or: [{ name: "SUPERADMIN" }, { name: "ADMIN" }, { name: "ADMIN_REVIEWER" }] }).select("-__v -type");

  // const user = await User.findOne({ $or: [{username}, {email}] }).select("+password +role").populate({ path: "role", select: "-__v -updatedAt" });
  const user = await User.findOne({ $or: [{username: userId}, {email: userId}] }).select("+password +role").populate({ path: "role", select: "-__v -updatedAt" });
  // const user = await User.findOne({username}).select("+password");
  console.log("user",user);
  console.log("role",user.role.name);
  if(!user || !(await user.isPasswordCorrect(password, user.password))) return next(new AppError("Invalid credentials!", 400));

  // if(user.role.name !== "SUPERADMIN" || user.role.name !== "ADMIN" || user.role.name !== "ADMIN_REVIEWER") return next(new AppError("You do not have access to Admin Panel!", 400));
  if(!["SUPERADMIN", "ADMIN", "ADMIN_REVIEWER"].includes(user.role.name)) return next(new AppError("You do not have access to Admin Panel!", 400));

  const token = signToken(user?._id);
  const accessToken = signAccessToken(user?._id);
  const refreshToken = signRefreshToken(user?._id);

  const cookieOptions = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000)), // 24 * 60 * 60 * 1000 = 1d
    secure: false,
    httpOnly: true,
    // sameSite: 'Lax'
    sameSite: 'None'
  }
  // if(process.env.NODE_ENV === "production") cookieOptions["secure"] = true;
  // if(process.env.NODE_ENV !== "development") cookieOptions["secure"] = true;

  // res.cookie('jwt', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, cookieOptions);

  // res.status(200).json({ ok: true, status: "success", message: "Login successful!", token, data: { user } });
  res.status(200).json({ ok: true, status: "success", message: "Login successful!", token: accessToken, data: { user } });
});

export const refresh = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken;
  if(!token) return next(new AppError("Token expired!", 401));

  try{
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if(!user || user.refreshToken !== token) return next(new AppError("User not found!", 403));

    const accessToken = signAccessToken(user._id);
    res.status(200).json({ ok: true, status: "success", message: "New Access Token generated successfully.", accessToken });
  }catch(err){
    console.error(err);
  }
})

export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    const decoded = jwt.decode(token);
    await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
  }
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
};

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email, username } = req.body;

  const user = await User.findOne({ $or: [{ email }, { username }] });

  if(!user) return next(new AppError("Invalid email or username!", 400));

  const passwordResetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordLink = `${req.protocol}://${req.get("host")}/ap1/v1/resetPassword/${passwordResetToken}`;

  const subject = "Password reset link is valid for 10 minutes."
  const message = `Forgot your password? Submit a PATCH request with your new passoword and passwordConfirm to: ${resetPasswordLink}.\nIf you didn't forget your password, please ignore this email!`;

  try{
    await sendMail({ email: user.email, subject, message});
  
    res.status(200).json({ ok: true, status: "success", message: "Password reset link sent to your email!" });
  }catch(err){
    console.error(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError("There was an error sending the email. Try again later.", 500));
  }
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const hashedResetToken = crypto.createHash('sha256').update(id).digest('hex');

  const user = await User.findOne({ passwordResetToken: hashedResetToken, passwordResetExpires: { $gt: Date.now() } });

  if(!user) return next(new AppError("Link is either invalid or expired.", 400));


  const newPassword = generateRandomPassword();

  const subject = `New password for account ${user.email}`;
  const message = `Password reset token has been verified. Use password given below for login & kindly update your password post login.\nPassword - ${newPassword}`;

  try{
    await sendMail({ email: user.email, subject, message});

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.password = newPassword;
    user.passwordConfirm = newPassword;
    await user.save();
    res.status(200).json({ ok: true, status: "success", message: `New password has been sent to your email.` });
  }catch(err){
    console.error(err);
    return next(new AppError("Error occured. Try again.", 500));
  }

});

export const updatePassword = asyncHandler(async (req, res, next) => {
  const { password, newPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");

  if(!user || !(await user.isPasswordCorrect(password, user.password))) return next(new AppError("Current password is incorrect.", 400));

  user.password = newPassword;
  user.passwordConfirm = newPassword;
  await user.save();

  const token = signToken(user._id);
  
  const cookieOptions = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000)),
    // secure: true,
    httpOnly: true
  }
  if(process.env.NODE_ENV === "production") cookieOptions["secure"] = true;

  res.cookie('jwt', token, cookieOptions);

  res.status(200).json({ ok: true, status: "success", message: "Password updated successfully!", token });
});

export const profile = asyncHandler(async (req, res, next) => {
  // const user = req.user;

  const user = await User.findById(req.user.id).select("-__v").populate({path:"role", select: "-__v"});

  res.status(200).json({ ok: true, status: "success", message: "Profile details fetched successfully!", data: { user } });
});

export const uploadProfileImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide an image file',
    });
  }

  // Process and upload images
  const imageUrls = await processAndUploadImage(req.file);

  // Update user document
  const user = await User.findByIdAndUpdate(
    req.user._id, // Assuming you have auth middleware
    {
      imageSmall: imageUrls.imageSmall,
      imageMedium: imageUrls.imageMedium,
      imageLarge: imageUrls.imageLarge,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      imageSmall: user.imageSmall,
      imageMedium: user.imageMedium,
      imageLarge: user.imageLarge,
    },
  });
});

/**
 * Delete profile image
 */
export const deleteProfileImage = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user.imageSmall && !user.imageMedium && !user.imageLarge) {
    return res.status(400).json({
      status: 'fail',
      message: 'No profile image to delete',
    });
  }

  const imageUrls = {
    imageSmall: user.imageSmall,
    imageMedium: user.imageMedium,
    imageLarge: user.imageLarge,
  };

  // Delete from S3
  await deleteImagesFromS3(imageUrls);

  // Remove URLs from database
  user.imageSmall = undefined;
  user.imageMedium = undefined;
  user.imageLarge = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    ok: true,
    status: 'success',
    message: 'Profile image deleted successfully',
  });
});