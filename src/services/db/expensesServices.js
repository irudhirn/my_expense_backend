import { Expense } from "../../models/expenseModel.js";

class ExpensesServices {
  constructor() {

  }

  async findExpenses(req){
    const filters = { user: req.user.id, isDeleted: req.query.isDeleted ? req.query.isDeleted === "true" : { $ne: true } };
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
    // if(req.query.isDeleted) filters["isDeleted"] = {  };
    
    const totalExpenses = await Expense.countDocuments(filters);
    
    // const expenses = await expensesQuery.query.select("-__v -updatedAt").populate({ path: "expenseCategory", select: "-__v -createdAt -updatedAt" });
    const expenses = await Expense.find(filters).select("-__v -updatedAt").populate({ path: "expenseCategory", select: "-__v -createdAt -updatedAt" });

    return { expenses, totalExpenses };
  }

  async findExpenseById(id){
    const expense = await Expense.findById(id).select("-__v -updatedAt").populate({ path: "expenseCategory", select: "-__v -updatedAt" });

    return expense;
  }

  async createExpense(req){
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

    return expense;
  }

  async updateExpense(id, req){
    const { title, expenseCategory, expenseSubCategory, vendor, expenseDate, expenseAmount, transactionType, expenseDescription } = req.body;
    const expense = await Expense.findByIdAndUpdate(id, { title, expenseCategory, expenseSubCategory, vendor, expenseDate, expenseAmount, transactionType, expenseDescription }, { new: true }).select("-__v -updatedAt")?.populate({ path: "expenseCategory", select: "-__v -updatedAt "});

    return expense;
  }

  async deleteExpense(id){
    const expense = await Expense.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

    return expense;
  }
}

export default new ExpensesServices();