
// src/lib/error-handling.ts
export class AppError extends Error {
  public status: number;
  public code: string;
  public details?: any;

  constructor(message: string, status = 500, code = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = this.constructor.name; // Set the error name to the class name
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype); // Maintain prototype chain
  }

  static notFound(resource: string = 'Resource') {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static unauthorized(message: string = 'Unauthorized access') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static badRequest(message: string = 'Bad request', details?: any) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static validationError(message: string = 'Validation failed', details?: any) {
    return new AppError(message, 422, 'VALIDATION_ERROR', details);
  }

  static conflict(message: string = 'Conflict with current state of the resource') {
    return new AppError(message, 409, 'CONFLICT_ERROR');
  }
}
