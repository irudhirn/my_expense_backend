import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import { ExpenseCategory } from "../models/expenseCategoryModel.js";
import ExpenseCategoryServices from "../services/db/expenseCategoryServices.js";

export const getAllExpenseCategories = asyncHandler(async (req, res, next) => {
  const categories = await ExpenseCategoryServices.findExpenseCategories();

  res.status(200).json({ ok: true, status: "success", message: "Expense categories fetched successfully.", data: { categories } });
})

export const getExpenseCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const category = await ExpenseCategoryServices.findExpenseCategoryById(id);

  res.status(200).json({ ok: true, status: "success", message: "Expense category fetched successfully.", data: { category } });
})

export const createExpenseCategory = asyncHandler(async (req, res, next) => {
  const category = await ExpenseCategoryServices.createExpenseCategory(req);

  res.status(200).json({ ok: true, status: "success", message: "Expense category created successfully.", data: { category } });
})

export const updateExpenseCategory = asyncHandler(async (req, res, next) => {
  const category = await ExpenseCategoryServices.updateExpenseCategory(req);

  res.status(200).json({ ok: true, status: "success", message: "Expense category updated successfully.", data: { category } });
})

export const deleteExpenseCategory = asyncHandler(async (req, res, next) => {
  await ExpenseCategoryServices.deleteExpenseCategory(req);

  res.status(200).json({ ok: true, status: "success", message: "Expense category deleted successfully." });
})