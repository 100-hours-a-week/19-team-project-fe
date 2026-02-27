# OpenNext + SST(Lambda) 환경에서 실시간 기능 설계 제약

## 배경

프론트엔드 인프라를 EC2에서 **OpenNext + SST (CloudFront + S3 + Lambda)** 로 마이그레이션함에 따라,
Lambda 환경에서 실시간 기능을 설계할 때 반드시 지켜야 할 제약사항을 정리한다.

## 핵심 원칙

> **실시간 기능은 BFF(Lambda)를 경유하지 않고, 브라우저가 백엔드에 직접 연결해야 한다.**

Lambda는 **요청-응답 후 즉시 종료**되는 패턴에 최적화되어 있으며, 실행 시간 기준으로 과금된다.
연결을 오래 유지하는 패턴은 Lambda 비용을 급격히 증가시킨다.

## 올바른 구조 vs 잘못된 구조

### 브라우저 → 백엔드 직접 연결 (올바른 구조)

```
브라우저 ──→ wss://dev.re-fit.kr/api/ws ──→ 백엔드 EC2
브라우저 ──→ https://dev.re-fit.kr/api/sse ──→ 백엔드 EC2

→ Lambda를 경유하지 않음
→ 연결 유지 비용 없음
```

브라우저의 JavaScript가 백엔드 서버에 직접 WebSocket/SSE 연결을 맺는다.
프론트엔드 서버(Lambda)를 거치지 않으므로 Lambda 비용과 무관하다.

### BFF 경유 (잘못된 구조)

```
브라우저 ──→ CloudFront ──→ Lambda(BFF) ──→ 백엔드 EC2
                              ↑
                         연결 유지 동안 계속 과금
```

프론트엔드 BFF API Route가 중간에서 백엔드의 실시간 데이터를 받아 클라이언트에 전달하는 방식.
Lambda가 연결을 유지하는 동안 계속 과금되며, `timeout: 30 seconds` 제한에도 걸린다.

## 구체적인 예시: 알림 기능

```javascript
// ✅ 직접 연결 — Lambda 무관, 비용 없음
const eventSource = new EventSource('https://dev.re-fit.kr/api/notifications/stream')
eventSource.onmessage = (e) => { /* 알림 처리 */ }


// ❌ BFF 경유 — Lambda가 연결 유지, 계속 과금
// src/app/bff/notifications/stream/route.ts 에서
// 백엔드 SSE 구독 → 클라이언트에 중계
```

## Lambda에서 지양해야 하는 패턴

| 패턴 | 문제 |
|-----|------|
| SSE (Server-Sent Events) | Lambda가 연결 유지 동안 계속 과금 |
| Long Polling | 응답 대기 동안 Lambda 점유 |
| 1~5초 단위 짧은 폴링 | 호출 횟수 폭증 → 비용 증가 |
| BFF를 경유하는 WebSocket | 장시간 연결 불가 (30s timeout) + 과금 |

## Lambda에서 허용되는 패턴

| 패턴 | 이유 |
|-----|------|
| 사용자 액션 기반 요청 (클릭, 폼 제출) | 빈도 낮음, 짧은 실행 |
| SSR 페이지 렌더링 | 페이지 진입 시 1회 |
| 10초 이상 간격 폴링 | 비용 허용 범위 |
| 브라우저 → 백엔드 직접 연결 (WebSocket, SSE) | Lambda를 경유하지 않으므로 무관 |

## 현재 프로젝트 상태

| 기능 | 방식 | Lambda 경유 | 상태 |
|-----|------|------------|------|
| 채팅 메시지 (STOMP) | 브라우저 → 백엔드 직접 WebSocket | X | 문제 없음 |
| 채팅 목록 갱신 | BFF 1초 폴링 (`/bff/chat`) | O | **개선 필요** |
| SSR 페이지 | 페이지 진입 시 1회 | O | 문제 없음 |
| BFF API 호출 | 사용자 액션 기반 | O | 문제 없음 |

## 프론트엔드 / 백엔드 개발 시 확인사항

### 프론트엔드

새로운 실시간 기능 구현 시 다음을 확인:

1. `/bff/*` API Route를 경유하는 SSE, Long Polling, 5초 이하 폴링이 있는가?
2. 있다면 → 브라우저에서 백엔드에 직접 연결하는 방식으로 변경

### 백엔드

프론트엔드에 실시간 데이터를 전달하는 기능 설계 시:

1. 프론트엔드 BFF를 중간 다리로 사용하는 구조인가?
2. 있다면 → 클라이언트가 백엔드에 직접 연결할 수 있는 엔드포인트 제공
