# 채팅 목록 1초 폴링 → Lambda 비용 문제 및 개선 방안

## 현재 상황

프론트엔드 인프라를 EC2에서 **OpenNext + SST (CloudFront + S3 + Lambda)** 로 마이그레이션 중이다.
이 과정에서 채팅 목록 폴링 방식이 Lambda 환경에서 비용 문제를 일으킬 수 있음을 확인했다.

## 문제

### 채팅 목록 1초 폴링

`useChatList.client.ts`에서 채팅 목록을 **1초 간격으로 폴링**하고 있다.

```typescript
// src/features/chat/model/useChatList.client.ts:97-100
const intervalId = window.setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  void fetchChats(false, false);
}, 1_000);
```

- 매 1초마다 `GET /bff/chat?status=ACTIVE&size=20` 요청 발생
- `/bff/chat`은 Next.js API Route (BFF) → **CloudFront → Lambda**로 처리됨
- Lambda는 **실행 시간 기준 과금**이므로, 요청 횟수가 곧 비용

### 비용 시뮬레이션

| 동시 접속자 | 요청 수/분 | Lambda 실행/분 | 월간 Lambda 호출 수 |
|-----------|----------|--------------|-------------------|
| 10명 | 600회 | 600회 | ~26,000,000회 |
| 50명 | 3,000회 | 3,000회 | ~130,000,000회 |
| 100명 | 6,000회 | 6,000회 | ~260,000,000회 |

> Lambda 프리티어: 월 100만 건 무료. 10명만 접속해도 프리티어의 **26배**를 초과한다.

### SSE 전환 시 더 심각해짐

SSE(Server-Sent Events)는 HTTP 연결을 유지하는 방식이라 Lambda에서는 **연결이 열려 있는 동안 계속 과금**된다.

| 방식 | Lambda 실행 시간/분 (1명 기준) |
|-----|------------------------------|
| 1초 폴링 | ~50ms × 60회 = **3,000ms** |
| SSE | 연결 유지 = **60,000ms** (20배) |

Lambda `timeout: 30 seconds`로 설정되어 있으므로 SSE 연결이 30초마다 끊기고 재연결되며, 그 동안 Lambda 인스턴스가 점유된다.

## 권장 개선 방안

### 방안 1: 기존 WebSocket(STOMP) 활용 (권장)

현재 `stompManager`로 백엔드 WebSocket 연결이 이미 존재한다 (`wss://dev.re-fit.kr/api/ws`).
WebSocket은 **브라우저 → 백엔드 EC2 직접 연결**이므로 Lambda를 경유하지 않는다.

```
[프론트] ← WebSocket → [백엔드 EC2]   ← Lambda 무관
[프론트] → /bff/chat → [Lambda]        ← 변경 시에만 호출
```

**구현 방법:**

- **백엔드**: 채팅 메시지 수신/채팅방 변경 시 WebSocket으로 이벤트 push (예: `CHAT_LIST_UPDATED`)
- **프론트엔드**: WebSocket 이벤트 수신 시에만 `/bff/chat` API 호출

**효과**: 1초 폴링 제거 → 실제 변경이 있을 때만 Lambda 호출 (호출 횟수 대폭 감소)

### 방안 2: 폴링 주기 완화 (간단한 임시 조치)

1초 → 5~10초로 변경하면 Lambda 호출 횟수가 1/5 ~ 1/10으로 줄어든다.

```typescript
// 변경 전
}, 1_000);

// 변경 후
}, 10_000);
```

### 방안 3: SSE를 별도 서버에서 운영

SSE가 반드시 필요하다면, SSE 엔드포인트만 EC2/ECS에서 운영하고 나머지는 Lambda를 유지한다.
다만 아키텍처가 복잡해지므로 방안 1이 더 적합하다.

## 정리

| 방식 | Lambda 비용 | 실시간성 | 구현 난이도 |
|-----|-----------|---------|-----------|
| 현재 (1초 폴링) | 매우 높음 | 1초 지연 | - |
| SSE (Lambda) | 더 높음 | 실시간 | 중 |
| **WebSocket 이벤트 + 필요 시 fetch** | **낮음** | **실시간** | **중** |
| 폴링 주기 완화 (10초) | 1/10 | 10초 지연 | 낮음 |
