import { NextResponse } from 'next/server';
import type { ApiResponse } from './constants';
import { normalizeLoginBffStatus } from './auth-errors';

/** 로그인 BFF — 예상 가능한 자격 증명 오류는 200 + success:false 로 내려줍니다. */
export function loginErrorResponse(backendStatus: number, data: ApiResponse<unknown>) {
  const status = normalizeLoginBffStatus(backendStatus, data.error?.code);
  return NextResponse.json(data, { status });
}
