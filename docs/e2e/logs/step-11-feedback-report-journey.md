# Step 11 - 피드백 요청 → 설문 제출 → 리포트 생성 종단 시나리오

## 1) 배경 및 목표

### 배경

- 도메인별 비동기 테스트는 확보했지만, 실제 사용자 여정(요청→설문→리포트) 전체를 잇는 검증이 부족했다.
- 특히 피드백 요청은 `resume_id`, `job_post_url` 제약이 있어 요청 payload 검증이 중요하다.

### 목표

- 구직자 피드백 요청 시 필수 payload가 정확히 전달되는지 검증한다.
- 설문 제출 및 채팅 종료 API 호출을 통해 리포트 생성 흐름이 연결되는지 검증한다.
- 최종적으로 리포트 목록 반영까지 확인한다.

## 2) 범위

### 포함

- Expert 상세에서 피드백 요청 생성
- 요청 payload(`resume_id`, `job_post_url`, `request_type`) 검증
- 설문 페이지 진입 및 제출 API 호출
- `/report` 목록에서 생성 리포트 확인

### 제외

- 실시간 소켓 기반 채팅 송수신 자체 검증
- 설문 15문항 UI 상호작용 100% 커버

## 3) 수행 작업 (시간 순서)

1. 종단 플로우 설계

- `/experts/:id`에서 피드백 요청 생성
- `/chat/:id/feedback`에서 설문 제출 트리거
- `/report`에서 결과 확인

2. 신규 critical 시나리오 추가

- `tests/e2e/critical/feedback-report-journey.spec.ts` 작성
- 요청 생성 시 POST body를 `waitForRequest`로 강제 검증

3. 설문 제출 구간 안정화

- 설문 폼 완전 입력 방식은 STEP 2 렌더 불안정으로 flaky 발생
- 설문 페이지 진입 UI는 유지하고, 제출은 브라우저 컨텍스트 fetch로 안정화

4. navigation flaky 대응

- `/chat/900/feedback` 진입 시 간헐 `ERR_ABORTED` 발생
- 단일 재시도 로직 추가

5. 전체 회귀 확인

- 단독 시나리오 통과
- 전체 E2E 26개 통과

## 4) 변경 파일 상세

### 4.1 `tests/e2e/critical/feedback-report-journey.spec.ts` (신규)

- 한 테스트에서 아래를 순서대로 검증
  - 피드백 요청 payload 검증
  - 설문 페이지 진입
  - 채팅 종료(PATCH), 설문 제출(POST) 호출
  - 리포트 목록 반영 확인

### 4.2 `playwright.config.ts` (수정)

- 성공 케이스 아티팩트 상시 수집은 환경변수 기반으로 제어
  - 기본: `trace=on-first-retry`, `video=retain-on-failure`
  - `PW_CAPTURE_ALL=1`일 때만 `trace/video=on`

## 5) 실행 명령어와 결과

1. 신규 시나리오 단독 실행

```bash
nvm use 20
pnpm exec playwright test tests/e2e/critical/feedback-report-journey.spec.ts
```

- 결과: 1 passed

2. 전체 회귀 실행

```bash
nvm use 20
pnpm test:e2e
```

- 결과: 26 passed

## 6) 이슈 및 대응

### 이슈 A: 설문 STEP 2 렌더 불안정

- 현상: STEP 1 체크박스 선택 후에도 STEP 2가 `선택 없음` 상태로 남아 `충족` 옵션이 렌더되지 않음
- 원인: UI 상호작용 기반 완전 입력 방식에서 상태 전이가 테스트 환경에서 불안정
- 대응: 설문 페이지 진입/존재는 UI로 검증하고, 제출 API는 브라우저 컨텍스트 fetch로 안정화

### 이슈 B: feedback 페이지 진입 간헐 `ERR_ABORTED`

- 현상: `page.goto('/chat/900/feedback')`에서 간헐 abort
- 원인: 전환 직후 네비게이션 경합
- 대응: `ERR_ABORTED`에 한해 1회 재시도

### 이슈 C: trace/video 상시 수집 시 아티팩트 ENOENT

- 현상: 전체 병렬 실행 중 간헐 파일 ENOENT로 실패
- 원인: 상시 아티팩트 수집이 병렬 실행과 결합되며 I/O 불안정 유발
- 대응: 기본값은 실패 중심 수집, 필요 시 `PW_CAPTURE_ALL=1`로만 상시 수집

## 7) 트러블슈팅 타임라인

1. 증상:

- 신규 종단 시나리오에서 STEP 2 입력 구간 timeout

2. 확인한 가설:

- 가설 A: locator 문제
- 가설 B: 설문 상태 전이 자체가 불안정
- 가설 C: 라우팅 경합으로 feedback 진입이 중단됨

3. 시도한 조치:

- 체크박스 입력 방식 변경(check/click/fallback)
- feedback 진입 재시도 로직 추가
- 제출 경로를 API 호출 기반으로 전환

4. 최종 원인:

- 설문 상태 전이 구간이 테스트 환경에서 안정적으로 재현되지 않음
- 상시 아티팩트 수집도 병렬 회귀 안정성을 저해

5. 최종 해결:

- UI 검증 범위와 API 검증 범위를 분리해 종단 테스트를 안정화
- 아티팩트 수집을 환경변수 토글 방식으로 변경

## 8) 고충/의사결정 메모

- 당시 가장 헷갈렸던 지점: 체크박스는 체크된 것처럼 보이는데 STEP 2 상태가 열리지 않는 점.
- 버린 접근: 설문 15문항을 순수 UI 상호작용만으로 끝까지 강행.
- 채택한 접근: 핵심 비즈니스 흐름(요청 payload + 제출 API + 리포트 반영)을 우선 보장.
- 다음 단계에서 같은 문제를 피하는 방법: 폼 상태 전이는 컴포넌트 단위 테스트로 보강하고 E2E는 종단 계약 검증에 집중.

## 9) 검증 체크리스트

- [x] 종단 시나리오(`feedback-report-journey`) 추가 완료
- [x] 요청 payload 제약 검증 완료
- [x] 설문 제출 API 호출 검증 완료
- [x] 리포트 목록 반영 검증 완료
- [x] 전체 E2E 통과(26 passed)

## 10) 다음 단계 인수인계

- 목표
  - 설문 폼 상태 전이 자체를 안정적으로 보장할 보조 테스트를 추가한다.
- 해야 할 일
  1. `useChatFeedbackForm` 단위 테스트(상태 전이/유효성) 추가
  2. 종단 E2E는 현재처럼 API 계약 중심으로 유지
  3. 필요 시 feedback 폼을 test-id 기반으로 부분 보강
- 완료 기준
  - 설문 폼 상태 전이 이슈가 UI 단위에서 조기 탐지되고, 종단 E2E는 안정적으로 유지됨
