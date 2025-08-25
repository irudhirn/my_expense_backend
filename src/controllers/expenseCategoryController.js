import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import { ExpenseCategory } from "../models/expenseCategoryModel.js";

export const getAllExpenseCategories = asyncHandler(async (req, res, next) => {
  const categories = await ExpenseCategory.find().select("-__v -updatedAt");

  res.status(200).json({ ok: true, status: "success", message: "Expense categories fetched successfully.", data: { categories } });
})

export const getExpenseCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const category = await ExpenseCategory.findById(id).select("-__v -updatedAt");

  res.status(200).json({ ok: true, status: "success", message: "Expense category fetched successfully.", data: { category } });
})

export const createExpenseCategory = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  const newCategory = await ExpenseCategory.create({ name });

  delete newCategory["__v"];

  res.status(200).json({ ok: true, status: "success", message: "Expense category created successfully.", data: { category: newCategory } });
})

export const updateExpenseCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  const category = await ExpenseCategory.findByIdAndUpdate(id, { name }, { new: true }).select("-__v");

  res.status(200).json({ ok: true, status: "success", message: "Expense category updated successfully.", data: { category } });
})

export const deleteExpenseCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const category = await ExpenseCategory.findByIdAndUpdate(id, { isDeleted: true }).select("-__v");

  res.status(200).json({ ok: true, status: "success", message: "Expense category deleted successfully." });
})