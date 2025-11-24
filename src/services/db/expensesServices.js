import mongoose from "mongoose";
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

  async getStats(timePeriod = 7, user){
    
    const stats = await Expense.aggregate([ // My try
      { $match: { expenseDate: { $gte: new Date(Date.now() - timePeriod * 1000 * 60 * 60 * 24) }, user: new mongoose.Types.ObjectId(user?._id) } },
      { $group: {
          _id: null,
          totalExpenses: { $sum: 1 },
          averageExpenditure: { $avg: "$expenseAmount" },
          totalExpenditure: { $sum: "$expenseAmount" }
        },
      }
    ]);

    // Cluade's solution
    // const startDate = new Date();
    // startDate.setDate(startDate.getDate() - timePeriod);

    // const stats = await Expense.aggregate([
    //   { $match: { expenseDate: { $gte: startDate } } },
    //   { $group: {
    //       _id: null,
    //       totalExpenses: { $sum: 1 },
    //       averageExpenditure: { $avg: "$expenseAmount" },
    //       totalExpenditure: { $sum: "$expenseAmount" }
    //     },
    //   }
    // ]);

    // return stats;
    return stats.length > 0 ? stats[0] : { 
      totalExpenses: 0, 
      totalExpenditure: 0, 
      averageExpenditure: 0 
    };
  }

  // For fetching multiple time periods at once:
  async getStatsForMultiplePeriods(userId) {
    const periods = [7, 30, 90, 180, 365];
    const results = {};

    for (const period of periods) {
      const stats = await this.getStats(period);
      results[`last_${period}_days`] = stats;
    }

    return results;
  }
  // alternate of above
  async getStatsForMultiplePeriods(userId) {
    const now = new Date();
    const periods = { 7: 7, 30: 30, 90: 90, 180: 180, 365: 365 };

    return await Expense.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $facet: {
          last_7_days: [
            { $match: { expenseDate: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } },
            { $group: { _id: null, totalExpenses: { $sum: 1 }, totalExpenditure: { $sum: "$expenseAmount" }, averageExpenditure: { $avg: "$expenseAmount" } } }
          ],
          last_30_days: [
            { $match: { expenseDate: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } },
            { $group: { _id: null, totalExpenses: { $sum: 1 }, totalExpenditure: { $sum: "$expenseAmount" }, averageExpenditure: { $avg: "$expenseAmount" } } }
          ]
          // Add other periods similarly...
        }
      }
    ]);
  }

  async getTopExpenses(timePeriod = 30, user){
    const topExpenses = await Expense.aggregate([
      { $match: { expenseDate: { $gte: new Date(Date.now() - timePeriod * 1000 * 60 * 60 * 24) }, user: new mongoose.Types.ObjectId(user?._id) } },
      { $lookup: {
          from: "expensecategories", // $lookup - Joins the expensecategories collection with your expense documents using expenseCategory field
          localField: "expenseCategory", // 
          foreignField: "_id",
          as: "expenseCategory"
        }
      },
      { $unwind: { // $unwind - Converts the expenseCategory array (from $lookup) into a single object
          path: "$expenseCategory",
          preserveNullAndEmptyArrays: true // preserveNullAndEmptyArrays: true - keeps expenses even if category doesn't exist
        }
      },
      { $facet: {
        topExpenses: [
          { $sort: { expenseAmount: -1 } },
          { $limit: 5 },
          { $project: { title: 1, expenseAmount: 1, expenseDate: 1, "expenseCategory._id": 1, "expenseCategory.name": 1 } }
        ],
        leastExpenses: [
          { $sort: { expenseAmount: 1 } },
          { $limit: 5 },
          { $project: { title: 1, expenseAmount: 1, expenseDate: 1, "expenseCategory._id": 1, "expenseCategory.name": 1 } }
        ]
      } },
      { $project: { // This is redundant in this case. It's saying "keep only these two arrays from the $facet output". Can be removed safely.
          topExpenses: 1,
          leastExpenses: 1
        }
      }
    ]);

    return topExpenses?.length > 0 ? topExpenses[0] : { topExpenses: [], leastExpenses: [] };
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