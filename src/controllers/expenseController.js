import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import { Expense } from "../models/expenseModel.js";

export const getAllExpenses = asyncHandler(async (req, res, next) => {
  const expenses = await Expense.find({ user: req.user.id }).select("-__v -updatedAt").populate({ path: "expenseCategory", select: "-__v -createdAt -updatedAt" });

  res.status(200).json({ ok: true, status: "success", message: "Expense fetched successfully.", results: expenses.length, data: { expenses } });
})

export const getExpense = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const expense = await Expense.findById(id).select("-__v -updatedAt").populate({ path: "expenseCategory", select: "-__v -updatedAt" });

  res.status(200).json({ ok: true, status: "success", message: "Expense fetched successfully.", data: { expense } });
})

export const createExpense = asyncHandler(async (req, res, next) => {
  const { title, expenseCategory, expenseSubCategory, expenseDate, expenseAmount, transactionType, expenseDescription, file } = req.body;
  const expenseData = {
    title, expenseCategory, expenseSubCategory, expenseDate, expenseAmount, transactionType, expenseDescription, file, user: req.user.id
  };

  for (const key in expenseData) {
    if (!expenseData[key]) {
      delete expenseData[key];
    }
  }

  const expense = await Expense.create({ ...expenseData });

  res.status(201).json({ ok: true, status: "success", message: "Expense added successfully.", data: { expense } });
})

export const updateExpense = asyncHandler(async (req, res, next) => {
  
})

export const deleteExpense = asyncHandler(async (req, res, next) => {
  
})