import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    timestamp?: string;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T = unknown>(
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
  details?: unknown
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