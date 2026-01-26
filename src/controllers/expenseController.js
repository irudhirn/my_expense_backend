import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import { Expense } from "../models/expenseModel.js";
import APIFeatures from "../utils/apiFeatures.js";
import ExpensesServices from "../services/db/expensesServices.js";

export const getAllExpenses = asyncHandler(async (req, res, next) => {
  const { expenses, totalExpenses, totalPages } = await ExpensesServices.findExpenses(req);

  res.status(200).json({ ok: true, status: "success", message: (expenses && !expenses?.length) ? "No expenses found" : "Expense fetched successfully.", results: expenses.length, total: totalExpenses, totalPages, data: { expenses } });
})

export const getStats = asyncHandler(async (req, res, next) => {
  const { timePeriod } = req.params;
  
  const stats = await ExpensesServices.getStats(+timePeriod, req.user);

  res.status(200).json({ ok: true, status: "success", message: `Stats for ${timePeriod} days fetched successfully!`, data: { stats } });
});

export const getTopExpenses = asyncHandler(async (req, res, next) => {
  const { timePeriod } = req.params;

  const topExpenses = await ExpensesServices.getTopExpenses(+timePeriod, req.user);

  res.status(200).json({ ok: true, status: "success", message: `Expense insights fetched successfully`, data: topExpenses });
})

export const getExpense = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const expense = await ExpensesServices.findExpenseById(id);

  res.status(200).json({ ok: true, status: "success", message: "Expense fetched successfully.", data: { expense } });
})

export const createExpense = asyncHandler(async (req, res, next) => {
  const expense = await ExpensesServices.createExpense(req);

  res.status(201).json({ ok: true, status: "success", message: "Expense added successfully.", data: { expense } });
})

export const updateExpense = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const expense = await ExpensesServices.updateExpense(id, req);

  res.status(200).json({ ok: true, status: "success", message: "Expense details updated successfully!", data: { expense } });
})

export const deleteExpense = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const expense = await ExpensesServices.deleteExpense(id);
  console.log("deleteExpense", expense);

  res.status(204).json({ ok: true, status: "fail", message: "Expense deleted successfully!", data: null })
})