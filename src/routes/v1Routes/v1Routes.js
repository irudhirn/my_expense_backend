import { Router } from "express";

import adminRouter from "./adminRoutes.js";
import userRouter from "./userRoutes.js";
import rolesRouter from "./roleRoutes.js";
import expenseRouter from "./expenseRoutes.js";
import expenseCategoryRouter from "./expenseCategoryRoutes.js";

const router = Router();

router.use("/admin", adminRouter);
router.use("/users", userRouter);
router.use("/roles", rolesRouter);
router.use("/expenses", expenseRouter);
router.use("/expense-categories", expenseCategoryRouter);

export default router;