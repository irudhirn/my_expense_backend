import { Router } from "express";

import adminRouter from "./adminRoutes.js";
import userRouter from "./userRoutes.js";
import rolesRouter from "./roleRoutes.js";
import expenseRouter from "./expenseRoutes.js";
import expenseCategoryRouter from "./expenseCategoryRoutes.js";

const router = Router();

router.route("/").get((req, res, next) => res.status(200).json({ ok: true, status: "success", message: "🟢 Hello from TrackMyMoney" }));
// router.route("/").get((req, res, next) => res.send("🙏🏻 Hello from TrackMyMoney🟢"));

router.use("/admin", adminRouter);
router.use("/users", userRouter);
router.use("/roles", rolesRouter);
router.use("/expenses", expenseRouter);
router.use("/expense-categories", expenseCategoryRouter);

export default router;