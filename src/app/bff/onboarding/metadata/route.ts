import { NextResponse } from 'next/server';

import { BusinessError, type ApiResponse, buildApiUrl } from '@/shared/api';
import type { CareerLevel, Job, Skill } from '@/entities/onboarding';

const JOBS_PATH = '/api/v1/jobs';
const CAREER_LEVELS_PATH = '/api/v1/career-levels';
const SKILLS_PATH = '/api/v1/skills';

const SUCCESS_CODES = new Set(['OK', 'SUCCESS']);

async function fetchApiData<T>(path: string): Promise<T> {
  const res = await fetch(buildApiUrl(path));
  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok) {
    if (body && typeof body.code === 'string') {
      throw new BusinessError(body.code, body.message ?? 'error', body.data ?? null);
    }
    throw new BusinessError('ONBOARDING_METADATA_FAILED', 'ONBOARDING_METADATA_FAILED');
  }

  if (!body || typeof body.code !== 'string') {
    throw new BusinessError('ONBOARDING_METADATA_FAILED', 'ONBOARDING_METADATA_FAILED');
  }

  if (!SUCCESS_CODES.has(body.code)) {
    throw new BusinessError(body.code, body.message ?? 'error', body.data ?? null);
  }

  return body.data;
}

export async function GET() {
  try {
    const [jobs, careerLevels, skills] = await Promise.all([
      fetchApiData<{ jobs: Job[] }>(JOBS_PATH),
      fetchApiData<{ career_levels: CareerLevel[] }>(CAREER_LEVELS_PATH),
      fetchApiData<{ skills: Skill[] }>(SKILLS_PATH),
    ]);

    const response: ApiResponse<{
      jobs: Job[];
      career_levels: CareerLevel[];
      skills: Skill[];
    }> = {
      code: 'OK',
      message: '',
      data: {
        jobs: jobs.jobs,
        career_levels: careerLevels.career_levels,
        skills: skills.skills,
      },
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

    console.error('[Onboarding Metadata Error]', error);
    const response: ApiResponse<null> = {
      code: 'ONBOARDING_METADATA_FAILED',
      message: 'ONBOARDING_METADATA_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
