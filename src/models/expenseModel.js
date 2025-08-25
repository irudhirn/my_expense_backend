import { Schema, model } from "mongoose";

const expenseSchema = Schema({
  title: {
    type: String,
    required: [true, "Expense title is required."],
    trim: true
  },
  expenseCategory: {
    // type: String,
    type: Schema.Types.ObjectId,
    ref: "ExpenseCategory",
    required: [true, "Expense category is required."]
  },
  expenseSubCategory: {
    type: String
  },
  expenseDate: {
    type: Date,
    default: Date.now(),
  },
  expenseAmount: {
    type: Number,
    required: [true, "Expense amount is required."]
  },
  transactionType: {
    type: String,
    enum: ["credit", "debit"],
    default: "debit"
  },
  expenseDescription: {
    type: String,
    trim: true
  },
  file: {
    type: String
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    select: false
  }
}, { timestamps: true });

export const Expense = new model("Expense", expenseSchema);