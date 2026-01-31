import { NextResponse } from 'next/server';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

export async function GET() {
  try {
    // 최근 5분간 LCP p95 조회
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000);

    const result = await cloudwatch.send(
      new GetMetricStatisticsCommand({
        Namespace: 'ReFit/Frontend',
        MetricName: 'LCP',
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Average', 'Maximum'],
        Dimensions: [
          {
            Name: 'Environment',
            Value: process.env.NODE_ENV || 'production',
          },
        ],
      }),
    );

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Re-Fit Frontend',
      uptime: process.uptime(),
      metrics: {
        lcp: result.Datapoints?.[0]?.Average || null,
        cloudWatchConnected: true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        service: 'Re-Fit Frontend',
        uptime: process.uptime(),
        metrics: {
          cloudWatchConnected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 503 },
    );
  }
}
