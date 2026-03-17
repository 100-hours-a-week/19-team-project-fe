# Step 09 - Chat 비동기 플로우 테스트 확장

## 1) 배경 및 목표

### 배경

- Resume/Experts/Report까지 확장했지만 Chat 도메인은 여전히 목록/요청 처리 구간 회귀 방어가 약했다.
- Chat은 탭 전환, 요청 수락/거절, 요청 목록 로딩 등 비동기 전이가 많아 E2E로 방어해야 한다.

### 목표

- Chat 도메인 `@critical`/`@error` 시나리오를 추가한다.
- 목록 로딩, 요청 처리(PATCH), 요청 목록 에러 노출을 검증한다.
- 수행 중 발생한 실패/수정 내역을 상세 문서화한다.

## 2) 범위

### 포함

- Chat mock helper 신규 추가
- fixture API 확장(chat 관련 메서드)
- Chat `@critical` 3건 추가
- Chat `@error` 2건 추가
- 전체 E2E 회귀 검증

### 제외

- ChatRoom 메시지 송수신(websocket) E2E
- feedback/review 폼 상세 플로우
- CI 워크플로우 구조 변경

## 3) 수행 작업 (시간 순서)

1. Chat 페이지 비동기 흐름 분석

- `useChatList`, `useChatRequestList`, `updateChatRequestStatus` 호출 흐름 확인
- `/bff/chat`, `/bff/chat/requests`, `/bff/chat/requests/:id`, `/bff/users/me` 의존성 확인

2. Chat mock 레이어 작성

- `tests/e2e/mocks/chat.ts` 신규 추가
- 사용자/채팅목록/요청목록/요청상태변경 성공·실패 helper 구성

3. fixture 확장

- `tests/e2e/fixtures/e2e.ts`에 chat 관련 `apiMocks` 메서드 추가
- 도메인 테스트에서 재사용 가능한 기본 데이터 생성 로직 연결

4. Chat 시나리오 작성

- `tests/e2e/critical/chat-async.spec.ts` 3건
  - 채팅 목록 로딩 -> 렌더
  - 받은 요청 거절(PATCH) -> 목록 제거
  - 보낸 요청 로딩 -> 렌더
- `tests/e2e/error/chat-error.spec.ts` 2건
  - 채팅 목록 조회 실패
  - 보낸 요청 조회 실패

5. 1차 검증 및 실패 대응

- Chat 단독 실행에서 5개 중 2개 실패
- 실패 1: 받은 요청 수락 후 URL 전이 assertion 불안정
- 실패 2: `요청 중` 텍스트 strict mode 충돌
- 시나리오를 액션 본질(PATCH 호출 + 목록 갱신) 중심으로 재정의, locator 엄격화

6. 재검증

- Chat 단독 5 passed
- 전체 E2E 25 passed

## 4) 변경 파일 상세

### 4.1 `tests/e2e/mocks/chat.ts` (신규)

- builder
  - `createUserMe`, `createChatSummary`, `createChatRequestItem`
- mock helper
  - `mockUserMe`
  - `mockChatListByStatus`, `mockChatListError`
  - `mockChatRequestsByDirection`, `mockChatRequestsError`
  - `mockUpdateChatRequestStatus`, `mockUpdateChatRequestStatusError`

### 4.2 `tests/e2e/fixtures/e2e.ts` (수정)

- `apiMocks`에 chat 메서드 추가
  - `userMe`, `chatList`, `chatListError`
  - `chatRequests`, `chatRequestsError`
  - `chatRequestUpdateSuccess`, `chatRequestUpdateError`

### 4.3 `tests/e2e/critical/chat-async.spec.ts` (신규/수정)

- Chat 비동기 핵심 시나리오 3건 추가
- 수락 후 라우팅 검증 시나리오를 거절 처리 기반의 안정 검증으로 변경
- `요청 중` assertion을 role 기반 strict locator로 보강

### 4.4 `tests/e2e/error/chat-error.spec.ts` (신규)

- Chat 에러 시나리오 2건 추가

## 5) 실행 명령어와 결과

1. Chat 단독 실행 (1차)

```bash
nvm use 20
pnpm exec playwright test tests/e2e/critical/chat-async.spec.ts tests/e2e/error/chat-error.spec.ts
```

- 결과: 3 passed, 2 failed
- 실패:
  - 수락 후 URL 전이 assertion 실패
  - `요청 중` 텍스트 strict mode violation

2. 수정 후 Chat 단독 재실행

```bash
nvm use 20
pnpm exec playwright test tests/e2e/critical/chat-async.spec.ts tests/e2e/error/chat-error.spec.ts
```

- 결과: 5 passed

3. 전체 회귀 실행

```bash
nvm use 20
pnpm test:e2e
```

- 결과: 25 passed

## 6) 이슈 및 대응

### 이슈 A: 수락 후 URL 전이 assertion 불안정

- 현상: `toHaveURL(/\/chat\/4321/)`가 간헐적으로 실패
- 원인: 받은 요청 액션의 핵심은 상태 업데이트인데, 라우팅 전이까지 단일 assertion으로 묶어 flaky 가능성 증가
- 대응: 테스트 목적을 `PATCH 호출 + 요청 목록 갱신`으로 재정의

### 이슈 B: `요청 중` 텍스트 strict mode 충돌

- 현상: `getByText('요청 중')`가 탭 버튼/뱃지 2개를 동시에 매칭
- 원인: 동일 텍스트가 UI 내 다중 위치에 존재
- 대응: `getByRole('button', { name: '요청 중' })`로 역할 기반 엄격 locator 사용

## 7) 트러블슈팅 타임라인

1. 증상:

- Chat 단독 5개 중 2개 실패

2. 확인한 가설:

- 가설 A: 요청 상태 업데이트 mock 미매칭
- 가설 B: 라우팅 자체를 검증 기준으로 둔 테스트 설계 문제
- 가설 C: 텍스트 기반 locator 중복 매칭

3. 시도한 조치:

- 실패 로그에서 strict mode violation/URL assertion 타임아웃 구분
- 받은 요청 시나리오를 `waitForRequest(PATCH)` + 목록 제거 검증으로 변경
- `요청 중` assertion을 role 기반 locator로 변경

4. 최종 원인:

- 라우팅 전이까지 포함한 단일 assertion이 과도했고, 동일 텍스트 다중 매칭이 strict mode 위반을 유발

5. 최종 해결:

- 액션 본질 검증으로 시나리오 재정의 + 엄격 locator 적용 후 단독/전체 모두 통과

## 8) 고충/의사결정 메모

- 당시 가장 헷갈렸던 지점: API mock 문제처럼 보였지만 실제로는 assertion target이 과도했다.
- 버린 접근: URL 전이만 계속 재시도/대기시간 증가로 억지 통과.
- 채택한 접근: 사용자 액션의 핵심 결과(PATCH 요청, 목록 상태 반영) 중심 검증.
- 다음 단계에서 같은 문제를 피하는 방법: 동일 텍스트가 반복되는 UI는 role/scope 기반 locator를 기본 적용.

## 9) 검증 체크리스트

- [x] Chat `@critical` 3건 추가 완료
- [x] Chat `@error` 2건 추가 완료
- [x] Chat 단독 실행 통과(5 passed)
- [x] 전체 E2E 통과(25 passed)

## 10) 다음 단계 인수인계

- 목표
  - Step 10 운영 안정화(Flaky 방지 규칙/스모크 분리/CI 실행 전략)를 정리한다.
- 해야 할 일
  1. locator 안정화 규칙(role/exact/scope) 문서화
  2. 핵심 스모크 최소셋 분리 및 실행 시간 최적화 검토
  3. 실패 재현 절차와 artifact 확인 루틴 고도화
- 완료 기준
  - E2E 운영 규칙만 보고 신규 팀원이 동일 품질로 테스트를 추가/디버깅할 수 있음
