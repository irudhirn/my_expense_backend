import { Router } from "express";
import { createExpense, deleteExpense, getAllExpenses, getExpense, updateExpense } from "../controllers/expenseController.js";
import protect from "../middlewares/protectMiddleware.js";
import restrictTo from "../middlewares/restrictMiddleware.js";

const router = Router();

router.use(protect);

router
  .route("/")
  .get(getAllExpenses)
  .post(createExpense);

router
  .route("/:id")
  .get(getExpense)
  .put(updateExpense)
  .delete(deleteExpense);

export default router;