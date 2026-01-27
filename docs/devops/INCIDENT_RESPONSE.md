# 장애 대응 및 롤백 가이드

이 문서는 Re-Fit 프론트엔드 서비스 장애 발생 시 신속하게 대응하고 서비스를 복구하기 위한 절차를 정의합니다.

## 1. 장애 등급 (Severity Levels)

| 등급 | 정의 | 예시 | 대응 목표 | 알림 대상 |
| :--- | :--- | :--- | :--- | :--- |
| **Critical** | 서비스 주요 기능 불가 | 메인 페이지 접속 불가, 로그인 불가, 결제 불가 | **즉시 복구 (롤백)** | 전체 개발팀, PM |
| **Major** | 일부 기능 오류, 우회 가능 | 특정 페이지 렌더링 오류, 비핵심 기능 동작 안 함 | 당일 수정 (Hotfix) | 프론트엔드팀, 백엔드팀 |
| **Minor** | UI/UX 불편, 경미한 버그 | 오타, 레이아웃 깨짐, 간헐적 오류 | 차기 배포 시 수정 | 프론트엔드팀 |

## 2. 장애 전파 및 대응 프로세스

1.  **장애 탐지 (Detection)**
    *   모니터링 알람(CloudWatch, Sentry 등) 또는 내부/외부 제보로 확인
    *   **Discord** 장애 채널에 장애 상황 공유 (장애 내용, 발생 시각, 영향도)

2.  **상황 파악 및 등급 산정**
    *   접속 확인 및 로그 분석 (PM2 logs, 브라우저 콘솔 등)
    *   장애 등급 결정 (Critical/Major/Minor)

3.  **대응 조치 (Action)**
    *   **Critical:** 원인 파악보다 **서비스 복구 우선** -> **즉시 롤백 수행**
    *   **Major:** 원인 파악 및 Hotfix 개발 -> CI/CD 배포
    *   **Minor:** 이슈 티켓 생성 후 정기 배포 일정에 포함

4.  **사후 분석 (Post-Mortem)**
    *   장애 원인, 대응 과정, 개선 사항 정리
    *   재발 방지 대책 수립

---

## 3. 수동 롤백 가이드 (Manual Rollback)

심각한 장애 발생 시 **GitHub Actions**를 통해 이전에 배포된 정상 버전으로 즉시 되돌릴 수 있습니다.

### 사전 요구사항
*   GitHub Repository 접근 권한 (`Actions` 실행 권한)
*   이전 배포 기록이 서버에 백업되어 있어야 함 (자동 관리됨)

### 롤백 절차

#### Step 1: 백업 목록 확인
1.  GitHub Repository -> **Actions** 탭 이동
2.  Left Sidebar -> **System Rollback** 워크플로우 선택
3.  **Run workflow** 클릭
4.  Mode: `list` 선택
5.  **Run workflow** 버튼 클릭
6.  실행가 완료되면 로그를 확인하여 복구할 시점의 `Backup ID` (예: `next_20240127090000`) 복사

#### Step 2: 롤백 실행
1.  **Run workflow** 다시 클릭
2.  Mode: `restore` 선택
3.  Backup ID: 복사한 ID 입력 (예: `next_20240127090000`)
    *   *비워둘 경우 가장 최신 백업으로 복구됩니다.*
4.  **Run workflow** 버튼 클릭

#### Step 3: 복구 확인
1.  Workflow가 성공(`✅`)하면 서비스 접속 확인
2.  주요 기능 정상 동작 확인

### 주의사항
*   롤백은 `.next` 빌드 파일과 `package.json`, `public` 폴더 등을 백업 시점으로 되돌립니다.
*   백엔드 API 변경사항과 의존성이 있는 경우, 프론트엔드 롤백 만으로는 해결되지 않을 수 있습니다. (백엔드 팀과 협의 필요)
*   롤백 실행 시 자동으로 헬스체크가 수행되며, 실패 시 Discord로 알림이 전송됩니다.

---

## 4. 서버 직접 접속 및 운영 가이드

GitHub Actions를 통한 롤백이 불가능하거나 긴급한 디버깅이 필요한 경우, SSH로 서버에 직접 접속하여 조치할 수 있습니다.

### 4.1 SSH 접속

```bash
# AWS Systems Manager Session Manager를 통한 접속
aws ssm start-session --target <EC2_INSTANCE_ID> --region ap-northeast-2

# 또는 SSH 키를 통한 직접 접속 (권한이 있는 경우)
ssh -i <KEY_FILE> ubuntu@<EC2_IP>
```

### 4.2 PM2 프로세스 관리

#### 현재 상태 확인
```bash
# 모든 프로세스 상태 확인
pm2 status

# 프론트엔드 프로세스만 상세 확인
pm2 describe frontend

# 프로세스 메트릭 확인
pm2 monit
```

#### 프로세스 재시작
```bash
# Graceful reload (무중단 재시작, 권장)
pm2 reload frontend

# Hard restart (즉시 재시작)
pm2 restart frontend

# 프로세스 중지 및 시작
pm2 stop frontend
pm2 start frontend

# 전체 재시작 (모든 앱)
pm2 restart all
```

#### 프로세스 삭제 및 재생성
```bash
# 기존 프로세스 삭제
pm2 delete frontend

# ecosystem 파일로 새로 시작
cd /home/ubuntu/final_project/infra/pm2
pm2 start ecosystem.config.js --only frontend --env production

# 현재 설정 저장
pm2 save
```

### 4.3 로그 확인

#### PM2 로그
```bash
# 실시간 로그 확인
pm2 logs frontend

# 최근 100줄만 확인 (실시간 X)
pm2 logs frontend --lines 100 --nostream

# 에러 로그만 확인
pm2 logs frontend --err

# 표준 출력만 확인
pm2 logs frontend --out

# 로그 초기화
pm2 flush
```

#### 시스템 로그
```bash
# Next.js 애플리케이션 로그
tail -f /home/ubuntu/.pm2/logs/frontend-out.log
tail -f /home/ubuntu/.pm2/logs/frontend-error.log

# Caddy (리버스 프록시) 로그
sudo journalctl -u caddy -f

# 최근 50줄 확인
sudo journalctl -u caddy -n 50
```

### 4.4 수동 배포 및 롤백

#### 백업 확인
```bash
# 백업 목록 확인
ls -lt /home/ubuntu/final_project/backups/frontend/

# 특정 백업 내용 확인
ls -lh /home/ubuntu/final_project/backups/frontend/next_20240127120000/
```

#### 수동 롤백
```bash
# 1. 프로세스 중지
pm2 stop frontend

# 2. 현재 빌드를 안전하게 백업
TIMESTAMP=$(date +%Y%m%d%H%M%S)
mkdir -p /home/ubuntu/final_project/backups/frontend/manual_backup_${TIMESTAMP}
cp -r /home/ubuntu/final_project/app/frontend/.next \
     /home/ubuntu/final_project/backups/frontend/manual_backup_${TIMESTAMP}/

# 3. 이전 빌드로 복구
BACKUP_DIR="/home/ubuntu/final_project/backups/frontend/next_20240127120000"
rm -rf /home/ubuntu/final_project/app/frontend/.next
cp -r ${BACKUP_DIR}/.next /home/ubuntu/final_project/app/frontend/

# package.json도 함께 복구
cp ${BACKUP_DIR}/package.json /home/ubuntu/final_project/app/frontend/

# 4. 의존성 재설치 (package.json이 변경된 경우)
cd /home/ubuntu/final_project/app/frontend
pnpm install --prod --frozen-lockfile

# 5. 프로세스 재시작
pm2 reload frontend

# 6. 상태 확인
pm2 status frontend
curl -I http://localhost:3000  # 또는 실제 헬스체크 URL
```

### 4.5 디버깅 팁

#### 빌드 파일 검증
```bash
# .next 디렉토리 존재 확인
ls -la /home/ubuntu/final_project/app/frontend/.next/

# 빌드 캐시 정리 (문제가 계속될 경우)
cd /home/ubuntu/final_project/app/frontend
rm -rf .next
rm -rf node_modules
pnpm install --prod
# 새로운 배포 필요
```

#### 네트워크 및 포트 확인
```bash
# 프론트엔드 프로세스 포트 리스닝 확인
ss -tlnp | grep 3000
netstat -tlnp | grep 3000

# Caddy 상태 확인
sudo systemctl status caddy

# Caddy 설정 검증
sudo caddy validate --config /etc/caddy/Caddyfile
```

#### 메모리 및 디스크 확인
```bash
# 디스크 사용량 확인
df -h

# 메모리 사용량 확인
free -h

# 프로세스별 메모리 사용량
pm2 monit

# 디스크 정리 (오래된 백업 삭제)
find /home/ubuntu/final_project/backups/frontend -name "next_*" -type d -mtime +30 -exec rm -rf {} +
```

### 4.6 긴급 연락망

| 역할 | 담당자 | 연락처 | 가용 시간 |
| :--- | :--- | :--- | :--- |
| **프론트엔드 리드** | TBD | Discord / Slack | 평일 09:00-22:00 |
| **백엔드 리드** | TBD | Discord / Slack | 평일 09:00-22:00 |
| **DevOps/인프라** | TBD | Discord / Slack | 평일 10:00-18:00 |
| **PM** | TBD | Discord / Slack | 평일 09:00-18:00 |

> **긴급 장애 발생 시**: Discord `#장애-대응` 채널에 `@here` 멘션과 함께 즉시 공유

---

## 5. 헬스체크 및 모니터링

### 5.1 헬스체크 엔드포인트

프론트엔드 서비스는 다음 엔드포인트를 통해 헬스체크를 수행합니다:

```bash
# 기본 헬스체크 (홈페이지)
curl -I https://your-domain.com

# 응답 예시
HTTP/2 200
```

### 5.2 모니터링 대시보드

*   **CloudWatch Logs**: EC2 인스턴스 및 애플리케이션 로그 모니터링
*   **PM2 모니터링**: 서버 접속 후 `pm2 monit` 명령으로 실시간 확인
*   **Discord 알림**: 배포 및 롤백 결과 자동 알림

### 5.3 정기 점검 사항

| 항목 | 주기 | 방법 | 담당 |
| :--- | :--- | :--- | :--- |
| 백업 보유 확인 | 주 1회 | `rollback.yml` list 모드 실행 | DevOps |
| 디스크 사용량 | 주 1회 | CloudWatch 또는 SSH 접속 | DevOps |
| PM2 프로세스 상태 | 매일 | `pm2 status` 확인 | On-call |
| 로그 에러 검토 | 매일 | CloudWatch Logs Insights | 프론트엔드 |

---

## 6. 체크리스트

### 장애 발생 시 초기 대응 체크리스트

- [ ] Discord #장애-대응 채널에 상황 공유
- [ ] 장애 등급 판단 (Critical/Major/Minor)
- [ ] 헬스체크 URL 접속 확인
- [ ] PM2 로그 확인 (`pm2 logs frontend --lines 50`)
- [ ] Critical인 경우 즉시 롤백 결정
- [ ] 롤백 실행 및 결과 확인
- [ ] 원인 분석 및 Post-Mortem 작성
- [ ] 재발 방지 대책 수립

### 롤백 실행 체크리스트

- [ ] 백업 목록 확인 (GitHub Actions `list` 모드)
- [ ] 복구할 백업 ID 확인
- [ ] 롤백 실행 (GitHub Actions `restore` 모드)
- [ ] 헬스체크 성공 확인
- [ ] 주요 기능 수동 테스트
- [ ] Discord 알림 확인
- [ ] 관련 팀에 복구 완료 통지
