import { NextRequest, NextResponse } from 'next/server';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

export async function POST(request: NextRequest) {
  try {
    const metrics = await request.json();

    // CloudWatch 형식으로 변환
    const metricData = metrics.map((metric: any) => convertToCloudWatchMetric(metric)).flat();

    // CloudWatch에 배치 전송 (최대 20개)
    for (let i = 0; i < metricData.length; i += 20) {
      const batch = metricData.slice(i, i + 20);

      await cloudwatch.send(
        new PutMetricDataCommand({
          Namespace: 'ReFit/Frontend',
          MetricData: batch,
        }),
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send batch metrics:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

function convertToCloudWatchMetric(metric: any) {
  const { type, data } = metric;

  switch (type) {
    case 'fe_upload':
      return [
        {
          MetricName: 'UploadDuration',
          Value: data.totalDuration || data.duration,
          Unit: 'Milliseconds',
          Timestamp: new Date(data.timestamp),
          Dimensions: [
            { Name: 'FileType', Value: data.fileType },
            { Name: 'Status', Value: data.status },
          ],
        },
      ];

    case 'fe_render':
      return [
        {
          MetricName: 'RenderTime',
          Value: data.renderTime,
          Unit: 'Milliseconds',
          Timestamp: new Date(data.timestamp),
          Dimensions: [{ Name: 'Component', Value: data.component }],
        },
      ];

    case 'fe_chat_send_latency':
      return [
        {
          MetricName: 'ChatSendLatency',
          Value: data.latency,
          Unit: 'Milliseconds',
          Timestamp: new Date(data.timestamp),
          Dimensions: [{ Name: 'Type', Value: 'send' }],
        },
      ];

    case 'fe_chat_receive_latency':
      return [
        {
          MetricName: 'ChatReceiveLatency',
          Value: data.latency,
          Unit: 'Milliseconds',
          Timestamp: new Date(data.timestamp),
          Dimensions: [{ Name: 'Type', Value: 'receive' }],
        },
      ];

    case 'fe_chat_e2e_latency':
      return [
        {
          MetricName: 'ChatE2ELatency',
          Value: data.latency,
          Unit: 'Milliseconds',
          Timestamp: new Date(data.timestamp),
          Dimensions: [{ Name: 'Type', Value: 'e2e' }],
        },
      ];

    default:
      return [];
  }
}
