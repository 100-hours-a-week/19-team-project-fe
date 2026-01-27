# SLI/SLO 검증을 CD 워크플로우에 통합하는 계획 (CloudWatch)

## 개요

현재 CD 워크플로우에 SLI/SLO 검증 단계를 추가하여, 배포된 애플리케이션이 성능 목표를 충족하는지 자동으로 확인합니다.

**사용자 요구사항:**
- SLO 검증 실패 시: 경고만 표시하고 배포 계속 (1-2주 후 hard-fail로 전환)
- 메트릭 수집: 모든 사용자 100% 적용
- 검증 방식: 실제 사용자 메트릭 조회 (5-10분 대기)
- **메트릭 저장소: AWS CloudWatch** (Prometheus 대신)

**현재 상태:**
- 기본적인 health check만 존재 (`/api/health`)
- 메트릭 수집 인프라 없음
- AWS 환경에서 운영 중 (EC2 기반)
- FSD 아키텍처 사용 (`src/shared/`, `src/features/`, `src/app/`)

---

## CloudWatch 사용 이유

### ✅ 선택 근거

1. **AWS 생태계 완전 통합**
   - EC2 인스턴스 메트릭과 함께 관리
   - 기존 AWS IAM 권한 재사용
   - CloudWatch Alarms로 즉시 알림 설정

2. **비용 효율성**
   - Prometheus 전용 서버 불필요 ($0 vs $25/월)
   - 커스텀 메트릭: ~$5-8/월 (예상)
   - 완전 관리형으로 운영 부담 없음

3. **단순한 인프라**
   - Pushgateway, Prometheus, Grafana 설치 불필요
   - AWS SDK만으로 메트릭 전송
   - 별도 서버 관리 없음

### 📊 비용 비교 (월 기준, DAU 5,000-8,000)

| 항목 | Prometheus | CloudWatch |
|------|-----------|-----------|
| 인프라 비용 | $0-25/월 | $0/월 |
| 메트릭 수집 | $0/월 | $5-8/월 |
| 대시보드 | $0/월 (Grafana) | $3/월 |
| **총계** | **$0-25/월** | **$8-11/월** |

→ **CloudWatch 승리** (인프라 관리 부담 없음 + 저렴)

---

## 구현 단계

### 1단계: 메트릭 수집 인프라 구축 (코드 레벨)

#### 1.1 패키지 설치

```bash
pnpm add web-vitals @aws-sdk/client-cloudwatch
```

**주요 패키지:**
- `web-vitals`: Core Web Vitals 측정 (LCP, FCP, CLS, INP, TTFB)
- `@aws-sdk/client-cloudwatch`: CloudWatch 메트릭 전송

#### 1.2 메트릭 수집 모듈 생성 (FSD 패턴)

**새로 생성할 파일:**

**`src/shared/metrics/index.ts`** - Public API
```typescript
export { initWebVitals } from './web-vitals';
export { sendMetrics } from './collector';
export type { MetricType, MetricData } from './types';
```

**`src/shared/metrics/types.ts`** - TypeScript 인터페이스
```typescript
export type MetricType =
  | 'fe_upload'
  | 'fe_render'
  | 'fe_field_accuracy'
  | 'fe_chat_send_latency'
  | 'fe_chat_receive_latency'
  | 'fe_chat_e2e_latency'
  | 'fe_mentor_list_render'
  | 'web_vitals';

export interface MetricData {
  [key: string]: any;
}

export interface WebVitalsMetricPayload {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  pathname: string;
}

// CloudWatch Dimension 타입
export interface MetricDimension {
  Name: string;
  Value: string;
}
```

**`src/shared/metrics/collector.ts`** - 배치 처리 및 전송
```typescript
// 메트릭 버퍼링 (5초마다 또는 20개 쌓이면 전송)
// Beacon API로 비차단 전송
// 페이지 이탈 시 남은 메트릭 전송 (visibilitychange, pagehide)

let metricBuffer: Array<{ type: MetricType; data: MetricData }> = [];
let flushTimeout: NodeJS.Timeout | null = null;

const FLUSH_INTERVAL = 5000; // 5초
const MAX_BUFFER_SIZE = 20;

export const sendMetrics = (type: MetricType, data: MetricData) => {
  metricBuffer.push({
    type,
    data: {
      ...data,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: data.timestamp || Date.now(),
    },
  });

  // 버퍼가 가득 차면 즉시 전송
  if (metricBuffer.length >= MAX_BUFFER_SIZE) {
    flushMetrics();
    return;
  }

  // 타이머 설정
  if (!flushTimeout) {
    flushTimeout = setTimeout(flushMetrics, FLUSH_INTERVAL);
  }
};

const flushMetrics = () => {
  if (metricBuffer.length === 0) return;

  const metricsToSend = [...metricBuffer];
  metricBuffer = [];

  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  // Beacon API로 전송
  const blob = new Blob([JSON.stringify(metricsToSend)], {
    type: 'application/json',
  });

  navigator.sendBeacon('/api/metrics/batch', blob);
};

// 페이지 이탈 시 남은 메트릭 전송
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushMetrics();
    }
  });

  window.addEventListener('pagehide', flushMetrics);
}
```

**`src/shared/metrics/web-vitals.ts`** - Core Web Vitals 수집
```typescript
import { onLCP, onFCP, onCLS, onINP, onTTFB, Metric } from 'web-vitals';

const sendToAnalytics = async (metric: Metric) => {
  const payload = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType || 'unknown',
    pathname: window.location.pathname,
  };

  // Beacon API로 전송
  const blob = new Blob([JSON.stringify(payload)], {
    type: 'application/json'
  });
  navigator.sendBeacon('/api/metrics/web-vitals', blob);
};

export const initWebVitals = () => {
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onTTFB(sendToAnalytics);
};
```

#### 1.3 API 엔드포인트 생성 (CloudWatch 전송)

**새로 생성할 파일:**

**`src/app/api/metrics/web-vitals/route.ts`** - Core Web Vitals → CloudWatch
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({
  region: process.env.AWS_REGION || 'ap-northeast-2'
});

export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();

    // CloudWatch에 메트릭 전송
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'ReFit/Frontend',
      MetricData: [{
        MetricName: metric.name, // LCP, FCP, CLS, INP, TTFB
        Value: metric.value,
        Unit: metric.name === 'CLS' ? 'None' : 'Milliseconds',
        Timestamp: new Date(),
        Dimensions: [
          { Name: 'Environment', Value: process.env.NODE_ENV || 'production' },
          { Name: 'Page', Value: metric.pathname },
          { Name: 'Rating', Value: metric.rating }
        ]
      }]
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send metrics to CloudWatch:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
```

**`src/app/api/metrics/batch/route.ts`** - 커스텀 메트릭 → CloudWatch
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({
  region: process.env.AWS_REGION || 'ap-northeast-2'
});

export async function POST(request: NextRequest) {
  try {
    const metrics = await request.json();

    // CloudWatch 형식으로 변환
    const metricData = metrics.map((metric: any) =>
      convertToCloudWatchMetric(metric)
    ).flat();

    // CloudWatch에 배치 전송 (최대 20개)
    for (let i = 0; i < metricData.length; i += 20) {
      const batch = metricData.slice(i, i + 20);

      await cloudwatch.send(new PutMetricDataCommand({
        Namespace: 'ReFit/Frontend',
        MetricData: batch
      }));
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
      return [{
        MetricName: 'UploadDuration',
        Value: data.totalDuration || data.duration,
        Unit: 'Milliseconds',
        Timestamp: new Date(data.timestamp),
        Dimensions: [
          { Name: 'FileType', Value: data.fileType },
          { Name: 'Status', Value: data.status }
        ]
      }];

    case 'fe_render':
      return [{
        MetricName: 'RenderTime',
        Value: data.renderTime,
        Unit: 'Milliseconds',
        Timestamp: new Date(data.timestamp),
        Dimensions: [
          { Name: 'Component', Value: data.component }
        ]
      }];

    case 'fe_chat_send_latency':
      return [{
        MetricName: 'ChatSendLatency',
        Value: data.latency,
        Unit: 'Milliseconds',
        Timestamp: new Date(data.timestamp),
        Dimensions: [
          { Name: 'Type', Value: 'send' }
        ]
      }];

    case 'fe_chat_receive_latency':
      return [{
        MetricName: 'ChatReceiveLatency',
        Value: data.latency,
        Unit: 'Milliseconds',
        Timestamp: new Date(data.timestamp),
        Dimensions: [
          { Name: 'Type', Value: 'receive' }
        ]
      }];

    case 'fe_chat_e2e_latency':
      return [{
        MetricName: 'ChatE2ELatency',
        Value: data.latency,
        Unit: 'Milliseconds',
        Timestamp: new Date(data.timestamp),
        Dimensions: [
          { Name: 'Type', Value: 'e2e' }
        ]
      }];

    default:
      return [];
  }
}
```

**`src/app/api/metrics/health-extended/route.ts`** - 확장된 헬스체크
```typescript
import { NextResponse } from 'next/server';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({
  region: process.env.AWS_REGION || 'ap-northeast-2'
});

export async function GET() {
  try {
    // 최근 5분간 LCP p95 조회
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000);

    const result = await cloudwatch.send(new GetMetricStatisticsCommand({
      Namespace: 'ReFit/Frontend',
      MetricName: 'LCP',
      StartTime: startTime,
      EndTime: endTime,
      Period: 300,
      Statistics: ['Average', 'Maximum'],
      Dimensions: [
        { Name: 'Environment', Value: process.env.NODE_ENV || 'production' }
      ]
    }));

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Re-Fit Frontend',
      uptime: process.uptime(),
      metrics: {
        lcp: result.Datapoints?.[0]?.Average || null,
        cloudWatchConnected: true
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      service: 'Re-Fit Frontend',
      uptime: process.uptime(),
      metrics: {
        cloudWatchConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 503 });
  }
}
```

#### 1.4 루트 레이아웃에 통합

**수정할 파일: `src/app/layout.tsx`**
```typescript
'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/shared/metrics';

export default function RootLayout({ children }) {
  useEffect(() => {
    // 프로덕션 또는 명시적 활성화 시에만 실행
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_METRICS_ENABLED === 'true'
    ) {
      initWebVitals();
    }
  }, []);

  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

---

## 구현 우선순위

### 필수 (Phase 1 - Week 1)
1. ✅ AWS IAM 권한 설정
2. ✅ 메트릭 수집 모듈 (`src/shared/metrics/`)
3. ✅ API 엔드포인트 (`src/app/api/metrics/`)
4. ✅ Core Web Vitals 통합 (`layout.tsx`)
5. ✅ SLO 검증 스크립트 (`scripts/verify-slo-cloudwatch.sh`)
6. ✅ CD 워크플로우 통합 (`.github/workflows/cd.yml`)

### 선택 (Phase 2 - Week 2-3)
7. 🔲 커스텀 메트릭 후크 (업로드, 렌더링)
8. 🔲 채팅 메트릭 통합 (`src/shared/ws/manager.ts`)
9. 🔲 CloudWatch 대시보드 구성
10. 🔲 CloudWatch Alarms 설정

---

## 환경 변수

**`.env.production` (EC2 서버):**
```env
# CloudWatch 설정
AWS_REGION=ap-northeast-2

# IAM 역할 사용 시 불필요 (권장)
# AWS_ACCESS_KEY_ID=<ec2-instance-role>
# AWS_SECRET_ACCESS_KEY=<ec2-instance-role>
```

**`.env.local` (개발 환경):**
```env
# 메트릭 활성화
NEXT_PUBLIC_METRICS_ENABLED=true

# AWS 자격 증명 (로컬 테스트용)
AWS_ACCESS_KEY_ID=<your-dev-key>
AWS_SECRET_ACCESS_KEY=<your-dev-secret>
AWS_REGION=ap-northeast-2
```

**GitHub Secrets:**
- `AWS_ACCESS_KEY_ID`: GitHub Actions용 (이미 있음)
- `AWS_SECRET_ACCESS_KEY`: GitHub Actions용 (이미 있음)
- `CLOUDWATCH_DASHBOARD_URL`: CloudWatch 대시보드 URL (선택)

---

## 참고 문서

- [SLI/SLO 정의서](SLI-SLO.md) - 모든 메트릭 및 임계값 정의
- [AWS CloudWatch 공식 문서](https://docs.aws.amazon.com/cloudwatch/)
- [web-vitals 라이브러리](https://github.com/GoogleChrome/web-vitals)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/)
