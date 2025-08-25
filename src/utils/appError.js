class AppError extends Error{
  constructor(message, statusCode){
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode?.toString().startsWith("4") ? "fail" : "error";
    this.isOperational = true; // for errors like - invalid path, invalid input (mongoose validation error), failed to connect to server, request timeout

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;