import { Schema, model } from "mongoose";

const expenseCategorySchema = Schema({
  name: {
    type: String,
    required: [true, "Category name is required."],
    trim: true,
    upperCase: true,
    unique: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false
  }
}, { timestamps: true });

export const ExpenseCategory = new model("ExpenseCategory", expenseCategorySchema);