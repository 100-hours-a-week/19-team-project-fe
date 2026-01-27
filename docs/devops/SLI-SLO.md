# SLI/SLO (FE)

<aside>
💡

**SLI(Service Level Indicator)**: 서비스 수준을 판단하기 위한 지표. 사용자가 서비스에서 느끼는 만족도를 정략적으로 나타낼 수 있는 수치

**주요 지표**

1. 가용성: 요청이 성공적으로 처리된 비율
2. 지연 시간: 요청이 처리되는데 걸리는 시간
3. 오류율: 실패한 요청의 비율
4. 처리량: 초당 처리되는 요청의 수

---

**SLO(Service Level Objective)**: SLI에 대한 목표 값 또는 범위

설정 방법:

- 사용자 기대치 반영: 사용자가 느리다고 느끼지 않을 정도의 합리적인 지연시간 설정
- 100%는 지양: 100%의 신뢰성은 현실적으로 불가능하며, 비용이 기하급수적으로 증가함. 보통 99.9%처럼 소수점 단위로 설정함.
</aside>

# Re-Fit Frontend SLI/SLO 정의서

| 항목            | 내용               |
| --------------- | ------------------ |
| **문서 버전**   | v1.0               |
| **최종 수정일** | 2026-01-26         |
| **작성자**      | Re-Fit 인프라팀    |
| **대상**        | Frontend (Next.js) |
| **문서 상태**   | Draft              |

---

## 1. 개요

### 1.1 목적

본 문서는 Re-Fit 서비스의 Frontend(Next.js) 파트에서 측정하고 관리해야 할 SLI/SLO를 정의한다.

### 1.2 측정 책임 범위

| 영역            | 설명                               |
| --------------- | ---------------------------------- |
| 클라이언트 성능 | Core Web Vitals, 페이지 로드 성능  |
| 사용자 인터랙션 | 업로드, 폼 입력, 버튼 클릭 응답    |
| 렌더링 성능     | 컴포넌트 렌더링, 리스트 렌더링     |
| 실시간 통신     | WebSocket 메시지 전송/수신 지연    |
| 데이터 품질     | 자동 채우기 정확도 (사용자 수정률) |

---

## 2. FE 담당 SLI 전체 목록

| 기능          | SLI                            | 측정 방법           | 중요도 |
| ------------- | ------------------------------ | ------------------- | ------ |
| 페이지 로드   | LCP (Largest Contentful Paint) | web-vitals          | High   |
| 페이지 로드   | FCP (First Contentful Paint)   | web-vitals          | High   |
| 페이지 로드   | CLS (Cumulative Layout Shift)  | web-vitals          | High   |
| 페이지 로드   | FID (First Input Delay)        | web-vitals          | Medium |
| 페이지 로드   | TTFB (Time To First Byte)      | web-vitals          | Medium |
| 이력서 업로드 | 클라이언트 업로드 시간         | Performance API     | High   |
| 이력서 업로드 | 파일 사전 검증 시간            | Performance API     | Low    |
| 이력서 파싱   | 폼 렌더링 시간                 | requestIdleCallback | High   |
| 이력서 파싱   | 사용자 수정률                  | 제출 diff 비교      | High   |
| 현직자 목록   | 검색 결과 렌더링 시간          | Performance API     | Medium |
| 실시간 채팅   | 메시지 전송 지연               | 타임스탬프          | High   |
| 실시간 채팅   | 메시지 수신 지연               | 타임스탬프          | High   |
| 피드백 제출   | E2E 제출 지연                  | 클라이언트 측정     | Medium |

---

## 3. SLI 상세 정의

### 3.1 Core Web Vitals

### 3.1.1 LCP (Largest Contentful Paint)

| 항목          | 내용                                            |
| ------------- | ----------------------------------------------- |
| **정의**      | 뷰포트 내 가장 큰 콘텐츠 요소가 렌더링되는 시간 |
| **측정 대상** | 모든 페이지                                     |
| **Good 기준** | ≤ 2.5s                                          |
| **Poor 기준** | > 4.0s                                          |

### 3.1.2 FCP (First Contentful Paint)

| 항목          | 내용                                                |
| ------------- | --------------------------------------------------- |
| **정의**      | 첫 번째 콘텐츠(텍스트, 이미지 등)가 렌더링되는 시간 |
| **측정 대상** | 모든 페이지                                         |
| **Good 기준** | ≤ 1.8s                                              |
| **Poor 기준** | > 3.0s                                              |

### 3.1.3 CLS (Cumulative Layout Shift)

| 항목          | 내용                                                          |
| ------------- | ------------------------------------------------------------- |
| **정의**      | 페이지 로드 중 발생하는 예기치 않은 레이아웃 이동의 누적 점수 |
| **측정 대상** | 모든 페이지                                                   |
| **Good 기준** | ≤ 0.1                                                         |
| **Poor 기준** | > 0.25                                                        |

### 3.1.4 FID (First Input Delay)

| 항목          | 내용                                                  |
| ------------- | ----------------------------------------------------- |
| **정의**      | 사용자의 첫 인터랙션과 브라우저 응답 사이의 지연 시간 |
| **측정 대상** | 모든 페이지                                           |
| **Good 기준** | ≤ 100ms                                               |
| **Poor 기준** | > 300ms                                               |

### 3.1.5 TTFB (Time To First Byte)

| 항목          | 내용                                    |
| ------------- | --------------------------------------- |
| **정의**      | 요청 시작부터 첫 바이트 수신까지의 시간 |
| **측정 대상** | 모든 페이지                             |
| **Good 기준** | ≤ 800ms                                 |
| **Poor 기준** | > 1800ms                                |

---

### 3.2 이력서 업로드

### 3.2.1 클라이언트 업로드 시간

| 항목          | 내용                                                      |
| ------------- | --------------------------------------------------------- |
| **정의**      | 파일 선택 완료 후 업로드 시작 ~ 서버 응답 수신까지의 시간 |
| **측정 구간** | `fetch() 시작` → `response 수신`                          |
| **포함 요소** | 네트워크 전송 시간, 서버 처리 대기 시간                   |
| **제외 요소** | 파일 선택 시간, 클라이언트 검증 시간                      |

### 3.2.2 파일 사전 검증 시간

| 항목          | 내용                                               |
| ------------- | -------------------------------------------------- |
| **정의**      | 클라이언트에서 파일 타입/용량 검증에 소요되는 시간 |
| **측정 구간** | `검증 시작` → `검증 완료`                          |
| **검증 항목** | 파일 확장자, MIME 타입, 파일 크기 (≤10MB)          |

---

### 3.3 이력서 파싱

### 3.3.1 폼 렌더링 시간

| 항목          | 내용                                                          |
| ------------- | ------------------------------------------------------------- |
| **정의**      | 파싱 결과 데이터 수신 후 폼 UI가 완전히 렌더링되기까지의 시간 |
| **측정 구간** | `API 응답 수신` → `렌더링 완료 (idle callback)`               |
| **포함 요소** | React 렌더링, DOM 업데이트, 스타일 적용                       |

### 3.3.2 사용자 수정률

| 항목          | 내용                                                |
| ------------- | --------------------------------------------------- |
| **정의**      | 자동 채워진 필드 중 사용자가 수정한 필드의 비율     |
| **계산식**    | `수정된 필드 수 / 자동 채워진 필드 수 × 100%`       |
| **측정 시점** | 폼 제출 시 (자동 채우기 데이터 vs 제출 데이터 비교) |
| **의미**      | 낮을수록 AI 파싱 정확도가 높음                      |

**필드별 분류**:

| 카테고리      | 필드                     |
| ------------- | ------------------------ |
| 필수 정보     | 이름, 이메일, 연락처     |
| 학력          | 학력 분류 및 졸업 여부   |
| 경력          | 회사명, 직책, 직무, 기간 |
| 프로젝트      | 프로젝트명, 기간, 설명   |
| 대외활동/기타 | 언어, 프레임워크, 도구   |
| 수상내역      | -                        |
| 자격증        | -                        |

---

### 3.4 현직자 목록 조회

### 3.4.1 검색 결과 렌더링 시간

| 항목          | 내용                                                   |
| ------------- | ------------------------------------------------------ |
| **정의**      | API 응답 수신 후 리스트가 화면에 렌더링되기까지의 시간 |
| **측정 구간** | `API 응답 수신` → `리스트 렌더링 완료`                 |
| **고려 사항** | 가상화(Virtualization) 적용 여부에 따라 차이           |

---

### 3.5 실시간 채팅

### 3.5.1 메시지 전송 지연

| 항목          | 내용                                      |
| ------------- | ----------------------------------------- |
| **정의**      | 전송 버튼 클릭 ~ 서버 ACK 수신까지의 시간 |
| **측정 구간** | `send 버튼 클릭` → `서버 ACK 수신`        |
| **포함 요소** | WebSocket 전송, 서버 처리, ACK 응답       |

### 3.5.2 메시지 수신 지연

| 항목          | 내용                                                     |
| ------------- | -------------------------------------------------------- |
| **정의**      | 서버에서 메시지 발송 ~ 클라이언트 화면 렌더링까지의 시간 |
| **측정 구간** | `서버 타임스탬프` → `클라이언트 렌더링 완료`             |
| **계산 방법** | `클라이언트 현재 시간 - 서버 발송 타임스탬프`            |
| **주의 사항** | 클라이언트-서버 시간 동기화 필요 (NTP)                   |

### 3.5.3 E2E 메시지 전달 지연

| 항목          | 내용                                                |
| ------------- | --------------------------------------------------- |
| **정의**      | 발신자 전송 ~ 수신자 화면 렌더링까지의 총 시간      |
| **측정 방법** | 발신자 타임스탬프를 메시지에 포함하여 수신자가 계산 |

---

### 3.6 피드백 제출

### 3.6.1 E2E 제출 지연

| 항목          | 내용                                          |
| ------------- | --------------------------------------------- |
| **정의**      | 제출 버튼 클릭 ~ 완료 응답 수신까지의 총 시간 |
| **측정 구간** | `submit 버튼 클릭` → `success 응답 수신`      |

---

## 4. SLO 설정

### 4.1 평시 SLO (DAU 5,000 ~ 8,000)

| 기능          | SLI                      | p50     | p95     | p99     |
| ------------- | ------------------------ | ------- | ------- | ------- |
| 페이지 로드   | LCP                      | < 1.5s  | < 2.5s  | < 4s    |
| 페이지 로드   | FCP                      | < 1s    | < 1.8s  | < 3s    |
| 페이지 로드   | CLS                      | < 0.05  | < 0.1   | < 0.15  |
| 페이지 로드   | FID                      | < 50ms  | < 100ms | < 200ms |
| 이력서 업로드 | 클라이언트 업로드 (≤5MB) | < 500ms | < 1s    | < 2s    |
| 이력서 파싱   | 폼 렌더링                | < 200ms | < 500ms | < 1s    |
| 현직자 목록   | 렌더링 시간              | < 100ms | < 300ms | < 500ms |
| 실시간 채팅   | 메시지 전송              | < 50ms  | < 100ms | < 200ms |
| 실시간 채팅   | 메시지 수신              | < 100ms | < 200ms | < 300ms |
| 피드백 제출   | E2E 지연                 | < 500ms | < 1.5s  | < 3s    |

| 기능        | SLI           | SLO 목표 |
| ----------- | ------------- | -------- |
| 이력서 파싱 | 사용자 수정률 | < 20%    |
| 페이지 로드 | CLS           | < 0.1    |

### 4.2 피크 시즌 SLO (DAU 30,000 ~ 50,000)

| 기능          | SLI               | 평시 p95 | 피크 p95 | 완화 배수 |
| ------------- | ----------------- | -------- | -------- | --------- |
| 페이지 로드   | LCP               | < 2.5s   | < 4s     | 1.6x      |
| 페이지 로드   | FCP               | < 1.8s   | < 3s     | 1.7x      |
| 이력서 업로드 | 클라이언트 업로드 | < 1s     | < 2s     | 2.0x      |
| 이력서 파싱   | 폼 렌더링         | < 500ms  | < 1s     | 2.0x      |
| 현직자 목록   | 렌더링 시간       | < 300ms  | < 500ms  | 1.7x      |
| 실시간 채팅   | 메시지 전송       | < 100ms  | < 200ms  | 2.0x      |
| 실시간 채팅   | 메시지 수신       | < 200ms  | < 300ms  | 1.5x      |

| 기능        | SLI           | 피크 SLO     |
| ----------- | ------------- | ------------ |
| 이력서 파싱 | 사용자 수정률 | < 20% (유지) |
| 페이지 로드 | CLS           | < 0.1 (유지) |

---

## 5. 측정 구현 가이드

### 5.1 Core Web Vitals 측정

### 5.1.1 패키지 설치

```bash
npm install web-vitals

```

### 5.1.2 메트릭 수집 모듈

```tsx
// lib/webVitals.ts
import { onLCP, onFCP, onCLS, onFID, onTTFB, Metric } from 'web-vitals';

interface MetricPayload {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  pathname: string;
}

const sendToAnalytics = async (metric: Metric) => {
  const payload: MetricPayload = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType || 'unknown',
    pathname: window.location.pathname,
  };

  // Beacon API로 전송 (페이지 이탈 시에도 전송 보장)
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  navigator.sendBeacon('/api/metrics/web-vitals', blob);
};

export const initWebVitals = () => {
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onTTFB(sendToAnalytics);
};
```

### 5.1.3 App 통합

```tsx
// app/layout.tsx (App Router)
'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/webVitals';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initWebVitals();
  }, []);

  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

---

### 5.2 이력서 업로드 측정

```tsx
// hooks/useResumeUpload.ts
import { useState, useCallback } from 'react';
import { sendMetrics } from '@/lib/metrics';

interface UploadMetrics {
  fileSize: number;
  fileType: string;
  validationTime: number;
  uploadDuration: number;
  totalDuration: number;
  status: 'success' | 'error';
  errorType?: string;
}

export const useResumeUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadResume = useCallback(async (file: File) => {
    const metrics: Partial<UploadMetrics> = {
      fileSize: file.size,
      fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown',
    };

    const totalStart = performance.now();

    // 1. 클라이언트 검증
    const validationStart = performance.now();
    const validation = validateFile(file);
    metrics.validationTime = performance.now() - validationStart;

    if (!validation.valid) {
      sendMetrics('fe_upload', {
        ...metrics,
        status: 'error',
        errorType: 'validation_failed',
        totalDuration: performance.now() - totalStart,
      });
      throw new Error(validation.message);
    }

    // 2. 업로드
    setIsUploading(true);
    const uploadStart = performance.now();

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      metrics.uploadDuration = performance.now() - uploadStart;
      metrics.totalDuration = performance.now() - totalStart;
      metrics.status = response.ok ? 'success' : 'error';

      if (!response.ok) {
        metrics.errorType = `http_${response.status}`;
        throw new Error(`Upload failed: ${response.status}`);
      }

      sendMetrics('fe_upload', metrics as UploadMetrics);
      return await response.json();
    } catch (error) {
      metrics.uploadDuration = performance.now() - uploadStart;
      metrics.totalDuration = performance.now() - totalStart;
      metrics.status = 'error';
      metrics.errorType = error instanceof Error ? error.name : 'unknown';

      sendMetrics('fe_upload', metrics as UploadMetrics);
      throw error;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, []);

  return { uploadResume, isUploading, progress };
};

const validateFile = (file: File) => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'hwp'];

  if (file.size > MAX_SIZE) {
    return { valid: false, message: '파일 크기는 10MB 이하여야 합니다.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, message: '지원하지 않는 파일 형식입니다.' };
  }

  return { valid: true };
};
```

---

### 5.3 폼 렌더링 시간 측정

```tsx
// hooks/useRenderMetrics.ts
import { useEffect, useRef } from 'react';
import { sendMetrics } from '@/lib/metrics';

export const useRenderMetrics = (componentName: string, isDataReady: boolean) => {
  const startTimeRef = useRef<number | null>(null);
  const measuredRef = useRef(false);

  // 데이터 준비 시점 기록
  useEffect(() => {
    if (isDataReady && !startTimeRef.current) {
      startTimeRef.current = performance.now();
    }
  }, [isDataReady]);

  // 렌더링 완료 측정
  useEffect(() => {
    if (isDataReady && startTimeRef.current && !measuredRef.current) {
      // requestIdleCallback으로 렌더링 완료 후 측정
      const measure = () => {
        const renderTime = performance.now() - startTimeRef.current!;

        sendMetrics('fe_render', {
          component: componentName,
          renderTime,
          timestamp: Date.now(),
        });

        measuredRef.current = true;
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(measure, { timeout: 1000 });
      } else {
        setTimeout(measure, 0);
      }
    }
  }, [isDataReady, componentName]);
};

// 사용 예시: ResumeForm 컴포넌트
export const ResumeForm = ({ parsedData }: { parsedData: ParsedResume | null }) => {
  useRenderMetrics('ResumeForm', !!parsedData);

  if (!parsedData) return <Loading />;

  return <form>{/* 폼 필드들 */}</form>;
};
```

---

### 5.4 사용자 수정률 측정

```tsx
// hooks/useFieldAccuracy.ts
import { useCallback, useRef } from 'react';
import { sendMetrics } from '@/lib/metrics';

interface FieldChange {
  field: string;
  category: 'critical' | 'education' | 'experience' | 'skills' | 'other';
  wasAutoFilled: boolean;
  wasModified: boolean;
}

const FIELD_CATEGORIES: Record<string, FieldChange['category']> = {
  name: 'critical',
  email: 'critical',
  phone: 'critical',
  school: 'education',
  major: 'education',
  graduationYear: 'education',
  company: 'experience',
  position: 'experience',
  period: 'experience',
  skills: 'skills',
  introduction: 'other',
  portfolioUrl: 'other',
};

export const useFieldAccuracy = <T extends Record<string, any>>() => {
  const originalDataRef = useRef<T | null>(null);

  // 자동 채우기 데이터 저장
  const setAutoFilledData = useCallback((data: T) => {
    originalDataRef.current = JSON.parse(JSON.stringify(data));
  }, []);

  // 제출 시 수정률 계산
  const measureAccuracy = useCallback((submittedData: T) => {
    const original = originalDataRef.current;
    if (!original) return;

    const changes: FieldChange[] = [];
    let autoFilledCount = 0;
    let modifiedCount = 0;

    const categoryStats: Record<string, { filled: number; modified: number }> = {};

    Object.keys(FIELD_CATEGORIES).forEach((field) => {
      const category = FIELD_CATEGORIES[field];
      const originalValue = original[field];
      const submittedValue = submittedData[field];

      const wasAutoFilled =
        originalValue !== undefined && originalValue !== null && originalValue !== '';
      const wasModified = JSON.stringify(originalValue) !== JSON.stringify(submittedValue);

      if (wasAutoFilled) {
        autoFilledCount++;
        if (wasModified) modifiedCount++;
      }

      // 카테고리별 통계
      if (!categoryStats[category]) {
        categoryStats[category] = { filled: 0, modified: 0 };
      }
      if (wasAutoFilled) {
        categoryStats[category].filled++;
        if (wasModified) categoryStats[category].modified++;
      }

      changes.push({ field, category, wasAutoFilled, wasModified });
    });

    const overallModificationRate =
      autoFilledCount > 0 ? (modifiedCount / autoFilledCount) * 100 : 0;

    // 메트릭 전송
    sendMetrics('fe_field_accuracy', {
      totalFields: Object.keys(FIELD_CATEGORIES).length,
      autoFilledFields: autoFilledCount,
      modifiedFields: modifiedCount,
      modificationRate: overallModificationRate,
      categoryStats,
      changes,
      timestamp: Date.now(),
    });

    return {
      modificationRate: overallModificationRate,
      categoryStats,
    };
  }, []);

  return { setAutoFilledData, measureAccuracy };
};
```

---

### 5.5 실시간 채팅 지연 측정

```tsx
// hooks/useChatMetrics.ts
import { useCallback, useRef } from 'react';
import { sendMetrics } from '@/lib/metrics';

interface PendingMessage {
  messageId: string;
  sendTime: number;
}

export const useChatMetrics = () => {
  const pendingMessages = useRef<Map<string, PendingMessage>>(new Map());

  // 메시지 전송 시작
  const onSendStart = useCallback((messageId: string) => {
    pendingMessages.current.set(messageId, {
      messageId,
      sendTime: performance.now(),
    });
  }, []);

  // 서버 ACK 수신 (전송 지연)
  const onServerAck = useCallback((messageId: string) => {
    const pending = pendingMessages.current.get(messageId);
    if (!pending) return;

    const sendLatency = performance.now() - pending.sendTime;

    sendMetrics('fe_chat_send_latency', {
      messageId,
      latency: sendLatency,
      timestamp: Date.now(),
    });
  }, []);

  // 상대방 수신 확인 (E2E 지연)
  const onDeliveryConfirm = useCallback((messageId: string) => {
    const pending = pendingMessages.current.get(messageId);
    if (!pending) return;

    const e2eLatency = performance.now() - pending.sendTime;

    sendMetrics('fe_chat_e2e_latency', {
      messageId,
      latency: e2eLatency,
      timestamp: Date.now(),
    });

    pendingMessages.current.delete(messageId);
  }, []);

  // 메시지 수신 (수신 지연)
  const onMessageReceived = useCallback((serverTimestamp: number) => {
    const receiveLatency = Date.now() - serverTimestamp;

    sendMetrics('fe_chat_receive_latency', {
      latency: receiveLatency,
      timestamp: Date.now(),
    });
  }, []);

  return {
    onSendStart,
    onServerAck,
    onDeliveryConfirm,
    onMessageReceived,
  };
};
```

---

### 5.6 현직자 목록 렌더링 측정

```tsx
// hooks/useMentorListMetrics.ts
import { useEffect, useRef } from 'react';
import { sendMetrics } from '@/lib/metrics';

export const useMentorListMetrics = (
  isLoading: boolean,
  data: any[] | undefined,
  apiResponseTime?: number,
) => {
  const apiCompleteTimeRef = useRef<number | null>(null);
  const measuredRef = useRef(false);

  // API 응답 완료 시점 기록
  useEffect(() => {
    if (!isLoading && data && !apiCompleteTimeRef.current) {
      apiCompleteTimeRef.current = performance.now();
    }
  }, [isLoading, data]);

  // 렌더링 완료 측정
  useEffect(() => {
    if (data && data.length > 0 && apiCompleteTimeRef.current && !measuredRef.current) {
      const measure = () => {
        const renderTime = performance.now() - apiCompleteTimeRef.current!;

        sendMetrics('fe_mentor_list_render', {
          itemCount: data.length,
          renderTime,
          apiResponseTime,
          timestamp: Date.now(),
        });

        measuredRef.current = true;
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(measure);
      } else {
        setTimeout(measure, 0);
      }
    }
  }, [data, apiResponseTime]);
};
```

---

### 5.7 공통 메트릭 전송 모듈

```tsx
// lib/metrics.ts
type MetricType =
  | 'fe_upload'
  | 'fe_render'
  | 'fe_field_accuracy'
  | 'fe_chat_send_latency'
  | 'fe_chat_receive_latency'
  | 'fe_chat_e2e_latency'
  | 'fe_mentor_list_render'
  | 'web_vitals';

interface MetricData {
  [key: string]: any;
}

// 메트릭 배치 처리
let metricBuffer: Array<{ type: MetricType; data: MetricData }> = [];
let flushTimeout: NodeJS.Timeout | null = null;

const FLUSH_INTERVAL = 5000; // 5초마다 전송
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

  // Beacon API로 전송 (페이지 이탈 시에도 보장)
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

---

### 5.8 메트릭 수집 API 엔드포인트

```tsx
// app/api/metrics/batch/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const metrics = await request.json();

    // Prometheus Pushgateway로 전송
    await pushToPrometheus(metrics);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process metrics:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

async function pushToPrometheus(metrics: any[]) {
  const prometheusMetrics = metrics.map(convertToPrometheusFormat).join('\n');

  await fetch(
    `${process.env.PUSHGATEWAY_URL}/metrics/job/frontend/instance/${process.env.HOSTNAME || 'web'}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: prometheusMetrics,
    },
  );
}

function convertToPrometheusFormat(metric: { type: string; data: any }): string {
  const { type, data } = metric;

  switch (type) {
    case 'fe_upload':
      return `
fe_upload_duration_ms{file_type="${data.fileType}",status="${data.status}"} ${data.totalDuration}
fe_upload_size_bytes{file_type="${data.fileType}"} ${data.fileSize}
      `.trim();

    case 'fe_render':
      return `
fe_render_duration_ms{component="${data.component}"} ${data.renderTime}
      `.trim();

    case 'fe_field_accuracy':
      return `
fe_field_modification_rate ${data.modificationRate}
fe_fields_auto_filled ${data.autoFilledFields}
fe_fields_modified ${data.modifiedFields}
      `.trim();

    case 'fe_chat_send_latency':
      return `fe_chat_send_latency_ms ${data.latency}`;

    case 'fe_chat_receive_latency':
      return `fe_chat_receive_latency_ms ${data.latency}`;

    case 'web_vitals':
      return `
web_vitals_${data.name.toLowerCase()}{rating="${data.rating}",path="${data.pathname}"} ${data.value}
      `.trim();

    default:
      return '';
  }
}
```

---

## 6. 알림 조건

### 6.1 Critical (P1)

| 조건                      | 기준          | 알림 채널    |
| ------------------------- | ------------- | ------------ |
| LCP p95                   | > 8s (5분간)  | Slack + 전화 |
| 전체 페이지 렌더링 실패율 | > 10% (5분간) | Slack + 전화 |

### 6.2 High (P2)

| 조건                 | 기준             | 알림 채널 |
| -------------------- | ---------------- | --------- |
| LCP p95              | > 4s (15분간)    | Slack     |
| FCP p95              | > 3s (15분간)    | Slack     |
| CLS                  | > 0.25 (30분간)  | Slack     |
| 폼 렌더링 p95        | > 2s (15분간)    | Slack     |
| 메시지 전송 지연 p95 | > 500ms (15분간) | Slack     |

### 6.3 Medium (P3)

| 조건                     | 기준           | 알림 채널 |
| ------------------------ | -------------- | --------- |
| CLS                      | > 0.15 (1시간) | Slack     |
| 사용자 수정률            | > 30% (1일)    | 이메일    |
| 업로드 클라이언트 에러율 | > 5% (1시간)   | Slack     |

---

## 7. 대시보드 구성

### 7.1 FE Performance Dashboard

**패널 구성**:

| 패널                 | 메트릭             | 시각화                              |
| -------------------- | ------------------ | ----------------------------------- |
| Core Web Vitals 현황 | LCP, FCP, CLS, FID | Gauge (Good/Needs Improvement/Poor) |
| LCP 추이             | LCP p50, p95, p99  | Time Series                         |
| FCP 추이             | FCP p50, p95, p99  | Time Series                         |
| CLS 분포             | CLS 값 분포        | Histogram                           |
| 페이지별 성능        | 페이지별 LCP       | Table                               |

### 7.2 FE User Experience Dashboard

**패널 구성**:

| 패널               | 메트릭            | 시각화      |
| ------------------ | ----------------- | ----------- |
| 업로드 성공률      | 성공/실패 비율    | Pie Chart   |
| 업로드 지연 분포   | 업로드 시간 분포  | Histogram   |
| 폼 렌더링 시간     | 렌더링 p50, p95   | Time Series |
| 사용자 수정률 추이 | 수정률 %          | Time Series |
| 카테고리별 수정률  | 카테고리별 수정률 | Bar Chart   |

### 7.3 FE Chat Performance Dashboard

**패널 구성**:

| 패널             | 메트릭        | 시각화      |
| ---------------- | ------------- | ----------- |
| 메시지 전송 지연 | 전송 p50, p95 | Time Series |
| 메시지 수신 지연 | 수신 p50, p95 | Time Series |
| E2E 지연 분포    | E2E 지연 분포 | Histogram   |

---

## 8. 체크리스트

### 8.1 구현 체크리스트

| 항목                        | 상태 | 담당자 | 완료일 |
| --------------------------- | ---- | ------ | ------ |
| web-vitals 패키지 설치      | ☐    |        |        |
| Core Web Vitals 수집 구현   | ☐    |        |        |
| 메트릭 전송 API 구현        | ☐    |        |        |
| 업로드 메트릭 훅 구현       | ☐    |        |        |
| 렌더링 메트릭 훅 구현       | ☐    |        |        |
| 필드 정확도 훅 구현         | ☐    |        |        |
| 채팅 메트릭 훅 구현         | ☐    |        |        |
| Prometheus Pushgateway 연동 | ☐    |        |        |
| Grafana 대시보드 구성       | ☐    |        |        |
| 알림 규칙 설정              | ☐    |        |        |

### 8.2 검증 체크리스트

| 항목                           | 상태 |
| ------------------------------ | ---- |
| 개발 환경에서 메트릭 수집 확인 | ☐    |
| Staging 환경 테스트            | ☐    |
| 대시보드 데이터 표시 확인      | ☐    |
| 알림 트리거 테스트             | ☐    |
| Production 배포                | ☐    |

---
