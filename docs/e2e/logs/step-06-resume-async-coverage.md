# Step 06 - Resume 비동기 플로우 테스트 확장

## 1) 배경 및 목표

### 배경

- 기존 E2E는 로그인 도메인 중심이어서 Resume 도메인의 비동기 상태 전이를 충분히 검증하지 못했다.
- 사용자 핵심 경험에서 Resume 화면은 로딩, 파싱 완료 반영, 상세 조회 등 비동기 처리 비중이 높다.

### 목표

- Resume 도메인의 비동기 플로우를 `@critical`/`@error`로 확장한다.
- 단순 렌더 검증이 아니라 요청 체인과 상태 전이를 같이 검증한다.
- flaky를 줄이기 위해 중간 상태 대신 안정적인 완료 조건을 중심으로 assertion을 구성한다.

## 2) 범위

### 포함

- Resume 도메인 mock helper 추가
- Resume 비동기 `@critical` 테스트 3건 추가
- Resume 실패 `@error` 테스트 2건 추가
- 테스트 실패 원인 분석 후 안정화 리팩터링

### 제외

- Resume 편집 자동등록(파일 업로드) E2E
- SSE 실시간 이벤트 검증
- CI workflow 구조 변경

## 3) 수행 작업 (시간 순서)

1. Resume 비동기 흐름 분석

- 목록/상세/pending parse task 동작 코드 확인
- `useResumeList`의 task 완료 시 `createResume` 호출 및 리스트 invalidation 흐름 확인

2. Resume mock 레이어 추가

- `tests/e2e/mocks/resume.ts` 작성
- 목록/상세/task 완료/create 응답 helper 추가

3. fixture 확장

- `apiMocks`에 resume 관련 helper 추가
  - `resumesList`, `resumesListError`, `resumeDetail`, `resumeParseTaskCompleted`, `createResumeSuccess`

4. 비동기 `@critical` 테스트 추가

- 목록 로딩 상태 후 완료 렌더
- pending parse task 완료 후 생성 이력서 반영
- 상세 페이지 비동기 로드 후 내용 렌더

5. `@error` 테스트 추가

- 목록 조회 실패 인라인 에러
- 상세 조회 실패 인라인 에러

6. 회귀 실행 및 안정화

- 1차 실행에서 pending 카드 노출 assertion이 타이밍 이슈로 실패
- 요청 체인 기반 검증(`waitForRequest`)으로 변경 후 재실행
- 전체 10개 테스트 통과

## 4) 변경 파일 상세

### 4.1 `tests/e2e/mocks/http.ts` (수정)

- API 응답 envelope helper 추가
  - `buildApiSuccess`
  - `buildApiError`

### 4.2 `tests/e2e/mocks/auth.ts` (수정)

- 공통 envelope helper 사용하도록 정리

### 4.3 `tests/e2e/mocks/resume.ts` (신규)

- Resume 도메인 mock builder 추가

### 4.4 `tests/e2e/fixtures/e2e.ts` (수정)

- resume 관련 `apiMocks` 메서드 추가

### 4.5 `tests/e2e/critical/resume-async.spec.ts` (신규)

- Resume 비동기 핵심 시나리오 3건

### 4.6 `tests/e2e/error/resume-error.spec.ts` (신규)

- Resume 실패 시나리오 2건

## 5) 실행 명령어와 결과

1. 테스트 목록 확인

```bash
nvm use 20
pnpm test:e2e --list
```

- 결과: 총 10개 테스트 인식

2. 1차 전체 실행

```bash
nvm use 20
pnpm test:e2e
```

- 결과: 9 passed, 1 failed
- 실패: pending 상태 노출 assertion 타이밍 이슈

3. 안정화 수정 후 2차 전체 실행

```bash
nvm use 20
pnpm test:e2e
```

- 결과: 10 passed

## 6) 이슈 및 대응

### 이슈 A: pending 상태 텍스트 assertion flaky

- 현상: `이력서 생성 중`이 매우 짧게 지나가며 assertion 실패
- 원인: 비동기 처리 완료가 빨라 중간 상태 UI가 테스트 타이밍 전에 사라짐
- 대응: 중간 텍스트 노출 검증 대신 요청 체인 + 최종 상태 검증으로 전환

## 7) 트러블슈팅 타임라인

1. 증상:

- `promotes pending parse task...` 테스트에서 `이력서 생성 중` 요소를 찾지 못함

2. 확인한 가설:

- 가설 A: pending 상태가 렌더되지 않음
- 가설 B: pending 상태는 렌더되지만 매우 짧아 assertion 시점과 엇갈림

3. 시도한 조치:

- 테스트 로그와 실패 스크린샷 확인
- 중간 텍스트 assertion 제거
- `waitForRequest`로 task 조회/생성 요청 발생 자체를 검증

4. 최종 원인:

- 중간 상태 UI의 수명이 짧아 타이밍 의존 assertion이 불안정

5. 최종 해결:

- 비동기 테스트는 "요청 체인 + 최종 UI 상태" 중심으로 검증하도록 규칙화

## 8) 고충/의사결정 메모

- 당시 가장 헷갈렸던 지점: 비동기 완료가 빠른 경우 중간 상태를 얼마나 검증해야 하는지.
- 버린 접근: 중간 로딩 텍스트 노출을 강제 검증하는 방식.
- 채택한 접근: 핵심 비동기 신뢰 지표를 요청 체인과 최종 상태로 이동.
- 다음 단계에서 같은 문제를 피하는 방법: 중간 상태 assertion은 충분한 체류 시간이 보장될 때만 사용.

## 9) 검증 체크리스트

- [x] Resume async `@critical` 3건 추가
- [x] Resume `@error` 2건 추가
- [x] 1차 실패 원인 분석 및 테스트 안정화
- [x] 전체 E2E 통과(10 passed)

## 10) 다음 단계 인수인계

- 목표
  - remaining 도메인(experts/report/chat)도 비동기 중심으로 확장
- 해야 할 일
  1. experts 검색/필터/상세 비동기 테스트 추가
  2. report 생성/삭제/에러 시나리오 추가
  3. chat 리스트/상세/전송 실패 시나리오 추가
  4. 필요 시 smoke 전용 CI job 분리
- 완료 기준
  - 핵심 사용자 플로우 비동기 전이가 E2E로 회귀 방어됨

## 11) 작업 환경

- 작업일: 2026-03-17
- Node: v20 계열(`.nvmrc` = 20)
- pnpm: v10 계열
