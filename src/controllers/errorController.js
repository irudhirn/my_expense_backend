import AppError from "../utils/appError";

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`

  return new AppError(message, 400);
}

const handleDuplicateFieldError = (err) => {
  let val = err?.errorResponse?.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field value ${val}. Try different one.`;

  return new AppError(message, 400);
}

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;

  return new AppError(message, 400);
}

const sendErrorDev = () => {
  res.status(err.statusCode).json({ ok: false, error: err, message: err.message, stack: err.stack });
}

const sendErrorProd = () => {
  if(err.isOperational){ // operational error: send msg to client
    res.status(err.statusCode).json({ ok: false, message: err.message });   
  }else{ // Programming errors: don't leak error details to user, send generalised message
    // 1) Log error
    console.error('Error', err);
    // 2) send to client
    res.status(500).json({ ok: false, message: "Something went wrong." });
  }
}

const globalErrorController = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "fail";

  if(process.env.NODE_DEV === "production"){
    const error = JSON.parse(JSON.stringify(err));

    if(error.name === "CastError") error = error = handleCastErrorDB(error); // error handling for invalid DB Ids
    if(+error.code === 11000) error = handleDuplicateFieldError(error); // error handling for duplicate entries for unique fields
    if(error.name === "ValidationError") error = handleValidationError(error); // Mongoose validation errors

    sendErrorProd(err, res);
  }else{
    sendErrorDev(err, res);
  }
}

export default globalErrorController;