# Step 02 - Mock/Fixture 레이어 구축

## 1) 배경 및 목표

### 배경
- Step 01에서는 Playwright 실행 기반만 확보했다.
- 테스트가 늘어나면 각 spec에서 `page.route`를 직접 반복 작성하게 되고, 동일 엔드포인트 응답 형태가 분산된다.
- mock 누락 상태로 테스트를 작성하면 실제 BFF 호출이 섞여 flaky가 발생할 수 있다.

### 목표
- 테스트 공통 fixture를 도입해 mock 사용 방식을 표준화한다.
- BFF 요청 중 mock되지 않은 요청을 추적/검증할 수 있는 안전장치를 제공한다.
- 첫 공통 mock으로 인증 상태(`guest`/`authed`) helper를 제공한다.

## 2) 범위

### 포함
- `tests/e2e/fixtures/e2e.ts` 공통 fixture 추가
- `tests/e2e/mocks/http.ts` 공통 HTTP mock 유틸 추가
- `tests/e2e/mocks/auth.ts` 인증 상태 mock helper 추가
- 기존 smoke 테스트를 fixture 기반으로 전환
- E2E 서버 실행 안정화를 위해 Playwright webServer를 webpack 모드로 조정

### 제외
- 도메인별 상세 mock 데이터셋(예: experts/report/resume)
- 다중 테스트 프로젝트 분리(chromium/firefox/webkit)
- CI 워크플로우 수정

## 3) 수행 작업 (시간 순서)

1. API 호출 경로 파악
- `buildApiUrl`/`endpoints.ts` 확인
- 클라이언트 `useAuthStatus`가 `/bff/auth/me`를 호출하는 점 확인

2. 공통 HTTP mock 유틸 작성
- JSON 응답 전용 `mockJsonRoute` 구현
- method 불일치 시 `route.fallback()` 처리
- 선택형 안전장치 `installUnmockedBffGuard` 구현

3. 인증 mock helper 작성
- `mockAuthGuest(page)`
- `mockAuthAuthed(page)`
- 모두 `/bff/auth/me`를 200 JSON 응답으로 통일

4. fixture 레이어 추가
- `test.extend`로 `apiMocks` 주입
- 각 spec는 `apiMocks.authGuest()` 등 helper만 호출하면 되도록 정리

5. Playwright webServer 안정화 설정 반영
- Next dev Turbopack panic으로 `page.goto`가 중단되는 이슈 확인
- `playwright.config.ts`의 webServer command를 `pnpm dev --webpack --hostname 127.0.0.1 --port 3100`으로 변경

6. smoke 테스트 리팩터링
- 기존 `@playwright/test` import를 fixture import로 교체
- 페이지 진입 전 `apiMocks.authGuest()` 호출 추가

## 4) 변경 파일 상세

### 4.1 `tests/e2e/mocks/http.ts` (신규)
- 역할
  - 경로/메서드 기반 JSON route mock 등록
  - mock 누락 BFF 요청 추적 guard 제공
- 핵심 함수
  - `mockJsonRoute(page, { path, method, status, body })`
  - `installUnmockedBffGuard(page)`

### 4.2 `tests/e2e/mocks/auth.ts` (신규)
- 역할
  - 인증 상태 관련 반복 mock 제거
- 제공 함수
  - `mockAuthGuest(page)` -> `{ authenticated: false }`
  - `mockAuthAuthed(page)` -> `{ authenticated: true }`

### 4.3 `tests/e2e/fixtures/e2e.ts` (신규)
- 역할
  - 모든 테스트에서 동일한 mock 인터페이스 사용
- 제공 항목
  - `test`, `expect` 재export
  - `apiMocks.authGuest`, `apiMocks.authAuthed`

### 4.4 `tests/e2e/smoke/login.spec.ts` (수정)
- fixture import 사용
- 테스트 시작 시 `apiMocks.authGuest()` 호출

### 4.5 `playwright.config.ts` (수정)
- webServer 기동 명령 변경
  - 변경 전: `pnpm dev --port 3100`
  - 변경 후: `pnpm dev --webpack --hostname 127.0.0.1 --port 3100`
- 목적: Turbopack panic으로 인한 E2E 불안정성 제거

## 5) 실행 명령어와 결과

1. 테스트 목록 확인
```bash
nvm use 20
pnpm test:e2e --list
```
- 결과: smoke 1개 정상 인식

2. 실제 실행
```bash
nvm use 20
pnpm test:e2e
```
- 결과: 1 passed
- 비고: 샌드박스에서는 포트 바인딩 권한 이슈가 있을 수 있어 권한 상승 실행으로 검증

## 6) 이슈 및 대응

### 이슈 A: mock 미등록 요청이 숨어서 지나갈 위험
- 현상: 테스트가 백엔드 의존 상태로 통과할 가능성
- 원인: spec별 수동 route 설정 누락
- 대응: `installUnmockedBffGuard`로 미목킹 요청 목록을 수집하고 테스트 단위에서 검증 가능하게 구조화

### 이슈 B: 같은 경로의 method 혼선
- 현상: 잘못된 method까지 같은 mock으로 처리될 가능성
- 대응: `mockJsonRoute`에서 request method 비교 후 불일치 시 `fallback`

### 이슈 C: Next dev(Turbopack) panic으로 인한 `page.goto` 중단
- 현상: `net::ERR_ABORTED; maybe frame was detached?`로 테스트 타임아웃 발생
- 원인: Next dev 서버에서 Turbopack panic 발생
- 대응: Playwright webServer를 webpack 모드로 고정하여 테스트 안정화

## 7) 트러블슈팅 타임라인

1. 증상: Step 02 검증 중 timeout 반복
- 실패 로그: `Test timeout of 30000ms exceeded`
- 호출 실패 지점: `page.goto('/login')`에서 `net::ERR_ABORTED; maybe frame was detached?`

2. 확인한 가설
- 가설 A: `/bff/**` mock guard가 페이지 초기 요청을 과도하게 차단
- 가설 B: fixture route 등록 순서 문제
- 가설 C: Next dev 서버 자체 불안정(Turbopack panic)

3. 시도한 조치
- 조치 A: guard 동작을 `throw` 즉시 실패 -> 501 응답 수집형으로 변경
- 조치 B: fixture 기본 강제 guard 제거(선택 적용으로 완화)
- 조치 C: CI 모드 재실행으로 서버 로그 확보

4. 최종 원인
- 근본 원인은 mock 레이어가 아니라 Next dev(Turbopack) panic
- panic 시 브라우저 frame detach가 발생해 `page.goto`가 중단됨

5. 최종 해결
- Playwright webServer를 Turbopack 대신 webpack 모드로 고정
  - `pnpm dev --webpack --hostname 127.0.0.1 --port 3100`
- 동일 테스트 재실행 결과 `1 passed` 확인

## 8) 고충/의사결정 메모
- 당시 가장 헷갈렸던 지점: 증상이 `goto abort`로만 보여서 테스트 코드 문제처럼 보였던 점.
- 버린 접근: mock guard를 기본 강제 정책으로 즉시 도입하는 방식.
- 채택한 접근: 원인 분리(테스트 코드 vs dev 서버) 후 서버 안정성 먼저 고정.
- 다음 단계에서 같은 문제를 피하는 방법: E2E는 기본적으로 webpack 모드로 실행하고, guard는 spec 단위 opt-in으로 적용.

## 9) 검증 체크리스트
- [x] 공통 fixture 파일 추가
- [x] 공통 HTTP mock 유틸 추가
- [x] auth mock helper 추가
- [x] 기존 smoke 테스트 fixture 전환 완료
- [x] `pnpm test:e2e --list` 통과
- [x] `pnpm test:e2e` 통과

## 10) 다음 단계 인수인계 (Step 03)
- 목표
  - 시나리오를 `@smoke`, `@critical`, `@error`로 확장
- 해야 할 일
  1. 도메인별 mock builder 추가 (예: experts/reports/resumes)
  2. 성공/빈데이터/에러 응답 variant 표준화
  3. UI 핵심 플로우 테스트 3~5개 추가
  4. 실패 케이스(assertion) 명시화
- 완료 기준
  - 핵심 동선이 모두 mock 기반으로 재현 가능
  - 필요한 테스트에서 `installUnmockedBffGuard`를 통해 미목킹 요청 검증 가능

## 11) 작업 환경
- 작업일: 2026-03-17
- Node: v20 계열(`.nvmrc` = 20)
- pnpm: v10 계열
