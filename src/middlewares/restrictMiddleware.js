import AppError from "../utils/appError.js";

export const restrictTo = (...roles) => (req, res, next) => {
  if(!roles.includes(req.user.role.name)) return next(new AppError("You do not have performance to perform this action.", 401));

  next();
}
export default restrictTo;