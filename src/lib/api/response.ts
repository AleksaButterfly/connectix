import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    timestamp?: string;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T = any>(
  data: T,
  meta?: ApiSuccessResponse['meta'],
  status: number = 200
): NextResponse {
  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    },
    { status }
  );
}

export function errorResponse(
  error: string,
  message: string,
  status: number = 500,
  details?: any
): NextResponse {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error,
      message,
      ...(process.env.NODE_ENV === 'development' && details && { details })
    },
    { status }
  );
}