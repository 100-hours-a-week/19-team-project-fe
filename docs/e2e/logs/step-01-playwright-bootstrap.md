# Step 01 - Playwright 기본 세팅 + smoke 테스트

## 1) 배경 및 목표

### 배경
- 프로젝트에 E2E 실행 도구가 없어서, 사용자 핵심 동선을 PR 단계에서 자동 검증할 수 없는 상태였다.
- 백엔드 상태/네트워크 상태에 따라 결과가 흔들릴 수 있어, 이후 단계에서 목킹 기반 구조가 필요하다.
- 따라서 1단계는 "테스트 실행 기반"을 만드는 작업으로 정의했다.

### 목표
- Playwright를 프로젝트에 추가한다.
- E2E 실행 스크립트를 표준화한다.
- smoke 테스트 1개를 작성해 실제 실행이 되는지 검증한다.
- 실패 분석을 위한 report/trace/screenshot 정책을 기본값으로 설정한다.

## 2) 범위

### 포함
- `@playwright/test` 설치
- `playwright.config.ts` 신설
- `tests/e2e/smoke/login.spec.ts` 신설
- `package.json` E2E 스크립트 추가
- `.gitignore`에 Playwright 결과물 경로 추가

### 제외
- API 목킹 유틸 설계/구현
- CI 워크플로우 연동
- 다중 브라우저 프로젝트 구성
- 테스트 데이터 fixture 구조화

## 3) 수행 작업 (시간 순서)

1. 현재 프로젝트 상태 확인
- `package.json`에 E2E 관련 스크립트/의존성 부재 확인
- 앱 라우트 구조 확인 (`src/app/login/page.tsx` 기반 smoke 대상 선정)

2. 의존성 설치
- 최초 설치 시 네트워크/스토어 이슈 발생
  - `ERR_PNPM_META_FETCH_FAIL` (registry 접근 실패)
  - `ERR_PNPM_UNEXPECTED_STORE` (store 경로 불일치)
- 기존 스토어 경로를 지정해 재실행하여 설치 성공

3. Playwright 설정 파일 작성
- 테스트 루트: `tests/e2e`
- CI 안정성 옵션 적용
  - `forbidOnly: !!process.env.CI`
  - `retries: CI=2`
  - `workers: CI=1`
- 결과 수집 옵션 적용
  - `trace: on-first-retry`
  - `screenshot: only-on-failure`
  - `video: retain-on-failure`
- 로컬 서버 자동 기동
  - `webServer.command: pnpm dev --port 3100`
  - `baseURL: http://127.0.0.1:3100`

4. smoke 테스트 작성
- `/login` 진입 후 핵심 CTA 노출 확인
  - 안내 문구 노출 확인
  - `카카오로 로그인` 링크 노출 확인

5. 실행 스크립트 표준화
- `test:e2e`
- `test:e2e:ui`
- `test:e2e:headed`
- `test:e2e:debug`
- `test:e2e:report`

6. 실행 검증
- 목록 확인: `pnpm test:e2e --list` 성공
- 실제 실행은 2가지 이슈 처리 후 성공
  - Node 버전 이슈: Node 18 -> Node 20으로 전환 후 해결
  - 샌드박스 포트 바인딩 이슈(EPERM): 권한 상승 실행으로 검증 완료

## 4) 변경 파일 상세

### 4.1 `package.json`
- devDependency 추가
  - `@playwright/test: ^1.58.2`
- scripts 추가
  - `test:e2e`
  - `test:e2e:ui`
  - `test:e2e:headed`
  - `test:e2e:debug`
  - `test:e2e:report`

### 4.2 `playwright.config.ts` (신규)
- 공통 실행 정책과 CI 정책 분리
- `chromium` 프로젝트 1개 구성
- 로컬 dev server 자동 기동 설정 포함

### 4.3 `tests/e2e/smoke/login.spec.ts` (신규)
- `@smoke` 태그 적용
- 로그인 페이지 렌더링 안정성 검증 1건 추가

### 4.4 `.gitignore`
- Playwright 출력물 무시
  - `/playwright-report/`
  - `/test-results/`

### 4.5 `pnpm-lock.yaml`
- Playwright 관련 lockfile 변경 반영

## 5) 실행 명령어와 결과

1. 의존성 설치
```bash
pnpm add -D @playwright/test --store-dir /Users/junseopark/Library/pnpm/store/v10
```
- 결과: 성공

2. 테스트 목록 확인
```bash
pnpm test:e2e --list
```
- 결과: `1 test in 1 file` 확인

3. 테스트 실행(최종 성공 케이스)
```bash
nvm use 20
pnpm test:e2e
```
- 결과: `1 passed`

## 6) 이슈 및 대응

### 이슈 A: Node 버전 불일치
- 현상: Next.js 16 실행 시 Node 18에서 서버 시작 실패
- 원인: 프로젝트 엔진 조건 `>=20.19.0`
- 대응: `.nvmrc` 값(`20`) 사용, Node 20 환경에서 실행

### 이슈 B: 포트 바인딩 권한 이슈
- 현상: 샌드박스 환경에서 `listen EPERM 0.0.0.0:3100`
- 대응: 권한 상승으로 재실행하여 정상 검증
- 비고: 일반 로컬 환경에서는 재현되지 않을 수 있음

### 이슈 C: Next dev 경고
- 현상: `allowedDevOrigins` 관련 경고
- 영향: 테스트 실패 원인은 아님
- 처리: Step 01 범위 밖, Step 04 이후 필요 시 정리

## 7) 트러블슈팅 타임라인

1. 증상: `pnpm add -D @playwright/test` 실패
- 에러: `ERR_PNPM_META_FETCH_FAIL`, `ERR_PNPM_UNEXPECTED_STORE`
- 판단: 네트워크/스토어 경로 이슈가 동시에 발생

2. 확인한 가설
- 가설 A: npm registry 일시 접근 실패
- 가설 B: 기존 `node_modules`와 다른 pnpm store 경로 충돌

3. 시도한 조치
- 조치 A: 동일 명령 재시도 -> 동일 실패
- 조치 B: store 경로를 기존 경로로 명시해서 재실행
  - `pnpm add -D @playwright/test --store-dir /Users/junseopark/Library/pnpm/store/v10`

4. 최종 원인
- 설치 실패의 직접 원인은 pnpm store 경로 불일치(`ERR_PNPM_UNEXPECTED_STORE`)
- 네트워크 에러는 최초 시도에서 동반된 환경성 이슈

5. 최종 해결
- store 경로를 명시한 설치 명령으로 정상 설치
- 이후 테스트 실행 시 Node 20 환경 전환(`nvm use 20`)을 표준 절차로 고정

## 8) 고충/의사결정 메모
- 당시 가장 헷갈렸던 지점: 네트워크 에러와 store 에러가 동시에 떠서 1차 원인 분리가 어려웠다.
- 버린 접근: 단순 재시도만 반복하는 방식.
- 채택한 접근: 설치 경로/런타임 조건을 먼저 고정하고 재시도.
- 다음 단계에서 같은 문제를 피하는 방법: 모든 E2E 실행 문서에 `nvm use 20`과 pnpm store 주의사항을 선행 명시.

## 9) 검증 체크리스트
- [x] `@playwright/test` 설치 완료
- [x] Playwright 설정 파일 추가 완료
- [x] smoke 테스트 1개 작성 완료
- [x] `pnpm test:e2e --list` 통과
- [x] `pnpm test:e2e` 실실행 통과
- [x] 결과물 경로 `.gitignore` 등록

## 10) 다음 단계 인수인계 (Step 02)
- 목표: mock/fixture 레이어 구축
- 해야 할 일
  1. `tests/e2e/mocks` 구조 설계
  2. 공통 라우트 인터셉트 유틸 작성
  3. 엔드포인트별 `success/empty/error` 응답 builder 작성
  4. "mock 누락 시 즉시 실패" 정책 도입
- 완료 기준
  - 백엔드 의존 없이 smoke/critical 시나리오 실행 가능
  - 테스트 간 데이터/상태 독립성 보장
