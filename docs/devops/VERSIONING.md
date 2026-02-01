# Re-Fit Frontend 버저닝 가이드

## 목차
- [버저닝 전략](#버저닝-전략)
- [브랜치별 배포 전략](#브랜치별-배포-전략)
- [아티팩트 네이밍 규칙](#아티팩트-네이밍-규칙)
- [버전 릴리즈 가이드](#버전-릴리즈-가이드)
- [롤백 가이드](#롤백-가이드)

---

## 버저닝 전략

Re-Fit Frontend는 **시맨틱 버저닝(Semantic Versioning)** 을 사용합니다.

### 시맨틱 버저닝 형식

```
v{MAJOR}.{MINOR}.{PATCH}
```

### 버전 증가 규칙

| 유형 | 설명 | 예시 |
|------|------|------|
| **MAJOR** | 호환성이 깨지는 API 변경 | 1.0.0 → 2.0.0 |
| **MINOR** | 하위 호환성을 유지하는 기능 추가 | 1.0.0 → 1.1.0 |
| **PATCH** | 하위 호환성을 유지하는 버그 수정 | 1.0.0 → 1.0.1 |

### 버전 관리 원칙

1. **package.json이 버전의 단일 진실 공급원(Single Source of Truth)**
   - Git 태그는 package.json 버전을 기반으로 자동 생성
   - 모든 버전 업데이트는 package.json에서 시작

2. **Main 브랜치만 정식 버전 태그 생성**
   - Main 브랜치 push 시 `v{version}` 형식의 Git 태그 자동 생성
   - Develop 브랜치는 태그 생성 없이 자동 배포

3. **중복 태그 방지**
   - 이미 존재하는 태그는 다시 생성하지 않음
   - 릴리즈 전 반드시 package.json 버전 업데이트 필요

---

## 브랜치별 배포 전략

### Main 브랜치 (Production)

**목적:** 프로덕션 환경 배포

**배포 방식:** 수동 (Git 태그 기반)

**워크플로우:**
```bash
# 1. package.json 버전 업데이트
{
  "version": "1.0.0"
}

# 2. 변경사항 커밋 및 main 브랜치에 push
git checkout main
git commit -am "chore: bump version to 1.0.0"
git push origin main

# 3. CI/CD 자동 실행
# - Git 태그 v1.0.0 자동 생성
# - 아티팩트 빌드 및 업로드
# - Production 환경 자동 배포
```

**생성되는 아티팩트:**
- Git 태그: `v1.0.0`
- GitHub Actions: `frontend-build-v1.0.0-abc1234`, `frontend-files-v1.0.0-abc1234`
- S3: `artifacts/frontend/v1.0.0/frontend-deploy-v1.0.0-abc1234.tar.gz`
- 서버 백업: `backup-v1.0.0-abc1234`

**환경:** `production`

---

### Develop 브랜치 (Development)

**목적:** 개발 환경 배포 및 통합 테스트

**배포 방식:** 자동 (Push 시 즉시 배포)

**워크플로우:**
```bash
# develop 브랜치에 push만 하면 자동 배포
git checkout develop
git push origin develop

# CI/CD 자동 실행
# - Git 태그 생성 없음
# - 아티팩트 빌드 및 업로드
# - Development 환경 자동 배포
```

**생성되는 아티팩트:**
- Git 태그: 없음
- GitHub Actions: `frontend-build-develop-abc1234`, `frontend-files-develop-abc1234`
- S3: `artifacts/frontend/develop/frontend-deploy-develop-abc1234-20260201143020.tar.gz`
- 서버 백업: `backup-develop-abc1234-20260201143020`

**환경:** `development`

---

## 아티팩트 네이밍 규칙

### 네이밍 컨벤션

모든 아티팩트는 일관된 prefix와 버전 정보를 사용합니다.

#### Production (Main 브랜치)

```
패턴: {prefix}-v{MAJOR}.{MINOR}.{PATCH}-{SHA_SHORT}

예시:
- frontend-build-v1.0.0-abc1234
- frontend-files-v1.0.0-abc1234
- frontend-deploy-v1.0.0-abc1234.tar.gz
- backup-v1.0.0-abc1234
```

#### Development (Develop 브랜치)

```
패턴: {prefix}-develop-{SHA_SHORT}[-{TIMESTAMP}]

예시:
- frontend-build-develop-abc1234
- frontend-files-develop-abc1234
- frontend-deploy-develop-abc1234-20260201143020.tar.gz
- backup-develop-abc1234-20260201143020
```

### 아티팩트 유형별 설명

| Prefix | 설명 | 포함 내용 |
|--------|------|----------|
| `frontend-build` | Next.js 빌드 결과물 | `.next/` 디렉토리 (압축) |
| `frontend-files` | 배포 설정 파일 | `package.json`, `pnpm-lock.yaml`, `next.config.mjs`, `public/`, `scripts/` |
| `frontend-deploy` | 최종 배포 아카이브 | build + files 통합 (S3 저장용) |
| `backup` | 서버 백업 | 배포 전 현재 상태 스냅샷 |

### S3 경로 구조

```
s3://bucket-name/
└── artifacts/
    └── frontend/
        ├── v1.0.0/
        │   ├── frontend-deploy-v1.0.0-abc1234.tar.gz
        │   └── frontend-deploy-v1.0.0-def5678.tar.gz
        ├── v1.1.0/
        │   └── frontend-deploy-v1.1.0-ghi9012.tar.gz
        └── develop/
            ├── frontend-deploy-develop-abc1234-20260201143020.tar.gz
            └── frontend-deploy-develop-def5678-20260201154500.tar.gz
```

**특징:**
- 버전별 폴더 구조로 관리
- Production: 버전별 폴더 (`v1.0.0/`)
- Development: `develop/` 폴더에 시간순 정렬

---

## 버전 릴리즈 가이드

### 1. Patch 릴리즈 (버그 수정)

**시나리오:** 긴급 버그 수정

```bash
# 현재 버전: 1.0.0 → 목표: 1.0.1

# 1. package.json 수정
{
  "version": "1.0.1"
}

# 2. 커밋 및 push
git checkout main
git commit -am "chore: bump version to 1.0.1"
git push origin main

# 3. 자동 배포 확인
# - Git 태그: v1.0.1 생성
# - Production 배포 완료
```

---

### 2. Minor 릴리즈 (기능 추가)

**시나리오:** 새로운 기능 추가 (하위 호환성 유지)

```bash
# 현재 버전: 1.0.1 → 목표: 1.1.0

# 1. package.json 수정
{
  "version": "1.1.0"
}

# 2. 커밋 및 push
git checkout main
git commit -am "chore: bump version to 1.1.0"
git push origin main

# 3. 자동 배포 확인
```

---

### 3. Major 릴리즈 (Breaking Changes)

**시나리오:** API 변경, 대규모 리팩토링

```bash
# 현재 버전: 1.1.0 → 목표: 2.0.0

# 1. package.json 수정
{
  "version": "2.0.0"
}

# 2. 커밋 및 push
git checkout main
git commit -am "chore: bump version to 2.0.0"
git push origin main

# 3. 자동 배포 확인
```

---

### 4. 개발 환경 배포 (Develop)

**시나리오:** 개발 중인 기능 테스트

```bash
# 버전 업데이트 불필요
# develop 브랜치에 push만 하면 자동 배포

git checkout develop
git push origin develop

# 자동 배포:
# - frontend-deploy-develop-abc1234-20260201143020.tar.gz
# - Development 환경 배포
```

---

## 롤백 가이드

### 자동 롤백

배포 중 헬스체크 실패 시 자동으로 이전 버전으로 롤백됩니다.

**자동 롤백 프로세스:**
1. 새 버전 배포 시 현재 버전 자동 백업
2. 헬스체크 5회 재시도 (각 3초 간격)
3. 실패 시 백업에서 자동 복구
4. PM2 재시작 및 재검증

---

### 수동 롤백

GitHub Actions의 Rollback 워크플로우를 사용합니다.

#### 1. 사용 가능한 백업 목록 확인

```
워크플로우: System Rollback
Mode: list
```

**출력 예시:**
```
backup-v1.0.0-abc1234     Feb 1 14:30
backup-develop-def5678-20260201143020  Feb 1 15:45
```

#### 2. 특정 버전으로 롤백

```
워크플로우: System Rollback
Mode: restore
Backup ID: backup-v1.0.0-abc1234
```

**롤백 프로세스:**
1. 현재 상태 안전 백업 생성 (`safety_before_rollback_*`)
2. 지정된 백업으로 파일 복구
3. 의존성 재설치 (`pnpm install --prod`)
4. PM2 재시작
5. 헬스체크 (5회 재시도)
6. 성공 시 PM2 상태 저장

---

## 버전 히스토리 예시

### Production 릴리즈 히스토리

```
v1.0.0 (2026-02-01)
  - 최초 프로덕션 릴리즈
  - 회원가입, 로그인 기능
  - 이력서 관리 기능

v1.0.1 (2026-02-02)
  - 긴급 버그 수정: 채팅 오류 해결

v1.1.0 (2026-02-05)
  - 새 기능: 다크모드 지원
  - 개선: 성능 최적화

v2.0.0 (2026-02-15)
  - Breaking: API 엔드포인트 변경
  - 새 기능: 실시간 알림
```

### Development 빌드 히스토리

```
develop-abc1234-20260201143020
  - feat: 다크모드 개발 중

develop-def5678-20260201154500
  - feat: 알림 기능 테스트

develop-ghi9012-20260202091500
  - fix: 다크모드 버그 수정
```

---

## 모범 사례

### ✅ DO

1. **릴리즈 전 package.json 버전 업데이트**
   ```bash
   # ✅ Good
   git commit -am "chore: bump version to 1.1.0"
   git push origin main
   ```

2. **시맨틱 버저닝 규칙 준수**
   - 버그 수정: PATCH 증가
   - 기능 추가: MINOR 증가
   - Breaking changes: MAJOR 증가

3. **Develop 브랜치에서 충분히 테스트 후 Main 병합**
   ```bash
   git checkout develop
   # 충분한 테스트 후
   git checkout main
   git merge develop
   ```

4. **의미 있는 커밋 메시지 작성**
   ```bash
   git commit -m "feat: add dark mode support"
   git commit -m "fix: resolve chat error on resume upload"
   git commit -m "chore: bump version to 1.1.0"
   ```

---

### ❌ DON'T

1. **package.json 버전 업데이트 없이 릴리즈**
   ```bash
   # ❌ Bad - 태그 생성 실패 (중복 태그 에러)
   git push origin main
   ```

2. **잘못된 버전 증가**
   ```bash
   # ❌ Bad - 버그 수정인데 MINOR 증가
   1.0.0 → 1.1.0 (버그 수정은 1.0.1로 해야 함)
   ```

3. **Main 브랜치에 직접 작업**
   ```bash
   # ❌ Bad - develop 브랜치 거치지 않고 main에 직접 push
   git checkout main
   git commit -am "quick fix"
   ```

4. **수동으로 Git 태그 생성**
   ```bash
   # ❌ Bad - CI가 자동으로 생성하므로 수동 생성 불필요
   git tag v1.0.0
   git push origin v1.0.0
   ```

---

## 참고 자료

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)

---

## 문의

버저닝 관련 문의사항은 팀 채널 또는 GitHub Issues에 남겨주세요.
