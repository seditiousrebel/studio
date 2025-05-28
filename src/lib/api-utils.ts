// src/lib/api-utils.ts
import { NextResponse } from 'next/server';

interface ErrorResponse {
  error: {
    message: string;
    details?: any;
    code?: string;
    hint?: string;
  };
}

export function createErrorResponse(
  message: string,
  status: number,
  details?: any,
  code?: string,
  hint?: string
): NextResponse<ErrorResponse> {
  const errorPayload: ErrorResponse['error'] = { message };
  if (details) errorPayload.details = details;
  if (code) errorPayload.code = code;
  if (hint) errorPayload.hint = hint;
  
  return NextResponse.json({ error: errorPayload }, { status });
}
