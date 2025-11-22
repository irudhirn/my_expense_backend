import { Router } from "express";
import userRouter from "./userRoutes.js";
import rolesRouter from "./roleRoutes.js";
import expenseRouter from "./expenseRoutes.js";
import expenseCategoryRouter from "./expenseCategoryRoutes.js";
import protect from "../../middlewares/protectMiddleware.js";
import restrictTo from "../../middlewares/restrictMiddleware.js";

const router = Router();

router.use(protect, restrictTo("SUPERADMIN"));

router.use('/users', userRouter);
router.use("/roles", rolesRouter);
router.use("/expenses", expenseRouter);
router.use("/expense-categories", expenseCategoryRouter);

export default router;