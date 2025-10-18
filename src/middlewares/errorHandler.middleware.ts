import * as express from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: string[] | undefined;

  // Log error for debugging
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Handle different types of errors
  if (err instanceof AppError) {
    // Application-specific errors
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    // Zod validation errors
    statusCode = 400;
    message = "Validation failed";
    errors = err.issues.map(
      (error: any) => `${error.path.join(".")}: ${error.message}`
    );
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma database errors
    statusCode = 400;

    switch ((err as any).code) {
      case "P2002":
        message = "A record with this information already exists";
        break;
      case "P2025":
        message = "Record not found";
        break;
      case "P2003":
        message = "Foreign key constraint failed";
        break;
      case "P2014":
        message =
          "The change you are trying to make would violate the required relation";
        break;
      default:
        message = "Database operation failed";
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    // Prisma validation errors
    statusCode = 400;
    message = "Invalid data provided";
  } else if (err instanceof JsonWebTokenError) {
    // JWT errors
    statusCode = 401;
    message = "Invalid token";
  } else if (err instanceof TokenExpiredError) {
    // JWT expired errors
    statusCode = 401;
    message = "Token has expired";
  } else if (err.name === "ValidationError") {
    // Mongoose validation errors (if using MongoDB)
    statusCode = 400;
    message = "Validation failed";
  } else if (err.name === "CastError") {
    // Mongoose cast errors (if using MongoDB)
    statusCode = 400;
    message = "Invalid data format";
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "Something went wrong";
    errors = undefined;
  }

  const errorResponse = {
    success: false,
    message,
    ...(errors && { errors }),
    statusCode,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for undefined routes
 * @param req - Express request object
 * @param res - Express response object
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404,
  });
};

/**
 * Async error wrapper to catch async errors in route handlers
 * @param fn - Async function to wrap
 * @returns Wrapped function that catches errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
