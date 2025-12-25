import { User } from "../models/userModel.js";
import UserServices from "../services/db/userServices.js";
import asyncHandler from "../utils/asyncHandler.js"

export const getAllUsers = asyncHandler(async (req, res, next) => {
  const { page } = req.params;
  const users = await UserServices.getAllUsers();
  // const users = await User.find().populate("role");

  res.status(200).json({ ok: true, data: { users } });
})

export const getUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);

  res.status(200).json({ ok: true, status: "success", message: "User data fetched successfully.", data: { user } });
})

export const createUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, username, email, password } = req.body;

  if(!firstName?.trim() || !lastName?.trim() || !username?.trim() || !email?.trim() || !password?.trim()){
    return res.status(400).json({ ok: false, status: "fail", message: "All fields are required!" })
  }

  const existingUser = await User.find({ username, email });

  if(!existingUser) return next(new AppError("User with provided Username OR Email already exists.\nTry with different Username OR Email!", 400));

  const user = await User.create({ firstName, lastName, username, email, password });

  res.status(201).json({ ok: true, status: "success", message: "User created successfully!", data: { user } })
})

export const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  const user = await User.findById(id);

  user.role = role;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ ok: true, status: "success", message: "User updated successfully!", data: { user } });
})

export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const user = await User.findById(id);
  
  user.isDeleted = true;
  await user.save({ validateBeforeSave: false });
  
  res.status(204).json({ ok: true, status: "success", message: "User deleted successfully!" });
})