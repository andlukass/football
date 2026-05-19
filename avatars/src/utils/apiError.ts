import type { NextFunction, Request, Response } from "express";

export type ApiErrorCode =
  | "INVALID_UPLOAD"
  | "INVALID_AVATAR_CONFIG"
  | "GEMINI_API_KEY_MISSING"
  | "GEMINI_REQUEST_FAILED"
  | "STRUCTURED_OUTPUT_INVALID"
  | "AVATAR_RENDER_FAILED"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
  }
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Unexpected server error."
    }
  });
}
