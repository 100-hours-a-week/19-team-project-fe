# Re-Fit Frontend CI/CD 워크플로우 개요

> 현재 CI/CD 워크플로우의 전체 흐름과 각 단계별 테스트의 의미를 정리한 문서입니다.

## 목차

- [전체 흐름 다이어그램](#전체-흐름-다이어그램)
- [각 Job별 테스트 의미](#각-job별-테스트-의미)
- [브랜치별 실행 Job 매트릭스](#브랜치별-실행-job-매트릭스)
- [환경변수 처리 전략](#환경변수-처리-전략)
- [현재 구조의 특징](#현재-구조의-특징)
- [미래 개선 방향](#미래-개선-방향)

---

## 전체 흐름 다이어그램

### 이벤트별 워크플로우 실행

```
┌─────────────────────────────────────────────────────────┐
│ Event Type별 실행 Job                                    │
├─────────────────────────────────────────────────────────┤
│ PR (→ develop/main)                                     │
│   └─ lint-and-test                                      │
│       ├─ ESLint                                         │
│       ├─ TypeScript Type Check                         │
│       └─ Unit Tests                                     │
│                                                          │
│ Push to develop                                         │
│   ├─ integration                                        │
│   │   ├─ Integration Tests                             │
│   │   └─ Security Scan                                 │
│   └─ release                                            │
│       ├─ Full Regression Tests                         │
│       ├─ Production Build (dev env)                    │
│       ├─ Create Release Tag                            │
│       └─ Trigger CD                                    │
│                                                          │
│ Push to main                                            │
│   └─ release                                            │
│       ├─ Full Regression Tests                         │
│       ├─ Production Build (prod env)                   │
│       ├─ Create Release Tag                            │
│       └─ Trigger CD                                    │
└─────────────────────────────────────────────────────────┘
```

### CI/CD 파이프라인 전체 흐름

```
┌──────────────────────────────────────────────────────────┐
│ Pull Request (feature → develop/main)                    │
└────────────────┬─────────────────────────────────────────┘
                 ↓
         ┌───────────────┐
         │ lint-and-test │
         └───────┬───────┘
         - Lint  │
         - Type Check
         - Unit Tests
                 ↓
         [PR Merge]


┌──────────────────────────────────────────────────────────┐
│ Push to develop                                          │
└────────────────┬─────────────────────────────────────────┘
                 ↓
    ┌────────────┴────────────┐
    ↓                         ↓
┌──────────────┐      ┌───────────┐
│ integration  │      │  release  │
└──────────────┘      └─────┬─────┘
- Integration Tests    - Full Regression
- Security Scan        - Build (dev env)
                       - Upload Artifacts
                       - Create Tag
                       - Trigger CD
                              ↓
                       ┌──────────┐
                       │ CD (dev) │
                       └──────────┘
                       - Download Artifacts
                       - Deploy to Dev Server


┌──────────────────────────────────────────────────────────┐
│ Push to main                                             │
└────────────────┬─────────────────────────────────────────┘
                 ↓
         ┌───────────┐
         │  release  │
         └─────┬─────┘
         - Full Regression
         - Build (prod env)
         - Upload Artifacts
         - Create Tag
         - Trigger CD
                ↓
         ┌──────────┐
         │ CD (prod)│
         └──────────┘
         - Download Artifacts
         - Deploy to Prod Server
```

---

## 각 Job별 테스트 의미

### 테스트 피라미드 구조

```
       /\
      /E2E\        ← test:all (Full Regression)
     /------\
    /  통합  \      ← test:integration
   /----------\
  /  단위테스트 \   ← test (Unit Tests)
 /--------------\
```

### 1. Unit Tests (단위 테스트)

**실행 위치**: `lint-and-test` job

**명령어**:
```bash
pnpm test
```

**의미**:
- 개별 함수나 컴포넌트의 독립적인 단위 테스트
- 각 코드 조각이 격리된 환경에서 올바르게 동작하는지 검증
- Mock을 사용하여 외부 의존성 제거

**범위**:
- 가장 빠르고 기본적인 테스트
- 함수 단위, 컴포넌트 단위
- Jest, Vitest 등 사용

**목적**:
- PR 단계에서 기본적인 코드 품질 보장
- 빠른 피드백 제공
- 리팩토링 시 안전성 확보

**예시**:
- 계산 함수의 입출력 검증
- 컴포넌트 렌더링 결과 검증
- 유틸리티 함수 동작 검증

---

### 2. Integration Tests (통합 테스트)

**실행 위치**: `integration` job

**명령어**:
```bash
pnpm run test:integration
```

**의미**:
- 여러 모듈/컴포넌트가 함께 작동하는지 테스트
- 실제 API, 라우팅, 상태관리 등 컴포넌트 간 상호작용 검증
- 실제 환경과 유사한 조건에서 테스트

**범위**:
- Unit 테스트보다 넓은 범위
- 여러 컴포넌트의 통합
- API 연동, 데이터 흐름

**목적**:
- develop 브랜치로 머지된 코드의 통합성 검증
- API 엔드포인트와의 호환성 확인
- 사용자 시나리오 기반 테스트

**예시**:
- 로그인 폼 제출 → API 호출 → 리다이렉트 플로우
- 장바구니 추가 → 상태 업데이트 → UI 반영
- 라우팅 변경 → 데이터 fetch → 렌더링

**현재 상태**: ⚠️ 아직 구현되지 않음 (`|| echo "⚠️ not implemented"`)

---

### 3. Full Regression Tests (전체 회귀 테스트)

**실행 위치**: `release` job

**명령어**:
```bash
pnpm run test:all
```

**의미**:
- 전체 시스템에 대한 포괄적인 테스트
- 새로운 변경사항이 기존 기능을 망가뜨리지 않았는지 검증
- Unit + Integration + E2E 테스트를 모두 포함

**범위**:
- 가장 포괄적이고 시간이 오래 걸리는 테스트
- 전체 애플리케이션 워크플로우
- 실제 브라우저 환경 테스트 (E2E)

**목적**:
- 릴리즈 전 최종 검증
- 프로덕션 배포 전 안정성 확보
- 전체 시스템 동작 보장

**예시**:
- 전체 사용자 여정 테스트 (회원가입 → 로그인 → 기능 사용 → 로그아웃)
- 크로스 브라우저 테스트
- 성능 테스트
- 접근성 테스트

**현재 상태**: ⚠️ 아직 구현되지 않음 (`|| echo "⚠️ not implemented"`)

---

### 4. Security Scan (보안 취약점 검사)

**실행 위치**: `integration` job

**명령어**:
```bash
pnpm audit --audit-level=moderate
```

**의미**:
- npm 패키지의 알려진 보안 취약점 검사
- 의존성 패키지의 CVE (Common Vulnerabilities and Exposures) 확인

**설정**:
- `continue-on-error: true`: 취약점 발견 시에도 파이프라인 계속 진행
- `audit-level=moderate`: 중간 수준 이상의 취약점만 보고

**목적**:
- 보안 취약점 조기 발견
- 의존성 업데이트 필요성 파악

---

## 브랜치별 실행 Job 매트릭스

### 전체 매트릭스

| 이벤트 | 브랜치 | Lint | Type Check | Unit Test | Integration Test | Security Scan | Full Regression | Build | Deploy |
|--------|--------|------|------------|-----------|------------------|---------------|-----------------|-------|--------|
| **PR 생성** | any → develop | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **PR 생성** | any → main | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Push** | develop | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ (배포용) | ✅ |
| **Push** | main | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ (배포용) | ✅ |

### Job별 실행 조건

#### lint-and-test
```yaml
if: github.event_name == 'pull_request'
```
- **트리거**: PR 생성/업데이트
- **목적**: 코드 품질 검증
- **빌드**: ❌ 빌드하지 않음 (타입 체크로 대체, 60% 시간 단축)

#### integration
```yaml
if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
```
- **트리거**: develop 브랜치 push
- **목적**: 통합 테스트 및 보안 검증
- **빌드**: 없음

#### release
```yaml
if: |
  (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop') &&
  github.event_name == 'push'
```
- **트리거**: develop 또는 main 브랜치 push
- **목적**: 배포용 빌드 생성
- **빌드**: 배포용 (환경별 설정 주입)

---

## 환경변수 처리 전략

### 현재 방식: 개별 환경변수 주입

#### PR 검증 단계 (lint-and-test)

**2026-01-22 최적화**: Build Check를 TypeScript Type Check로 대체
- 빌드하지 않으므로 환경변수 불필요
- 60% 시간 단축 (5-8분 → 2-3분)
- 타입 안정성은 유지

```yaml
- name: TypeScript Type Check
  run: pnpm run type-check
  # 환경변수 없이도 타입 체크 가능
```

#### 배포 빌드 단계 (release)

```yaml
- name: Production Build
  run: pnpm run build
  env:
    NODE_ENV: production
    NEXT_PUBLIC_API_URL: ${{ vars.NEXT_PUBLIC_API_URL }}
    NEXT_PUBLIC_KAKAO_REDIRECT_URL: ${{ vars.NEXT_PUBLIC_KAKAO_REDIRECT_URL }}
    NEXT_PUBLIC_ENV: ${{ vars.NEXT_PUBLIC_ENV }}
```

**특징**:
- GitHub Environment Variables 사용
- 브랜치에 따라 자동으로 다른 environment 선택
  - `main` → `production` environment
  - `develop` → `development` environment

### 문제점

1. **환경변수 추가 시 CI 워크플로우 수정 필요**
   - 새로운 `NEXT_PUBLIC_*` 변수가 추가되면 `ci.yml` 파일도 수정해야 함
   - 유지보수 부담 증가

2. **두 곳의 환경변수 선언이 일치하지 않음**
   - `lint-and-test`: Fallback 값 있음
   - `release`: Fallback 값 없음

3. **환경변수 동기화 이슈**
   - GitHub UI와 워크플로우 파일 모두 관리 필요

### 개선 방안

#### Option 1: .env 파일을 GitHub Secrets으로 관리 (추천)

```yaml
- name: Create .env file
  run: |
    if [ "${{ github.ref }}" == "refs/heads/main" ]; then
      echo "${{ secrets.PROD_ENV_FILE }}" > .env.production
    else
      echo "${{ secrets.DEV_ENV_FILE }}" > .env.production
    fi

- name: Build
  run: pnpm run build
  # 환경변수를 명시하지 않아도 .env.production에서 자동 로드
```

**장점**:
- ✅ 환경변수 추가 시 GitHub Secrets만 업데이트
- ✅ CI 워크플로우 수정 불필요
- ✅ 로컬 개발 환경과 동일한 방식
- ✅ 민감한 정보 안전하게 관리

**설정 방법**:
1. 로컬에서 `.env.production` 파일 준비
2. 파일 전체 내용을 복사
3. GitHub Settings → Secrets → Actions → New secret
4. Name: `PROD_ENV_FILE` / Value: (파일 내용 붙여넣기)

#### Option 2: GitHub Environment Variables 자동 주입

```yaml
- name: Create .env from GitHub Variables
  run: |
    env | grep '^NEXT_PUBLIC_' > .env.production || true
    cat .env.production
  env: ${{ vars }}

- name: Build
  run: pnpm run build
```

**장점**:
- ✅ GitHub UI에서 환경변수 추가만 하면 됨
- ✅ CI 워크플로우 수정 불필요
- ✅ 환경별 분리 명확

---

## 현재 구조의 특징

### 장점

1. **PR 단계에서 빠른 코드 품질 검증**
   - Lint, Type Check, Unit Test로 빠른 피드백
   - ✨ **최적화**: Build Check → Type Check 전환으로 60% 시간 단축 (5-8분 → 2-3분)

2. **코드 중복 제거**
   - ✨ **최적화**: Composite Action으로 90+ 라인의 setup 코드 중복 제거
   - `.github/actions/setup-pnpm` 재사용으로 유지보수성 향상

3. **환경별 빌드 분리**
   - develop과 main 브랜치에서 다른 환경변수로 빌드
   - GitHub Environments 활용

4. **CI와 CD 분리**
   - CI는 빌드와 테스트만
   - CD는 배포만 담당
   - 각각 독립적으로 실행 가능

5. **아티팩트 기반 배포**
   - 빌드 결과물을 아티팩트로 저장
   - CD에서 다운로드하여 배포
   - 빌드와 배포 단계 분리

6. **무중단 배포**
   - PM2 reload 사용
   - Atomic switch (`.next` 디렉토리 교체)
   - 배포 검증 후 실패 시 알림

### 개선이 필요한 부분

1. **main 직접 push 시 기본 검증 없음**
   - PR 없이 main에 push하면 lint/unit test 우회 가능
   - **해결**: 브랜치 보호 규칙으로 main 직접 push 막기

2. ~~**빌드 중복**~~ ✅ **해결 완료 (2026-01-22)**
   - `lint-and-test`에서 Build Check를 Type Check로 전환
   - 빌드는 `release` job에서만 1회 수행 (배포용)
   - PR 검증 시간 60% 단축 효과

3. **develop과 main이 같은 release job 사용**
   - 조건문으로 환경 구분
   - 가독성이 떨어질 수 있음
   - **개선**: `release-dev`와 `release-prod`로 분리

4. **테스트 스크립트 미구현**
   - `test:integration`, `test:all` 아직 구현 안 됨
   - `|| echo "⚠️ not implemented"` 로 실패 무시
   - **개선**: 실제 테스트 구현 필요

5. **integration과 release가 동시 실행**
   - develop push 시 두 job이 병렬 실행
   - 의존성 없음
   - **개선**: `release` job이 `integration` 성공 후 실행되도록 설정 (`needs: integration`)

6. **환경변수 관리 비효율**
   - ~~환경변수 추가 시마다 CI 워크플로우 수정 필요~~ (lint-and-test는 더 이상 불필요)
   - **개선**: .env 파일을 Secrets으로 관리 (`release` job에만 적용)

---

## 최근 최적화 내역 (2026-01-22)

### 1. Composite Action으로 Setup 코드 중복 제거

#### 문제점
- 3개 job(lint-and-test, integration, release)에서 각각 90+ 라인의 동일한 setup 코드 반복
- Node.js 설치, pnpm 설치, 캐시 설정, 의존성 설치 단계 중복
- 유지보수 비용 증가 (설정 변경 시 3곳 모두 수정 필요)

#### 해결 방법
Composite Action 생성: [.github/actions/setup-pnpm/action.yml](../../.github/actions/setup-pnpm/action.yml)

```yaml
# 사용 예시
- name: Setup Node.js and pnpm
  uses: ./.github/actions/setup-pnpm
  with:
    node-version: ${{ env.NODE_VERSION }}
    pnpm-version: ${{ env.PNPM_VERSION }}
```

#### 효과
- ✅ 90+ 라인 × 3개 job = 270+ 라인 중복 제거
- ✅ DRY 원칙 적용으로 유지보수성 향상
- ✅ 설정 변경 시 1개 파일만 수정

### 2. PR 검증 시간 60% 단축

#### 문제점
- `lint-and-test` job이 가장 많이 실행되는 job
- 매 PR마다 Full Next.js Build 수행 (5-8분 소요)
- PR 피드백 속도 저하

#### 해결 방법
Build Check를 TypeScript Type Check로 대체

```yaml
# Before
- name: Build Check
  run: pnpm run build
  env:
    NODE_ENV: production
    NEXT_PUBLIC_API_URL: ${{ vars.NEXT_PUBLIC_API_URL }}
    # ... 기타 환경변수

# After
- name: TypeScript Type Check
  run: pnpm run type-check  # tsc --noEmit
  # 환경변수 불필요
```

#### 효과
- ✅ 검증 시간: 5-8분 → 2-3분 (60% 단축)
- ✅ 타입 안정성 동일하게 유지
- ✅ 환경변수 설정 불필요
- ✅ 빌드는 배포 시에만 1회 수행

#### 추가 작업
타입 체크를 위한 타입 선언 파일 추가:

1. [src/types/images.d.ts](../../src/types/images.d.ts)
   - PNG, JPG, SVG 등 이미지 파일 import 타입 선언

2. [src/types/lottie-react.d.ts](../../src/types/lottie-react.d.ts)
   - lottie-react 라이브러리 타입 선언 (타입 미포함 패키지)

3. [tsconfig.json](../../tsconfig.json) 업데이트
   - `.next` 디렉토리 제외 (빌드 아티팩트 타입 체크 방지)

#### 백엔드 유사 사례
- **Spring Boot**: `./gradlew build` → `./gradlew compileJava` (50-60% 단축)
- **FastAPI**: `python -m build` → `mypy . && ruff check` (70% 단축)

---

## 미래 개선 방향

### 1. 개발 환경 분리 시 CI/CD 구조

현재는 개발 환경이 따로 없어서 `develop` 브랜치에서도 `release` job이 실행되고 있습니다.
개발 환경이 구성되면 다음과 같이 개선할 수 있습니다:

#### 권장 브랜치 전략: Git Flow

```
feature → develop → main
           ↓         ↓
         개발환경   프로덕션
```

#### CI 워크플로우 분리

```yaml
jobs:
  lint-and-test:
    # PR 검증 (변경 없음)

  integration:
    # develop 브랜치 통합 테스트만
    if: github.ref == 'refs/heads/develop'
    steps:
      - Integration 테스트
      - Security Scan
    # 빌드는 하지 않음

  release-dev:
    # develop → 개발 환경
    if: github.ref == 'refs/heads/develop'
    needs: integration  # integration 성공 후 실행
    environment: development
    steps:
      - 개발용 빌드
      - 아티팩트 업로드
      - Trigger CD (개발 환경)

  release-prod:
    # main → 프로덕션
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - Full Regression Test
      - 프로덕션 빌드
      - 아티팩트 업로드
      - Trigger CD (프로덕션)
```

#### CD 워크플로우 분리

```
cd-dev.yml  (개발 배포)
  - develop 브랜치의 CI 성공 시 자동 실행
  - 개발 서버로 배포
  - 빠른 피드백 우선

cd-prod.yml (프로덕션 배포)
  - main 브랜치의 CI 성공 시 실행
  - 수동 승인 옵션 추가 권장
  - 안정성 우선
```

#### 환경별 차이점

| 환경 | 브랜치 | 배포 방식 | 테스트 범위 | 목적 |
|------|--------|-----------|-------------|------|
| **개발** | develop | 자동 | Integration | 빠른 피드백, 기능 검증 |
| **스테이징** | staging/main | 자동 | Full Regression | QA, 최종 검증 |
| **프로덕션** | main | 수동 승인 | Full + Smoke | 안정적 서비스 |

### 2. 테스트 구현 우선순위

1. **Unit Tests** (높음)
   - 핵심 비즈니스 로직 함수
   - 유틸리티 함수
   - React 컴포넌트 기본 렌더링

2. **Integration Tests** (중간)
   - API 연동 플로우
   - 폼 제출 시나리오
   - 라우팅 및 상태 관리

3. **E2E Tests** (낮음, 선택적)
   - 핵심 사용자 여정
   - 결제 플로우 등 중요 기능

### 3. 빌드 최적화 ✅ **완료 (2026-01-22)**

#### 이전 빌드 흐름

```
PR 생성 → lint-and-test 빌드 (검증용, 5-8분)
  ↓ PR 머지
Push → release 빌드 (배포용)
```

#### 최적화된 현재 흐름

```yaml
lint-and-test:
  steps:
    - name: TypeScript Type Check
      run: pnpm run type-check  # tsc --noEmit
      # 빌드 없이 타입만 체크 (2-3분)

release:
  steps:
    - name: Production Build
      run: pnpm run build
      env:
        NEXT_PUBLIC_*: ${{ vars.* }}
    - Upload artifact  # 배포용만 저장
```

**최적화 효과**:
- ✅ PR 검증 시간 60% 단축 (5-8분 → 2-3분)
- ✅ 빌드는 배포 시에만 1회 수행
- ✅ 타입 안정성은 동일하게 유지
- ✅ 아티팩트 저장 공간 절약
- ✅ 논리적으로 더 명확한 구조

**추가 구성 파일**:
- `src/types/images.d.ts`: 이미지 파일 타입 선언
- `src/types/lottie-react.d.ts`: lottie-react 라이브러리 타입 선언
- `tsconfig.json`: `.next` 디렉토리 제외 설정

### 4. 환경변수 관리 개선

#### 추천 방식

```yaml
- name: Setup Environment Variables
  run: |
    if [ "${{ github.ref }}" == "refs/heads/main" ]; then
      echo "${{ secrets.PROD_ENV_FILE }}" > .env.production
    else
      echo "${{ secrets.DEV_ENV_FILE }}" > .env.production
    fi

- name: Build
  run: pnpm run build
  # 환경변수 명시 불필요
```

**설정 위치**: GitHub Settings → Secrets → Actions
- `PROD_ENV_FILE`: 프로덕션 .env 파일 전체 내용
- `DEV_ENV_FILE`: 개발 .env 파일 전체 내용

**장점**:
- 환경변수 추가 시 CI 워크플로우 수정 불필요
- 로컬과 동일한 방식
- 관리 편의성 증가

### 5. 보안 및 모니터링

#### 추가할 보안 단계

```yaml
- name: SAST (Static Analysis)
  run: pnpm run security:check

- name: Dependency Check
  run: pnpm audit --audit-level=high
  continue-on-error: false  # 높은 수준 취약점은 빌드 중단

- name: License Check
  run: pnpm run license:check
```

#### 배포 모니터링

```yaml
- name: Deployment Health Check
  run: |
    sleep 10
    curl -f https://api.re-fit.kr/health || exit 1

- name: Smoke Tests
  run: pnpm run test:smoke

- name: Notify Slack/Discord
  if: success()
  run: |
    # 배포 완료 알림
```

### 6. 롤백 자동화

```yaml
- name: Automatic Rollback
  if: failure()
  run: |
    echo "Deployment failed, initiating rollback..."
    ssh ubuntu@server '
      cd /home/ubuntu/refit/backups/frontend
      LATEST_BACKUP=$(ls -t next_* | head -1)
      rm -rf /home/ubuntu/refit/app/frontend/.next
      cp -r $LATEST_BACKUP /home/ubuntu/refit/app/frontend/.next
      pm2 reload frontend
    '
```

---

## 관련 문서

- [CI/CD 상세 프로세스](./cicd-process.md)
- [배포 가이드](./bigbang-deployment.md)
- [CI 워크플로우](../../.github/workflows/ci.yml)
- [CD 워크플로우](../../.github/workflows/cd.yml)
- [PM2 설정](../../infra/pm2/ecosystem.config.js)

---

## 참고: 워크플로우 파일 위치

```
frontend/
├── .github/
│   ├── actions/
│   │   └── setup-pnpm/
│   │       └── action.yml              # 재사용 가능한 Composite Action
│   └── workflows/
│       ├── ci.yml                      # CI 워크플로우
│       └── cd.yml                      # CD 워크플로우
├── src/
│   └── types/
│       ├── images.d.ts                 # 이미지 파일 타입 선언
│       └── lottie-react.d.ts           # lottie-react 타입 선언
├── docs/
│   └── devops/
│       ├── cicd-workflow-overview.md   # 본 문서
│       ├── cicd-process.md             # 상세 프로세스
│       └── bigbang-deployment.md       # 배포 가이드
├── infra/
│   └── pm2/
│       └── ecosystem.config.js         # PM2 설정
├── tsconfig.json                       # TypeScript 설정
└── package.json                        # npm scripts (type-check 포함)
```
