import { NextResponse } from 'next/server';
import { getMe } from '@/features/auth/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getMe();

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}
