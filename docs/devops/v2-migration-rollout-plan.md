# V2 (OpenNext + SST) 마이그레이션 롤아웃 계획

## 개요

프론트엔드 프로덕션 인프라를 V1(EC2 + PM2 + Caddy)에서 V2(OpenNext + SST: CloudFront + Lambda + S3)로 전환한다.
개발환경(develop)은 기존 Docker 방식을 유지하고, **프로덕션(main)만 V2로 전환**한다.

## 전제 조건

- SST가 완전히 새로운 인프라를 생성하므로 V1과 V2가 동시에 존재할 수 있다
- V1 EC2는 V2 전환 후에도 즉시 삭제하지 않고 롤백 대비용으로 유지한다
- DNS 변경만으로 V1 ↔ V2 전환이 가능하다

## 브랜치별 배포 방식

| 브랜치 | 배포 방식 | 변경 여부 |
|-------|----------|----------|
| develop | Docker → EC2 (cd-dev.yml) | 변경 없음 |
| main | EC2 (cd-prod.yml) → SST (cd-prod-v2.yml) | 단계적 전환 |

## 워크플로우 파일 구성

```
.github/workflows/
  ci.yml             ← 변경하지 않음 (V1 자동 배포 유지)
  cd-prod.yml        ← V1 EC2 배포 (기존 유지)
  cd-prod-v2.yml     ← V2 SST 배포 (새로 추가, 수동 트리거)
  cd-dev.yml         ← 개발서버 Docker 배포 (변경 없음)
  rollback.yml       ← V1 EC2 롤백 (기존 유지)
```

---

## 1단계: V2 워크플로우 공존 (현재)

### 상태

```
main push → ci.yml → cd-prod.yml (V1 EC2, 자동)
                      cd-prod-v2.yml (V2 SST, 수동 실행만 가능)
```

### 작업 내용

- [x] `sst.config.ts` 생성
- [x] `cd-prod-v2.yml` 작성 (workflow_dispatch 전용)
- [x] `feature/v2-sst-migration` 브랜치에서 작업

### 이 단계에서의 배포 흐름

1. `feature/v2-sst-migration` → `main` 머지
2. main push → ci.yml → cd-prod.yml로 **V1 EC2 배포가 기존대로 동작** (변경 없음)
3. `cd-prod-v2.yml`을 **수동으로 실행**하여 V2 프로덕션 인프라 생성

### 확인 사항

- V1 프로덕션에 영향 없음 (ci.yml, cd-prod.yml 미변경)
- V2 CloudFront URL로 접속하여 정상 동작 검증

---

## 2단계: V2 프로덕션 검증

### 상태

```
re-fit.kr  → V1 EC2 (운영 중, 사용자 트래픽)
CloudFront URL → V2 SST (검증 중, 내부 테스트만)
```

### 검증 항목

| 항목 | 확인 방법 |
|-----|----------|
| 정적 자산 로딩 | `/login` 접속 → Network 탭에서 JS/CSS/Font 200 확인 |
| SSR 동작 | `/` 접속 → 서버 렌더링 HTML 확인 |
| BFF API Route | `/metrics/health-extended` → 200 응답 확인 |
| OAuth 로그인 | Kakao redirect URI에 CloudFront URL 추가 후 테스트 |
| 환경변수 인라인 | JS 번들에서 `NEXT_PUBLIC_API_BASE_URL` 값 확인 |

### 이 단계에서 필요한 작업

- GitHub Secrets에 `PROD_ENV_FILE` 내용이 V2에 맞는지 확인
- Kakao 개발자 콘솔에 CloudFront URL의 redirect URI 추가 (테스트용)
- 백엔드에 CloudFront URL의 redirect URI 추가

---

## 3단계: DNS 전환

### 상태 변경

```
변경 전: re-fit.kr → V1 EC2 IP
변경 후: re-fit.kr → V2 CloudFront 도메인
```

### 작업 순서

1. `sst.config.ts`에 커스텀 도메인 설정 추가
   ```typescript
   new sst.aws.Nextjs('ReFitWeb', {
     domain: {
       name: 're-fit.kr',
       cert: 'arn:aws:acm:us-east-1:...:certificate/...',
     },
     // ...
   });
   ```
2. `cd-prod-v2.yml` 수동 실행 → SST가 CloudFront에 도메인 연결
3. DNS 레코드 변경 (Route 53 또는 도메인 관리 콘솔)
4. SSL 인증서 확인
5. 전파 대기 (최대 48시간, 보통 수 분)

### 롤백 방법

DNS를 V1 EC2 IP로 되돌리면 즉시 V1으로 복구된다.

---

## 4단계: CI/CD 전환

### 상태

V2 프로덕션이 안정적으로 운영되고 있음을 확인한 후 진행.

### 작업 내용

1. **ci.yml의 release-prod 수정**: `cd-prod-v2.yml` 트리거로 변경
   ```yaml
   # 변경 전
   workflow_id: 'cd-prod.yml'

   # 변경 후
   workflow_id: 'cd-prod-v2.yml'
   ```

2. **불필요한 단계 제거**: ci.yml release-prod에서 아티팩트 업로드 관련 step 제거
   - SST가 빌드+배포를 일체로 처리하므로 아티팩트 압축/업로드 불필요

### 전환 후 흐름

```
main push → ci.yml (release-prod)
              ├─ 태그 생성
              └─ cd-prod-v2.yml 트리거
                    ├─ pnpm install
                    ├─ .env.production 생성
                    └─ npx sst deploy --stage prod
```

---

## 5단계: V1 정리

### V2 안정화 확인 후 (전환 후 최소 1주일 뒤)

- [ ] V1 EC2 인스턴스 중단 및 삭제
- [ ] V1 관련 CI/CD 파일 정리
  - `cd-prod.yml` 삭제 또는 `cd-prod-v1-legacy.yml`로 이름 변경
  - `rollback.yml` V2 방식으로 교체
- [ ] `cd-prod-v2.yml` → `cd-prod.yml`로 이름 변경
- [ ] Kakao 개발자 콘솔에서 V1 redirect URI 제거
- [ ] 백엔드에서 V1 redirect URI 설정 제거

---

## 단계별 요약

| 단계 | V1 (EC2) | V2 (SST) | re-fit.kr | ci.yml |
|-----|----------|----------|-----------|--------|
| 1. 공존 | 운영 중 (자동) | 수동 배포만 | V1 | V1 트리거 |
| 2. 검증 | 운영 중 (자동) | CloudFront URL로 테스트 | V1 | V1 트리거 |
| 3. DNS 전환 | 대기 (롤백용) | **운영 시작** | **V2** | V1 트리거 |
| 4. CI/CD 전환 | 대기 (롤백용) | 운영 중 (자동) | V2 | **V2 트리거** |
| 5. V1 정리 | **삭제** | 운영 중 (자동) | V2 | V2 트리거 |

## 롤백 시나리오

| 단계 | 롤백 방법 | 소요 시간 |
|-----|----------|----------|
| 1~2단계 | 아무것도 안 해도 됨 (V1이 계속 운영 중) | 즉시 |
| 3단계 | DNS를 V1 EC2 IP로 되돌리기 | 수 분 |
| 4단계 | ci.yml의 트리거를 cd-prod.yml로 되돌리기 + DNS 변경 | 수 분 |
| 5단계 | V1 EC2 재생성 필요 (AMI 백업에서 복구) | 30분~1시간 |
