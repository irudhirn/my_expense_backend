import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import { Expense } from "../models/expenseModel.js";
import APIFeatures from "../utils/apiFeatures.js";

export const getAllExpenses = asyncHandler(async (req, res, next) => {
  const filters = { user: req.user.id };
  let now = new Date();
  const dateFilter = {
    // $gte: req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - (1000 * (new Date().getDate()) * 24 * 60 * 60))
    $gte: req.query.startDate ? new Date(req.query.startDate) : ( now.getDate() === 1 ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1) )
  }
  if(req.query.endDate) dateFilter["$lte"] = new Date(req.query.endDate)
  filters["expenseDate"] = dateFilter;
  const amountFilter = {};
  if(req.query.minAmount) amountFilter["$gte"] = +req.query.minAmount;
  if(req.query.maxAmount) amountFilter["$lte"] = +req.query.maxAmount;
  if(Object.keys(amountFilter).length > 0) filters["expenseAmount"] = { ...amountFilter }
  if(req.query.expenseCategory) filters["expenseCategory"] = req.query.expenseCategory;
  
  const totalExpenses = await Expense.countDocuments(filters);
  
  // const expenses = await expensesQuery.query.select("-__v -updatedAt").populate({ path: "expenseCategory", select: "-__v -createdAt -updatedAt" });
  const expenses = await Expense.find(filters).select("-__v -updatedAt").populate({ path: "expenseCategory", select: "-__v -createdAt -updatedAt" });

  res.status(200).json({ ok: true, status: "success", message: "Expense fetched successfully.", results: expenses.length, total: totalExpenses, data: { expenses } });
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