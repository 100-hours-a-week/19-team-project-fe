import { NextResponse } from 'next/server';

import { getMe } from '@/features/auth.server';

export async function GET() {
  const result = await getMe();
  return NextResponse.json(result);
}
