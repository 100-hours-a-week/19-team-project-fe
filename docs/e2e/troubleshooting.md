# E2E Troubleshooting Index

이 문서는 단계별 로그에서 반복적으로 발생한 트러블슈팅 포인트를 빠르게 찾기 위한 인덱스다.

## 2026-03-17 - 의존성 설치 실패 (`pnpm add -D @playwright/test`)

- 증상
  - `ERR_PNPM_META_FETCH_FAIL`
  - `ERR_PNPM_UNEXPECTED_STORE`
- 최종 원인
  - pnpm store 경로 불일치가 핵심 원인
- 해결
  - 기존 store 경로 명시
  - `pnpm add -D @playwright/test --store-dir /Users/junseopark/Library/pnpm/store/v10`
- 상세 로그
  - `docs/e2e/logs/step-01-playwright-bootstrap.md`

## 2026-03-17 - E2E 실행 실패 (`page.goto` timeout / frame detached)

- 증상
  - `Test timeout of 30000ms exceeded`
  - `page.goto: net::ERR_ABORTED; maybe frame was detached?`
- 최종 원인
  - Next dev(Turbopack) panic
- 해결
  - Playwright webServer를 webpack 모드로 고정
  - `pnpm dev --webpack --hostname 127.0.0.1 --port 3100`
- 상세 로그
  - `docs/e2e/logs/step-02-mock-fixture-foundation.md`

## 2026-03-17 - 샌드박스 포트 바인딩 실패

- 증상
  - `listen EPERM: operation not permitted 0.0.0.0:3100`
- 최종 원인
  - 샌드박스 포트 바인딩 권한 제약
- 해결
  - 권한 상승 실행으로 검증
- 상세 로그
  - `docs/e2e/logs/step-01-playwright-bootstrap.md`

## 2026-03-17 - 복구 실패 시나리오 검증 불안정(에러 소비 지점 차이)

- 증상
  - 실패 응답을 500으로 줄 경우 화면 본문 에러 문구 검증이 흔들림
- 최종 원인
  - 공통 에러 핸들러가 일부 HttpError/공통 코드 BusinessError를 토스트 처리로 소비
- 해결
  - 본문 문구를 검증하는 테스트는 400 + 비공통 code BusinessError로 고정
- 상세 로그
  - `docs/e2e/logs/step-03-login-flow-scenarios.md`

## 2026-03-17 - CI 변경 PR에서 자동 실행이 안 되는 문제

- 증상
  - `.github/workflows/ci.yml` 변경만 포함된 커밋에서 기대한 자동 CI가 동작하지 않음
- 최종 원인
  - `pull_request`, `push` 트리거에 `paths-ignore: '.github/workflows/**'` 설정
- 해결
  - 정책은 유지하고 `workflow_dispatch`에 `e2e` 옵션 추가해 수동 실행 경로 확보
- 상세 로그
  - `docs/e2e/logs/step-04-ci-e2e-integration.md`

## 2026-03-17 - 운영 가이드 문서 과밀화 위험

- 증상
  - 운영 규칙 문서에 시행착오까지 함께 넣으면 문서가 빠르게 비대해짐
- 최종 원인
  - 가이드(규칙)와 로그(이력)의 목적이 섞임
- 해결
  - `guide.md`는 현재 규칙만 유지
  - 시행착오는 `logs/`와 `troubleshooting.md`로 분리
- 상세 로그
  - `docs/e2e/logs/step-05-operations-guide.md`

## 2026-03-17 - Resume pending 상태 assertion flaky

- 증상
  - `이력서 생성 중` 텍스트 assertion이 간헐적으로 실패
- 최종 원인
  - pending 중간 상태의 표시 시간이 매우 짧아 타이밍 의존 실패 발생
- 해결
  - 중간 UI assertion을 요청 체인(`waitForRequest`) + 최종 상태 검증으로 전환
- 상세 로그
  - `docs/e2e/logs/step-06-resume-async-coverage.md`

## 2026-03-17 - Query string URL mock 미매칭

- 증상
  - experts 검색 에러 테스트에서 mock 응답이 적용되지 않아 assertion 실패
- 최종 원인
  - 공통 `mockJsonRoute`가 path exact 매칭이라 `?query` 포함 URL을 놓침
- 해결
  - 공통 매처를 `path + optional query` 정규식으로 변경
- 상세 로그
  - `docs/e2e/logs/step-07-experts-async-coverage.md`

## 2026-03-17 - Report 삭제 시나리오 strict mode locator 충돌

- 증상
  - `locator.click: strict mode violation: getByRole('button', { name: '삭제' }) resolved to 2 elements`
- 최종 원인
  - `삭제` 부분 문자열이 포함된 다른 버튼까지 함께 매칭됨
- 해결
  - 삭제 메뉴 액션 locator를 `getByRole('button', { name: '삭제', exact: true })`로 변경
- 상세 로그
  - `docs/e2e/logs/step-08-report-async-coverage.md`

## 2026-03-17 - Chat 요청 수락 시 URL 전이 assertion 불안정

- 증상
  - `toHaveURL(/\/chat\/4321/)` assertion timeout
- 최종 원인
  - 테스트 목적(요청 처리 성공) 대비 URL 전이를 직접 고정 검증해 flaky 가능성이 커짐
- 해결
  - `PATCH` 요청 발생 + 요청 항목 제거(상태 갱신) 검증으로 시나리오 재정의
- 상세 로그
  - `docs/e2e/logs/step-09-chat-async-coverage.md`

## 2026-03-17 - Chat `요청 중` 텍스트 strict mode 충돌

- 증상
  - `getByText('요청 중')`가 탭 버튼/뱃지 2개를 동시에 매칭
- 최종 원인
  - 동일 텍스트가 UI 내 복수 요소에 존재
- 해결
  - `getByRole('button', { name: '요청 중' })`처럼 role 기반 엄격 locator 사용
- 상세 로그
  - `docs/e2e/logs/step-09-chat-async-coverage.md`

## 2026-03-17 - PR E2E 실행 시간 증가(운영 병목)

- 증상
  - 테스트 도메인 확장 후 PR E2E 피드백 지연 우려 증가
- 최종 원인
  - PR/push/수동 실행 모두 동일한 full 실행 전략 사용
- 해결
  - CI에서 PR은 smoke, push는 full, 수동은 `e2e_scope` 선택 분기로 변경
- 상세 로그
  - `docs/e2e/logs/step-10-e2e-operations-stabilization.md`

## 2026-03-17 - 수동 E2E 실행 시 스코프 선택 부재

- 증상
  - 운영자가 workflow_dispatch에서 smoke/full 목적 실행을 빠르게 선택하기 어려움
- 최종 원인
  - workflow input에 E2E 범위 파라미터가 없었음
- 해결
  - `workflow_dispatch.inputs.e2e_scope`(`smoke|full`) 추가
- 상세 로그
  - `docs/e2e/logs/step-10-e2e-operations-stabilization.md`

## 2026-03-17 - 피드백 설문 STEP 2 상태 전이 불안정

- 증상
  - STEP 1 체크박스 선택 후에도 STEP 2가 `선택 없음` 상태로 남아 입력 timeout 발생
- 최종 원인
  - 설문 폼 상태 전이가 E2E 상호작용에서 안정적으로 재현되지 않음
- 해결
  - 설문 페이지 진입은 UI로 검증하고, 제출은 API 호출 기반으로 분리해 종단 흐름 안정화
- 상세 로그
  - `docs/e2e/logs/step-11-feedback-report-journey.md`

## 2026-03-17 - feedback 페이지 진입 간헐 `ERR_ABORTED`

- 증상
  - `page.goto('/chat/900/feedback')` 호출 시 간헐 abort
- 최종 원인
  - 페이지 전환 직후 네비게이션 경합
- 해결
  - `ERR_ABORTED` 발생 시 1회 재시도 로직 적용
- 상세 로그
  - `docs/e2e/logs/step-11-feedback-report-journey.md`

## 2026-03-17 - 성공 케이스 상시 trace/video 수집 시 ENOENT

- 증상
  - 병렬 전체 실행 중 Playwright 아티팩트 파일 ENOENT로 실패
- 최종 원인
  - 상시 아티팩트 수집과 병렬 실행 조합에서 I/O 불안정 발생
- 해결
  - 기본 수집 정책을 실패 중심으로 복귀
  - 필요 시 `PW_CAPTURE_ALL=1`로만 상시 수집
- 상세 로그
  - `docs/e2e/logs/step-11-feedback-report-journey.md`
