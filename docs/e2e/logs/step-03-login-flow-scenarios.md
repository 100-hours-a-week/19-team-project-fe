# Step 03 - 로그인 플로우 시나리오 확장

## 1) 배경 및 목표

### 배경
- Step 02에서 공통 fixture와 mock helper의 기초를 만들었다.
- 아직 테스트 케이스 수가 부족해서 회귀 방어 범위가 좁다.

### 목표
- `@smoke`, `@critical`, `@error` 태그를 사용하는 실질 시나리오를 추가한다.
- 테스트가 실제 사용자 행동(약관 조회, 계정 복구 성공/실패)을 검증하도록 확장한다.
- 변경 과정의 트러블슈팅과 의사결정을 단계 로그에 남긴다.

## 2) 범위

### 포함
- 로그인 화면 시나리오 기반 테스트 추가
- 계정 복구 API 성공/실패 mock 추가
- 테스트 태그 분리(`@smoke`, `@critical`, `@error`)

### 제외
- CI 워크플로우 수정
- 다른 도메인(experts/report/resume) 시나리오 확장

## 3) 수행 작업 (시간 순서)

1. 시나리오 대상 확정
- 범위를 로그인 도메인으로 제한
- 이유: 현재 mock 레이어로 안정적으로 검증 가능한 사용자 플로우를 우선 확대

2. auth mock helper 확장
- `mockRestoreAccountSuccess` 추가
- `mockRestoreAccountBusinessError` 추가
- 목적: 복구 성공/실패를 API 응답 형태로 제어

3. fixture API 확장
- `apiMocks.restoreAccountSuccess()`
- `apiMocks.restoreAccountBusinessError(message?)`
- spec에서 반복 route 등록 코드를 제거

4. `@critical` 시나리오 3건 추가
- 약관 바텀시트 열기/닫기
- 세션 기반 복구 바텀시트 노출
- 복구 성공 시 요청 payload 검증 + 홈 이동

5. `@error` 시나리오 1건 추가
- 복구 API 비즈니스 에러 응답 시 에러 메시지 노출 검증

6. 전체 회귀 실행
- `pnpm test:e2e --list`
- `pnpm test:e2e`
- 결과: 5개 테스트 모두 통과

## 4) 변경 파일 상세

### 4.1 `tests/e2e/mocks/auth.ts` (수정)
- 추가 함수
  - `mockRestoreAccountSuccess(page, overrides?)`
  - `mockRestoreAccountBusinessError(page, { code?, message? })`
- 복구 API(`/bff/auth/restore`)를 성공/실패 시나리오로 제어 가능하게 확장

### 4.2 `tests/e2e/fixtures/e2e.ts` (수정)
- `apiMocks` 확장
  - `restoreAccountSuccess`
  - `restoreAccountBusinessError`
- 테스트 코드에서 mock 등록 표준화

### 4.3 `tests/e2e/critical/login-ui.spec.ts` (신규)
- `@critical` 3개 시나리오 추가
  - 이용약관 바텀시트 상호작용
  - 복구 바텀시트 노출
  - 복구 성공 요청 payload + 라우팅 검증

### 4.4 `tests/e2e/error/login-restore-error.spec.ts` (신규)
- `@error` 1개 시나리오 추가
  - 복구 실패 메시지 노출 검증

## 5) 실행 명령어와 결과

1. 테스트 목록 확인
```bash
nvm use 20
pnpm test:e2e --list
```
- 결과: 총 5개 테스트 인식
  - `@smoke` 1개
  - `@critical` 3개
  - `@error` 1개

2. 전체 실행
```bash
nvm use 20
pnpm test:e2e
```
- 결과: `5 passed`

## 6) 이슈 및 대응

### 이슈 A: 복구 실패 시나리오에서 예상 에러 텍스트가 달라질 수 있는 위험
- 현상: 서버 에러 status만 주면 공통 에러 핸들러에서 토스트로 소비되어 본문 텍스트 검증이 불안정
- 원인: `useCommonApiErrorHandler`가 일부 에러 코드를 선처리함
- 대응: 테스트에서는 400 + 비공통 코드 BusinessError를 명시적으로 내려서 화면 에러 문구 검증 가능하게 설계

## 7) 트러블슈팅 타임라인

1. 증상:
- 복구 실패 케이스를 단순 500 응답으로 만들면 화면 내 에러 문구 검증이 일관되지 않음

2. 확인한 가설:
- 가설 A: 공통 에러 핸들러가 HttpError(5xx)를 토스트 처리로 흡수
- 가설 B: BusinessError 중 공통 코드도 토스트 처리될 수 있음

3. 시도한 조치:
- `apiFetch` / `useCommonApiErrorHandler` 흐름 확인
- 실패 시나리오 응답을 400 + 비공통 code(`RESTORE_ACCOUNT_FAILED`)로 구성

4. 최종 원인:
- 공통 에러 핸들러의 선처리 범위 때문에 에러 유형에 따라 DOM 출력 지점이 달라짐

5. 최종 해결:
- 본문 에러 검증이 필요한 테스트는 비공통 BusinessError 응답으로 고정

## 8) 고충/의사결정 메모
- 당시 가장 헷갈렸던 지점: 같은 실패라도 HttpError와 BusinessError에서 UI 반응이 다른 점.
- 버린 접근: 복구 실패를 모두 500으로 통일하는 방식.
- 채택한 접근: 테스트 목적(본문 문구 검증)에 맞춰 오류 타입을 명시적으로 제어.
- 다음 단계에서 같은 문제를 피하는 방법: 에러 테스트 작성 전 에러 소비 지점(토스트/inline/redirect)부터 확인.

## 9) 검증 체크리스트
- [x] `@smoke` 유지(1개) + 회귀 통과
- [x] `@critical` 추가 완료(3개)
- [x] `@error` 추가 완료(1개)
- [x] `pnpm test:e2e` 통과(5 passed)

## 10) 다음 단계 인수인계
- 목표
  - CI에서 E2E를 자동 실행하고 실패 artifact를 남긴다.
- 해야 할 일
  1. `.github/workflows`에 E2E job 추가(PR, main)
  2. Node 20 + pnpm 캐시 + Playwright browser 설치 단계 구성
  3. 실패 시 `playwright-report`, `test-results` artifact 업로드
  4. 최소 `@smoke` required check 적용 전략 결정
- 완료 기준
  - PR에서 자동 실행
  - 실패 시 trace/screenshot/report로 원인 분석 가능
