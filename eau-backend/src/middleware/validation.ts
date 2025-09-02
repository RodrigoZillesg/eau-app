import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ERROR_MESSAGES } from '../config/constants';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      details: errors.array()
    });
  }
  
  next();
};