# Re-Fit Frontend CI/CD 전체 프로세스

## 개요

Re-Fit 프론트엔드는 GitHub Actions를 통해 완전 자동화된 CI/CD 파이프라인을 운영합니다.

- **CI (Continuous Integration)**: [ci.yml](../../.github/workflows/ci.yml)
- **CD (Continuous Deployment)**: [cd.yml](../../.github/workflows/cd.yml)

## 아키텍처 개요

> ⚠️ **임시 조치**: 현재 개발 단계에서 빠른 검증을 위해 `develop` 브랜치에도 배포가 진행됩니다.
> 정식 릴리즈 단계에서는 `main` 브랜치만 배포되도록 변경될 예정입니다.

```
┌─────────────────┐
│  Pull Request   │
│   to develop    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CI: lint-and-  │
│      test       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Merge to       │
│   develop       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ CI: integration │
│  + release      │ ← 🚀 개발 단계 임시: 빌드 아티팩트 생성
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CD: deploy     │
│  (자동 배포)      │ ← 🚀 개발 단계 임시: develop도 배포
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Merge to main  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CI: release    │
│  (build + tag)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CD: deploy     │
│  (자동 배포)     │
└─────────────────┘
```

---

## 환경 변수 관리 전략

### GitHub Environments를 통한 환경별 관리

Re-Fit 프론트엔드는 **GitHub Environments**를 사용하여 환경별로 다른 설정을 관리합니다.

**환경 구성:**
- `production`: main 브랜치 배포 시 사용
- `development`: develop 브랜치 배포 시 사용

**장점:**
- ✅ 환경별 변수 및 시크릿 분리 관리
- ✅ 빌드와 배포 환경의 일관성 보장
- ✅ 환경 변수가 빌드 아티팩트에 포함되어 서버 설정 불필요
- ✅ 팀원 간 환경 변수 동기화 자동화
- ✅ Production 환경에 대한 승인 규칙 설정 가능

### 빌드 시점 환경 변수 주입 (Build-time Injection)

**주입되는 환경 변수:**
- `NEXT_PUBLIC_API_URL`: API 서버 엔드포인트
- `NEXT_PUBLIC_KAKAO_REDIRECT_URL`: 카카오 OAuth 리다이렉트 URL
- `NEXT_PUBLIC_ENV`: 환경 구분 (production/development)

**동작 방식:**

#### 1. PR 검증 단계 (`lint-and-test`)
- ❌ Environment 사용 안 함
- Repository-level Variables 또는 fallback 값 사용
- 목적: 빌드 가능 여부만 확인

#### 2. 배포 빌드 단계 (`release`)
- ✅ Environment 사용
- 브랜치에 따라 environment 자동 결정:
  - `main` 브랜치 → `production` environment
  - `develop` 브랜치 → `development` environment
- 해당 environment의 Variables를 사용하여 빌드
- 빌드 아티팩트에 환경 변수가 포함됨

#### 3. 배포 단계 (`deploy`)
- ✅ CI와 동일한 environment 사용
- `github.event.workflow_run.head_branch`로 브랜치 판단
- 환경별로 동일한 설정으로 배포 수행

**Note**: `NEXT_PUBLIC_*` 변수는 Next.js 빌드 시점에 번들에 포함되므로, 런타임에 `.env.production` 파일을 수정해도 반영되지 않습니다.

---

## CI 파이프라인 (ci.yml)

### 환경 설정

```yaml
NODE_VERSION: 22
PNPM_VERSION: 10
```

### 1단계: PR 검증 (lint-and-test)

**트리거 조건:**
- Pull Request가 `develop` 또는 `main` 브랜치로 열릴 때
- PR이 업데이트될 때 (synchronize, reopened)
- 수동 실행 (workflow_dispatch)

**Environment 설정:**
- ❌ **Environment를 사용하지 않음**
- PR 검증은 빌드 가능 여부만 확인하므로, 기본 fallback 값으로 빌드
- Repository-level Variables가 있으면 사용, 없으면 기본값 사용

**실행 과정:**

1. **환경 준비**
   - Ubuntu latest 환경
   - Node.js 22 설치
   - pnpm 10 설치
   - pnpm store 캐싱 (의존성 설치 속도 향상)

2. **코드 품질 검증**
   ```bash
   pnpm install --frozen-lockfile  # 의존성 설치
   pnpm run lint                   # 코드 린팅
   pnpm test                       # 단위 테스트
   ```

3. **빌드 검증 (fallback 환경 변수)**
   ```bash
   NODE_ENV=production \
   NEXT_PUBLIC_API_URL=${{ vars.NEXT_PUBLIC_API_URL || 'http://localhost:8080' }} \
   NEXT_PUBLIC_KAKAO_REDIRECT_URL=${{ vars.NEXT_PUBLIC_KAKAO_REDIRECT_URL || 'http://localhost:3000/callback.html' }} \
   NEXT_PUBLIC_ENV=development \
   pnpm run build
   ```

   - Environment가 없으므로 repository-level variables 또는 fallback 값 사용
   - 빌드 가능 여부만 검증 (실제 배포용 아티팩트 아님)

4. **결과**
   - 모든 단계 통과 시 ✅ PR 승인 가능
   - 실패 시 ❌ 머지 불가

---

### 2단계: 통합 검증 (integration)

**트리거 조건:**
- `develop` 브랜치에 push될 때
- 수동 실행 (workflow_dispatch)

**실행 과정:**

1. **환경 준비** (1단계와 동일)

2. **통합 테스트 및 보안 검증**
   ```bash
   pnpm install --frozen-lockfile
   pnpm run test:integration       # 통합 테스트
   pnpm audit --audit-level=moderate  # 보안 취약점 스캔
   ```

3. **특징**
   - 보안 스캔은 `continue-on-error: true`로 실패해도 파이프라인 진행
   - 통합 테스트 미구현 시 경고 메시지 출력

---

### 3단계: 릴리즈 확정 (release)

> ⚠️ **개발 단계 임시 설정**: 현재는 `develop` 브랜치에도 빌드 아티팩트를 생성하여 빠른 검증이 가능하도록 설정되어 있습니다.

**트리거 조건:**
- `main` 브랜치에 push될 때
- `develop` 브랜치에 push될 때 (🚀 개발 단계 임시)
- 수동 실행 (workflow_dispatch)

**Environment 설정:**
```yaml
environment: ${{ (github.ref == 'refs/heads/main' || github.ref_name == 'main') && 'production' || 'development' }}
```
- `main` 브랜치 → `production` environment
- `develop` 브랜치 → `development` environment
- 각 environment의 Variables 사용

**실행 과정:**

1. **환경 준비**
   - `fetch-depth: 0`: 전체 git 히스토리 가져오기
   - `token: ${{ secrets.PAT }}`: 태그 push 권한

2. **전체 회귀 테스트**
   ```bash
   pnpm install --frozen-lockfile
   pnpm run test:all               # 전체 테스트 스위트
   ```

3. **프로덕션 빌드 (환경별 변수 주입)**
   ```bash
   NODE_ENV=production \
   NEXT_PUBLIC_API_URL=${{ vars.NEXT_PUBLIC_API_URL }} \
   NEXT_PUBLIC_KAKAO_REDIRECT_URL=${{ vars.NEXT_PUBLIC_KAKAO_REDIRECT_URL }} \
   NEXT_PUBLIC_ENV=${{ vars.NEXT_PUBLIC_ENV }} \
   pnpm run build
   ```

   **중요**:
   - GitHub Environment Variables (`vars.*`)에서 환경 변수를 주입
   - 브랜치에 따라 다른 environment의 값이 사용됨
   - 빌드 아티팩트에 환경 변수가 포함됨

4. **빌드 아티팩트 검증 및 업로드**
   ```bash
   # .next 디렉토리 확인
   ls -la .next/
   ```

   **업로드되는 아티팩트:**
   - `next-build-artifact-<commit-sha>`: `.next/` 빌드 결과물
   - `deploy-files-<commit-sha>`: 배포 필수 파일
     - `package.json`
     - `pnpm-lock.yaml`
     - `next.config.mjs`
     - `public/`

   **보관 정책:** 7일간 보관

5. **릴리즈 태그 생성**
   ```bash
   TAG_NAME="v$(date +'%Y.%m.%d')-${GITHUB_SHA::7}"
   git tag $TAG_NAME
   git push origin $TAG_NAME
   ```

   **태그 형식:** `v2026.01.21-a1b2c3d`

---

## CD 파이프라인 (cd.yml)

### 트리거 조건

> ⚠️ **개발 단계 임시 설정**: 현재는 `develop` 브랜치에서도 배포가 진행됩니다.

```yaml
workflow_run:
  workflows: ['Re-Fit Frontend CI']
  types: [completed]
  branches: [main, develop]  # 🚀 개발 단계 임시: develop 추가
```

- CI 워크플로우가 `main` 또는 `develop` 브랜치에서 **성공적으로 완료**되면 자동 실행
- CI 실패 시 CD는 실행되지 않음

**Environment 설정:**
```yaml
environment: ${{ github.event.workflow_run.head_branch == 'main' && 'production' || 'development' }}
```
- `main` 브랜치 → `production` environment
- `develop` 브랜치 → `development` environment
- CI에서 사용한 것과 동일한 environment 사용

---

### 배포 프로세스 (deploy job)

#### Step 1: 빌드 아티팩트 다운로드

```yaml
- Download Build Artifact (.next/)
- Download Deployment Files (package.json, lock, config, public/)
```

**다운로드 위치:**
- `.next/` → `build-output/.next`
- 나머지 파일 → `build-output/`

**검증:**
```bash
ls -la build-output/
# ✅ .next directory found
# ✅ package.json found
```

---

#### Step 2: 서버로 파일 전송 (SCP)

**도구:** `appleboy/scp-action@v0.1.7`

**전송 설정:**
```yaml
host: ${{ secrets.SSH_HOST }}
username: ${{ secrets.SSH_USER }}
key: ${{ secrets.SSH_KEY }}
port: ${{ secrets.SSH_PORT }}
source: 'build-output/*'
target: '/home/ubuntu/refit/app/frontend_deploy_temp'
strip_components: 1
```

**전송 파일:**
- `build-output/*` → 서버의 임시 디렉토리

---

#### Step 3: 원격 배포 스크립트 실행 (SSH)

**도구:** `appleboy/ssh-action@v1.0.3`

**주요 경로:**
```bash
FE_DIR=/home/ubuntu/refit/app/frontend
BACKUP_DIR=/home/ubuntu/refit/backups/frontend
LOG_DIR=/home/ubuntu/refit/logs/frontend
TEMP_DIR=/home/ubuntu/refit/app/frontend_deploy_temp
PM2_CONFIG=/home/ubuntu/refit/infra/pm2/ecosystem.config.js
APP_NAME="frontend"
```

**배포 단계:**

##### 1. 디렉토리 준비
```bash
mkdir -p $BACKUP_DIR $LOG_DIR
```

##### 2. 환경 변수 체크 (선택적)
```bash
if [ -f "$FE_DIR/.env.production" ]; then
  echo "✅ .env.production 파일 발견 (런타임 환경 변수 사용)"
else
  echo "ℹ️  .env.production 파일 없음 (빌드 시점 환경 변수 사용)"
fi
```

**변경 사항**:
- 이제 환경 변수는 CI 빌드 시점에 GitHub Secrets에서 주입되어 빌드 아티팩트에 포함됩니다.
- 서버의 `.env.production` 파일은 선택적이며, 런타임에 추가로 필요한 환경 변수가 있을 때만 사용됩니다.
- `NEXT_PUBLIC_*` 변수는 빌드 시점에 이미 번들에 포함되어 있습니다.

##### 3. 기존 빌드 백업
```bash
cp -r $FE_DIR/.next $BACKUP_DIR/next_$TIMESTAMP
```
- **백업 형식:** `next_20260121143000`
- **용도:** 롤백 시 사용

##### 4. 전송 파일 검증
```bash
# .next 디렉토리 확인
# package.json 확인
# 없으면 배포 중단
```

##### 5. Atomic Switch (무중단 교체)
```bash
rm -rf $FE_DIR/.next
mv $TEMP_DIR/.next $FE_DIR/.next
```

##### 6. 필수 파일 업데이트
```bash
cp $TEMP_DIR/package.json $FE_DIR/package.json
cp $TEMP_DIR/pnpm-lock.yaml $FE_DIR/pnpm-lock.yaml
cp $TEMP_DIR/next.config.mjs $FE_DIR/next.config.mjs
mv $TEMP_DIR/public $FE_DIR/public
```

##### 7. 프로덕션 의존성 설치
```bash
pnpm install --prod --frozen-lockfile --ignore-scripts
```
- `--prod`: 프로덕션 의존성만 설치
- `--ignore-scripts`: prepare 스크립트 무시

##### 8. PM2 무중단 재시작
```bash
# 기존 프로세스 존재 시
pm2 reload frontend --update-env

# 신규 프로세스 시작 시
pm2 start ecosystem.config.js --only frontend --env production
```

##### 9. Caddy 웹서버 리로드
```bash
sudo systemctl reload caddy
```

##### 10. 배포 검증
```bash
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ 배포 성공!"
  pm2 save
  # 7일 이상 된 백업 삭제
  find $BACKUP_DIR -name "next_*" -type d -mtime +7 -exec rm -rf {} +
else
  echo "⚠️ 배포 이상 감지! (HTTP $HTTP_STATUS)"
  exit 1
fi
```

---

## 롤백 프로세스

### 자동 롤백 조건
- HTTP 상태 코드가 200이 아닐 때
- 배포 스크립트가 중단될 때

### 수동 롤백 방법
```bash
# 서버 SSH 접속
ssh ubuntu@your-server

# 백업 디렉토리 확인
ls -la /home/ubuntu/refit/backups/frontend/

# 특정 백업으로 롤백
mv /home/ubuntu/refit/backups/frontend/next_20260121143000 \
   /home/ubuntu/refit/app/frontend/.next

# PM2 재시작
pm2 reload frontend
```

---

## 환경별 트리거 정리

> ⚠️ **개발 단계 임시 설정**: 빠른 검증을 위해 develop 브랜치에서도 배포가 진행됩니다.

| 이벤트 | 브랜치 | CI Job | CD Job |
|--------|--------|--------|--------|
| PR 생성 | develop/main | lint-and-test | - |
| PR 업데이트 | develop/main | lint-and-test | - |
| Merge | develop | integration + release 🚀 | deploy 🚀 |
| Merge | main | release | deploy |
| Manual | any | 선택 가능 | - |

🚀 = 개발 단계 임시 설정 (정식 릴리즈 시 제거 예정)

---

## GitHub Environments 및 Secrets 설정

### 1. Environments 생성

GitHub 저장소 → **Settings** → **Environments**

#### Production Environment
1. **New environment** 클릭 → 이름: `production`
2. (선택) **Required reviewers** 설정으로 배포 승인 프로세스 추가
3. (선택) **Deployment branches** → `main` 브랜치만 허용

#### Development Environment
1. **New environment** 클릭 → 이름: `development`
2. 별도 승인 프로세스 없이 자동 배포

---

### 2. Environment Variables 설정

각 Environment에 다음 Variables를 추가합니다:

> **중요**: Secrets가 아닌 **Variables** 탭에 추가해야 합니다. `vars.*`로 접근됩니다.

#### Production Environment Variables

GitHub 저장소 → Settings → Environments → **production** → **Variables** 탭 → Add variable

| Name | Value (예시) | 설명 |
|------|------------|------|
| `NEXT_PUBLIC_API_URL` | `https://api.re-fit.kr` | 프로덕션 API 서버 |
| `NEXT_PUBLIC_KAKAO_REDIRECT_URL` | `https://www.re-fit.kr/callback.html` | 카카오 OAuth 콜백 |
| `NEXT_PUBLIC_ENV` | `production` | 환경 구분자 |

#### Development Environment Variables

GitHub 저장소 → Settings → Environments → **development** → **Variables** 탭 → Add variable

| Name | Value (예시) | 설명 |
|------|------------|------|
| `NEXT_PUBLIC_API_URL` | `https://dev-api.re-fit.kr` | 개발 API 서버 |
| `NEXT_PUBLIC_KAKAO_REDIRECT_URL` | `https://dev.re-fit.kr/callback.html` | 카카오 OAuth 콜백 |
| `NEXT_PUBLIC_ENV` | `development` | 환경 구분자 |

#### (선택) Repository-level Variables

PR 검증(`lint-and-test`)에서 사용할 기본값 (environment 없이 빌드 시):

GitHub 저장소 → Settings → Secrets and variables → Actions → **Variables** 탭

| Name | Value | 설명 |
|------|-------|------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | PR 검증용 기본값 |
| `NEXT_PUBLIC_KAKAO_REDIRECT_URL` | `http://localhost:3000/callback.html` | PR 검증용 기본값 |

- 설정하지 않으면 워크플로우의 fallback 값 사용
- 설정하면 PR에서 이 값으로 빌드

---

### 3. Repository Secrets 설정

환경에 관계없이 공통으로 사용되는 Secrets:

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | 설명 | 용도 |
|------------|------|------|
| `PAT` | Personal Access Token | 릴리즈 태그 push |
| `SSH_HOST` | 배포 서버 호스트 | CD 배포 |
| `SSH_USER` | 배포 서버 사용자 (ubuntu) | CD 배포 |
| `SSH_KEY` | SSH 개인키 | CD 배포 |
| `SSH_PORT` | SSH 포트 | CD 배포 |

---

### 4. 환경별 배포 흐름

```
main 브랜치 push
  → CI release job (environment: production)
    → production의 Variables 사용하여 빌드
  → CD deploy job (environment: production)
    → production 서버로 배포

develop 브랜치 push
  → CI release job (environment: development)
    → development의 Variables 사용하여 빌드
  → CD deploy job (environment: development)
    → development 서버로 배포
```

**중요**: Variables 값을 변경하면 다음 빌드부터 새 값이 적용됩니다. 이미 배포된 환경에 즉시 반영하려면 재배포가 필요합니다.

---

## 모니터링 및 로그

### GitHub Actions 로그
- [ci.yml](../../.github/workflows/ci.yml) 실행 로그
- [cd.yml](../../.github/workflows/cd.yml) 실행 로그

### 서버 로그
```bash
# PM2 로그
pm2 logs frontend

# PM2 모니터링
pm2 monit

# 배포 로그 디렉토리
/home/ubuntu/refit/logs/frontend/
```

---

## 수동 배포 실행

### GitHub Actions UI에서 실행

1. GitHub 저장소 → Actions 탭
2. "Re-Fit Frontend CI" 선택
3. "Run workflow" 클릭
4. 실행할 Job 선택:
   - `lint-and-test`: PR 검증만
   - `integration`: 통합 테스트만
   - `release`: 릴리즈 빌드만
   - `all`: 모든 단계 실행

---

## 트러블슈팅

### 빌드 실패
```bash
# CI 로그에서 에러 확인
# 로컬에서 재현
pnpm run build
```

### 배포 실패
```bash
# 서버 접속
ssh ubuntu@your-server

# PM2 상태 확인
pm2 status

# 에러 로그 확인
pm2 logs frontend --lines 100

# 수동 재시작
pm2 reload frontend
```

### 아티팩트 다운로드 실패
- GitHub Actions 로그에서 "Download Artifact" 단계 확인
- PAT 토큰 권한 확인
- 아티팩트 보관 기간 확인 (7일)

---

## 관련 문서

- [배포 가이드](./bigbang-deployment.md)
- [PM2 설정](../../infra/pm2/ecosystem.config.js)
- [CI 워크플로우](../../.github/workflows/ci.yml)
- [CD 워크플로우](../../.github/workflows/cd.yml)
