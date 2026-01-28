import { NextRequest, NextResponse } from 'next/server';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();

    // CloudWatch에 메트릭 전송
    await cloudwatch.send(
      new PutMetricDataCommand({
        Namespace: 'ReFit/Frontend',
        MetricData: [
          {
            MetricName: metric.name, // LCP, FCP, CLS, FID, TTFB
            Value: metric.value,
            Unit: metric.name === 'CLS' ? 'None' : 'Milliseconds',
            Timestamp: new Date(),
            Dimensions: [
              {
                Name: 'Environment',
                Value: process.env.NODE_ENV || 'production',
              },
              { Name: 'Page', Value: metric.pathname },
              { Name: 'Rating', Value: metric.rating },
            ],
          },
        ],
      }),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send metrics to CloudWatch:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
