import { Router } from "express";
import protect from "../middlewares/protectMiddleware.js";
import restrictTo from "../middlewares/restrictMiddleware.js";
import { createExpenseCategory, deleteExpenseCategory, getAllExpenseCategories, getExpenseCategory, updateExpenseCategory } from "../controllers/expenseCategoryController.js";

const router = Router();

router
  .route("/")
  .get(getAllExpenseCategories)
  .post(protect, restrictTo("SUPERADMIN"), (req, _, next) => { console.log("req.body", req.body); next(); }, createExpenseCategory);

router
  .route("/:id")
  .get(getExpenseCategory)
  .patch(protect, restrictTo("SUPERADMIN"), updateExpenseCategory)
  .delete(protect, restrictTo("SUPERADMIN"), deleteExpenseCategory);

export default router;