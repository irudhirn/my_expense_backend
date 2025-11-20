import { ExpenseCategory } from "../../models/expenseCategoryModel.js";

class ExpenseCategoryServices{
  async findExpenseCategories() {
    const categories = await ExpenseCategory.find().select("-__v -updatedAt");

    return categories;
  }

  async findExpenseCategoryById(id){
    const category = await ExpenseCategory.findById(id).select("-__v -updatedAt");

    return category;
  }

  async createExpenseCategory(req){
    const { name } = req.body;

    const newCategory = await ExpenseCategory.create({ name });

    delete newCategory["__v"];

    return newCategory
  }

  async updateExpenseCategory(req){
    const { id } = req.params;
    const { name } = req.body;

    const category = await ExpenseCategory.findByIdAndUpdate(id, { name }, { new: true }).select("-__v");

    return category;
  }

  async deleteExpenseCategory(req){
    const { id } = req.params;

    // const category = await ExpenseCategory.findByIdAndUpdate(id, { isDeleted: true }).select("-__v");
    // return category;
    await ExpenseCategory.findByIdAndUpdate(id, { isDeleted: true }).select("-__v");
  }
}

export default new ExpenseCategoryServices();