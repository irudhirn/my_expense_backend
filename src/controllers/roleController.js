import { Role } from "../models/roleModel.js";
import asyncHandler from "../utils/asyncHandler.js"

export const getAllRoles = asyncHandler(async (req, res, next) => {
  const roles = await Role.find();

  res.status(200).json({ ok: true, status: "success", message: "Roles fetched successfully!", data: { roles } });
})
export const getRole = asyncHandler(async (req, res, next) => {
  
})
export const createRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  const newRole = await Role.create({ role });

  res.status(201).json({ ok: true, message: "Role created successfully!", data: { role: newRole } });
})
export const updateRole = asyncHandler(async (req, res, next) => {
  
})
export const deleteRole = asyncHandler(async (req, res, next) => {
  
})