# E2E 운영 가이드

이 문서는 RE-FIT 프론트엔드 E2E 테스트의 작성/실행/디버깅/운영 기준을 정의한다.

## 1) 실행 환경

- Node: `20` (`.nvmrc` 기준)
- Package manager: `pnpm`
- E2E 도구: `Playwright` (`@playwright/test`)

로컬 실행 전 권장:

```bash
nvm use 20
pnpm install
```

## 2) 기본 명령어

- 전체 실행: `pnpm test:e2e`
- 스모크만: `pnpm test:e2e:smoke`
- 크리티컬만: `pnpm test:e2e:critical`
- 에러만: `pnpm test:e2e:error`
- 목록 확인: `pnpm test:e2e --list`
- UI 모드: `pnpm test:e2e:ui`
- 헤디드 실행: `pnpm test:e2e:headed`
- 디버그 모드: `pnpm test:e2e:debug`
- 리포트 열기: `pnpm test:e2e:report`
- 성공 케이스 trace/video 상시 수집(UI 포함): `PW_CAPTURE_ALL=1 pnpm test:e2e:ui`

## 3) 테스트 분류 규칙

- `@smoke`
  - 핵심 진입/기본 동작 확인
  - 빠르고 안정적인 최소 회귀 세트
- `@critical`
  - 사용자 핵심 시나리오(상호작용 + 상태 전이)
- `@error`
  - 실패 응답/예외/경계 케이스

권장 원칙:

- 신규 기능에는 최소 `@critical` 1개 + 필요시 `@error` 1개를 추가한다.
- `@smoke`는 매우 안정적인 케이스만 유지한다.

## 4) 폴더/파일 규칙

- 테스트: `tests/e2e/{smoke,critical,error}`
- fixture: `tests/e2e/fixtures`
- mock 유틸: `tests/e2e/mocks`

네이밍 규칙:

- 테스트 파일: `<domain>-<scenario>.spec.ts`
- mock helper: `mock<Domain><Action><Result>`
  - 예: `mockRestoreAccountSuccess`, `mockRestoreAccountBusinessError`

## 5) Mock 작성 규칙

공통 원칙:

- 실제 백엔드 의존 없이 테스트가 재현되어야 한다.
- 한 테스트는 한 상태를 명확히 만들고, 다른 테스트와 상태를 공유하지 않는다.
- mock 응답은 UI 검증 목적에 맞게 최소 필드만 포함한다.

권장 패턴:

- 성공/빈 데이터/에러를 명시적으로 분리
  - `success`
  - `empty`
  - `businessError` 또는 `httpError`

오류 시나리오 주의:

- 일부 에러는 공통 핸들러에서 토스트/리다이렉트로 소비된다.
- DOM 본문 문구를 검증하려면 해당 소비 흐름을 피하는 응답 타입을 사용한다.

## 6) Fixture 사용 규칙

- 테스트는 `@playwright/test` 대신 `tests/e2e/fixtures/e2e`의 `test`, `expect`를 사용한다.
- API 상태는 `apiMocks`를 통해 설정한다.
- spec 내부에서 중복 route 설정이 필요하면, 공용 mock helper로 승격한다.

## 7) Flaky 방지 규칙

금지:

- `waitForTimeout` 기반 고정 대기
- 테스트 간 상태 공유(스토리지, 쿠키, 전역 변수)

권장:

- 상태 기반 대기
  - `expect(...).toBeVisible()`
  - `expect(page).toHaveURL(...)`
- 사용자 관점 selector 사용
  - `getByRole`, `getByText` 우선
  - 동일 텍스트가 반복되면 `exact: true` 또는 scope locator를 기본 적용
- assertion은 결과뿐 아니라 핵심 입력(payload)도 검증

## 8) CI 운영 규칙

현재 CI 반영 내용:

- `.github/workflows/ci.yml`의 `e2e` job에서 Playwright 실행
- 실행 스코프 정책
  - PR: `@smoke`만 실행 (`pnpm test:e2e:smoke`)
  - push(`develop`/`main`): 전체 실행 (`pnpm test:e2e`)
  - workflow_dispatch: `e2e_scope(smoke|full)` 선택 실행
- 결과물 업로드
  - `playwright-report/`
  - `test-results/`

중요 제약:

- CI 트리거에 `paths-ignore: '.github/workflows/**'`가 있어
  워크플로우 파일만 수정한 커밋은 자동 실행 제외될 수 있다.
- 이 경우 `workflow_dispatch -> job_to_run: e2e`로 수동 실행한다.

## 9) 디버깅 절차

1. 테스트 목록 먼저 확인

```bash
pnpm test:e2e --list
```

2. 단일 파일/단일 테스트로 축소 실행

```bash
pnpm exec playwright test tests/e2e/critical/login-ui.spec.ts
```

3. 디버그 모드로 단계 확인

```bash
pnpm test:e2e:debug
```

4. 리포트 확인

```bash
pnpm test:e2e:report
```

5. CI 실패 시 artifact 확인

- `playwright-report-*`
- `test-results-*`

## 10) Required Check 적용 권장

운영 권장안:

- 1차: E2E 전체 job을 PR required check로 지정
- 2차(필요 시): smoke 전용 job 분리 후 required, 전체 E2E는 병렬 운영

적용 절차(수동 설정):

1. GitHub Repository Settings
2. Branches > Branch protection rules
3. `develop`/`main` 규칙에서 required status checks에 `e2e` 추가

## 11) 문서 운영 규칙

- 모든 단계 작업은 `docs/e2e/logs/step-XX-*.md`에 기록한다.
- 각 로그는 아래 섹션을 반드시 포함한다.
  - 이슈 및 대응
  - 트러블슈팅 타임라인
  - 고충/의사결정 메모
- 반복 문제는 `docs/e2e/troubleshooting.md` 인덱스에 축약 등록한다.
