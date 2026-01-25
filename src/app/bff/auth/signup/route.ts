import { NextResponse } from 'next/server';

import type { ApiResponse } from '@/shared/api';
import { BusinessError } from '@/shared/api';
import { signup } from '@/features/auth.server';

type SignupResult = {
  userId: number;
};

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const result = await signup(payload);

    const response: ApiResponse<SignupResult> = {
      code: 'OK',
      message: '',
      data: result,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BusinessError) {
      const response: ApiResponse<unknown> = {
        code: error.code,
        message: error.message,
        data: error.data ?? null,
      };

      return NextResponse.json(response);
    }

    console.error('[Signup Error]', error);

    const response: ApiResponse<null> = {
      code: 'SIGNUP_FAILED',
      message: 'SIGNUP_FAILED',
      data: null,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
