import rateLimit from "express-rate-limit";

export const signUpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many attempts. Please try again later."
});