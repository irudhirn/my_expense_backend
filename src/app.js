import express from "express";
import cors from "cors";

import userRouter from "./routes/userRoutes.js";
import rolesRouter from "./routes/roleRoutes.js";
import expenseRouter from "./routes/expenseRoutes.js";
import expenseCategoryRouter from "./routes/expenseCategoryRoutes.js";
import AppError from "./utils/appError.js";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use("/api/v1/users", userRouter);
app.use("/api/v1/roles", rolesRouter);
app.use("/api/v1/expenses", expenseRouter);
app.use("/api/v1/expense-categories", expenseCategoryRouter);

app.all("/{*any}", (req, res, next) => {
  next(new AppError(`The route ${req.originalUrl} not found.`, 404));
});

export default app;