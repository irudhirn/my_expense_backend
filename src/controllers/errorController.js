import AppError from "../utils/appError.js";

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

const handleJWTError = () => new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () => new AppError("Your token has expired! Please log in again.", 401);


const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({ ok: false, error: err, message: err.message, stack: err.stack });
}

const sendErrorProd = (err, res) => {
  if(err.isOperational){ // operational error: send msg to client
    res.status(err.statusCode).json({ ok: false, message: err.message });   
  }else{ // Programming errors: don't leak error details to user, send generalised message
    // 1) Log error
    console.error('Error', err);
    // 2) send to client
    res.status(500).json({ ok: false, message: "Something went wrong." });
  }
}

// --- Unified error response ---
const sendError = (err, res) => {
  const isDev = process.env.NODE_ENV === "development";

  // Always log in dev (and optionally in prod via Winston/Pino)
  if (isDev) console.error("💥 ERROR:", err);
  console.log("err.name", err.name);
  console.log("err.message", err.message);
  // Build base response
  const response = {
    ok: false,
    message: err.isOperational ? err.message : "Something went wrong! Please try again later.",
  };

  // Include extra debug info only in development
  if (isDev) {
    response.error = err;
    response.stack = err.stack;
  }

  res.status(err.statusCode || 500).json(response);
};

const globalErrorController = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "fail";
  
  // if(process.env.NODE_ENV === "production"){
    // const error = JSON.parse(JSON.stringify(err));
    let error = { ...err };
    error.message = err.message; // preserve message (since .message isn’t enumerable)

    if(error.name === "CastError") error = error = handleCastErrorDB(error); // error handling for invalid DB Ids
    if(+error.code === 11000) error = handleDuplicateFieldError(error); // error handling for duplicate entries for unique fields
    if(error.name === "ValidationError") error = handleValidationError(error); // Mongoose validation errors
    if(error.name === "JsonWebTokenError") error = handleJWTError();
    if(error.name === "TokenExpiredError") error = handleJWTExpiredError();

  //   sendErrorProd(error, res);
  // }else{
  //   sendErrorDev(err, res);
  // }

  sendError(error, res);
}

export default globalErrorController;