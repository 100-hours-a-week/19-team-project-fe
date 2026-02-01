import { NextRequest, NextResponse } from 'next/server';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

/**
 * 테스트용 메트릭 생성 API
 * 실제 사용자 없이 가상의 메트릭 데이터를 CloudWatch에 전송
 *
 * 사용법:
 * POST /api/metrics/test?count=50&scenario=good
 *
 * 쿼리 파라미터:
 * - count: 생성할 메트릭 개수 (기본값: 20)
 * - scenario: good | bad | mixed (기본값: good)
 */
export async function POST(request: NextRequest) {
  // 프로덕션 환경에서는 비활성화
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_METRICS !== 'true') {
    return NextResponse.json({ error: 'Test metrics are disabled in production' }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const count = parseInt(searchParams.get('count') || '20');
    const scenario = searchParams.get('scenario') || 'good';

    const results = [];

    // 시나리오별 메트릭 값 정의
    const scenarios = {
      good: {
        LCP: { min: 1000, max: 2000 },
        FCP: { min: 500, max: 1500 },
        CLS: { min: 0.01, max: 0.08 },
        INP: { min: 50, max: 150 },
        TTFB: { min: 100, max: 300 },
      },
      bad: {
        LCP: { min: 3000, max: 5000 },
        FCP: { min: 2500, max: 4000 },
        CLS: { min: 0.15, max: 0.3 },
        INP: { min: 300, max: 500 },
        TTFB: { min: 800, max: 1500 },
      },
      mixed: {
        LCP: { min: 1500, max: 3500 },
        FCP: { min: 1000, max: 2500 },
        CLS: { min: 0.05, max: 0.15 },
        INP: { min: 100, max: 300 },
        TTFB: { min: 200, max: 800 },
      },
    };

    const config = scenarios[scenario as keyof typeof scenarios] || scenarios.good;

    // 메트릭 생성 및 전송
    for (let i = 0; i < count; i++) {
      const metrics = [
        {
          name: 'LCP',
          value: randomBetween(config.LCP.min, config.LCP.max),
          unit: 'Milliseconds',
        },
        {
          name: 'FCP',
          value: randomBetween(config.FCP.min, config.FCP.max),
          unit: 'Milliseconds',
        },
        {
          name: 'CLS',
          value: randomBetween(config.CLS.min, config.CLS.max),
          unit: 'None',
        },
        {
          name: 'INP',
          value: randomBetween(config.INP.min, config.INP.max),
          unit: 'Milliseconds',
        },
        {
          name: 'TTFB',
          value: randomBetween(config.TTFB.min, config.TTFB.max),
          unit: 'Milliseconds',
        },
      ];

      // CloudWatch에 배치 전송
      await cloudwatch.send(
        new PutMetricDataCommand({
          Namespace: 'ReFit/Frontend',
          MetricData: metrics.map((metric) => ({
            MetricName: metric.name,
            Value: metric.value,
            Unit: metric.unit as any,
            Timestamp: new Date(),
            Dimensions: [
              { Name: 'Environment', Value: 'production' },
              { Name: 'Page', Value: '/' },
              {
                Name: 'Rating',
                Value: getRating(metric.name, metric.value),
              },
            ],
          })),
        }),
      );

      results.push(metrics);

      // CloudWatch API 제한 방지 (초당 150 요청)
      if (i % 10 === 0) {
        await sleep(100);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${count}개의 테스트 메트릭 생성 완료`,
      scenario,
      sample: results[0],
      totalMetrics: count * 5, // 각 요청당 5개 메트릭
    });
  } catch (error) {
    console.error('Failed to generate test metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// 범위 내 랜덤 값 생성
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// 메트릭 등급 판정
function getRating(metricName: string, value: number): string {
  const thresholds: Record<string, { good: number; needsImprovement: number }> = {
    LCP: { good: 2500, needsImprovement: 4000 },
    FCP: { good: 1800, needsImprovement: 3000 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    INP: { good: 200, needsImprovement: 500 },
    TTFB: { good: 800, needsImprovement: 1800 },
  };

  const threshold = thresholds[metricName];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

// 비동기 sleep
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
