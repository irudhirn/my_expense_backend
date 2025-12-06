import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';

import v1Router from "./routes/v1Routes/v1Routes.js";
import AppError from "./utils/appError.js";
import globalErrorController from "./controllers/errorController.js";


dotenv.config({
  path: ".env"
});

const app = express();

// Add cookie-parser middleware
app.use(cookieParser()); 

app.use(
  cors({
    origin: ["http://trackmymoney.co.in", "https://trackmymoney.co.in", "http://www.trackmymoney.co.in", "https://www.trackmymoney.co.in", "http://localhost:8080", "http://localhost:8081"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));


app.use("/api/v1", v1Router);
// app.use("/api/v1/admin", adminRouter);
// app.use("/api/v1/users", userRouter);
// app.use("/api/v1/roles", rolesRouter);
// app.use("/api/v1/expenses", expenseRouter);
// app.use("/api/v1/expense-categories", expenseCategoryRouter);

app.all("/{*splat}", (req, res, next) => {
  return next(new AppError(`The route ${req.originalUrl} not found.`, 404));
});

app.use(globalErrorController);

export default app;