import { NextRequest, NextResponse } from 'next/server';
import { ErrorCodes } from '@/lib/api/errorCodes';

export interface ApiError {
  error: string;
  message: string;
  details?: any;
  statusCode?: number;
}

export class ApiErrorResponse extends Error {
  constructor(
    public error: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
  }
}

export type ErrorHandler<T = any> = (
  req: NextRequest,
  context: any,
  extra?: T
) => Promise<NextResponse>;

export function withErrorHandler<T = any>(handler: ErrorHandler<T>) {
  return async (req: NextRequest, context: any, extra?: T) => {
    try {
      return await handler(req, context, extra);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof ApiErrorResponse) {
        return NextResponse.json(
          {
            error: error.error,
            message: error.message,
            ...(process.env.NODE_ENV === 'development' && { details: error.details })
          },
          { status: error.statusCode }
        );
      }

      if (error instanceof Error) {
        return NextResponse.json(
          {
            error: ErrorCodes.INTERNAL_ERROR,
            message: 'An unexpected error occurred',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: ErrorCodes.INTERNAL_ERROR,
          message: 'An unexpected error occurred'
        },
        { status: 500 }
      );
    }
  };
}