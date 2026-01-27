# Re-Fit Frontend 긴급 대응 Runbook

> **빠른 참조 가이드**: 장애 발생 시 즉시 참조할 수 있는 실행 가능한 커맨드 모음

---

## 🚨 긴급 상황별 대응

### 상황 1: 서비스가 응답하지 않음 (500/502/503 에러)

```bash
# 1. PM2 상태 확인
pm2 status frontend

# 2. 로그 확인
pm2 logs frontend --lines 50 --nostream

# 3. 프로세스가 죽었다면 재시작
pm2 restart frontend

# 4. 프로세스가 있는데도 응답이 없다면 reload
pm2 reload frontend

# 5. 여전히 문제가 있다면 GitHub Actions로 롤백
# GitHub → Actions → System Rollback → Run workflow (mode: restore)
```

**예상 복구 시간**: 2-5분

---

### 상황 2: 배포 후 장애 발생 (즉시 롤백 필요)

```bash
# Option A: GitHub Actions로 롤백 (권장)
# 1. GitHub → Actions → System Rollback
# 2. Run workflow 클릭
# 3. mode: restore 선택
# 4. backup_id: 비워두거나 특정 백업 ID 입력
# 5. Run workflow 클릭

# Option B: 서버에서 수동 롤백
# 1. SSH 접속
aws ssm start-session --target <EC2_INSTANCE_ID> --region ap-northeast-2

# 2. 백업 확인
ls -lt /home/ubuntu/final_project/backups/frontend/ | head -n 5

# 3. 롤백 스크립트 실행
BACKUP_ID="next_20240127120000"  # 가장 최근 정상 백업
cd /home/ubuntu/final_project/app/frontend
rm -rf .next
cp -r /home/ubuntu/final_project/backups/frontend/${BACKUP_ID}/.next ./
pm2 reload frontend
```

**예상 복구 시간**: 1-3분

---

### 상황 3: PM2 프로세스 완전 중단

```bash
# 1. SSH 접속
aws ssm start-session --target <EC2_INSTANCE_ID> --region ap-northeast-2

# 2. PM2 상태 확인
pm2 list

# 3. 프로세스가 목록에 없다면 재생성
cd /home/ubuntu/final_project/infra/pm2
pm2 start ecosystem.config.js --only frontend --env production

# 4. 설정 저장
pm2 save

# 5. 헬스체크
curl -I http://localhost:3000
```

**예상 복구 시간**: 2-3분

---

### 상황 4: 메모리 부족 / Out of Memory

```bash
# 1. 메모리 사용량 확인
free -h
pm2 monit

# 2. PM2 프로세스 재시작 (메모리 해제)
pm2 restart frontend

# 3. 메모리 누수가 의심된다면 로그 확인
pm2 logs frontend --lines 200 | grep -i "memory\|heap"

# 4. 임시 조치: PM2 max memory 제한 설정
pm2 restart frontend --max-memory-restart 1G
pm2 save
```

**예상 복구 시간**: 2-5분

---

### 상황 5: 디스크 용량 부족

```bash
# 1. 디스크 사용량 확인
df -h

# 2. 오래된 백업 삭제 (30일 이상)
find /home/ubuntu/final_project/backups/frontend -name "next_*" -type d -mtime +30 -exec rm -rf {} +

# 3. PM2 로그 초기화
pm2 flush

# 4. 시스템 로그 정리 (필요시)
sudo journalctl --vacuum-time=7d
```

**예상 복구 시간**: 5-10분

---

## 📋 자주 사용하는 명령어

### PM2 관련

```bash
# 상태 확인
pm2 status
pm2 describe frontend

# 로그 확인
pm2 logs frontend                    # 실시간 로그
pm2 logs frontend --lines 100        # 최근 100줄
pm2 logs frontend --err              # 에러만
pm2 flush                            # 로그 초기화

# 프로세스 제어
pm2 reload frontend                  # 무중단 재시작 (권장)
pm2 restart frontend                 # 즉시 재시작
pm2 stop frontend                    # 중지
pm2 delete frontend                  # 삭제
pm2 save                             # 현재 설정 저장

# 모니터링
pm2 monit                            # 실시간 모니터링
```

### 로그 확인

```bash
# PM2 로그 파일
tail -f ~/.pm2/logs/frontend-out.log
tail -f ~/.pm2/logs/frontend-error.log

# Caddy 로그
sudo journalctl -u caddy -f
sudo journalctl -u caddy -n 50

# 디스크/메모리 확인
df -h
free -h
```

### 백업 관리

```bash
# 백업 목록
ls -lt /home/ubuntu/final_project/backups/frontend/

# 백업 상세
ls -lh /home/ubuntu/final_project/backups/frontend/next_20240127120000/

# 오래된 백업 삭제 (30일 이상)
find /home/ubuntu/final_project/backups/frontend -name "next_*" -mtime +30 -exec rm -rf {} +
```

### 네트워크 확인

```bash
# 포트 리스닝 확인
ss -tlnp | grep 3000
netstat -tlnp | grep 3000

# 헬스체크
curl -I http://localhost:3000
curl -I https://your-domain.com

# Caddy 상태
sudo systemctl status caddy
sudo systemctl reload caddy
```

---

## 🔍 장애 진단 플로우차트

```
서비스 장애 감지
    ↓
1. 헬스체크 실패? (curl -I)
    YES → PM2 상태 확인 (pm2 status)
        ↓
    프로세스 없음? → pm2 start
    프로세스 있음? → 로그 확인 (pm2 logs)
        ↓
2. 최근 배포 후 발생?
    YES → 즉시 롤백 (GitHub Actions)
    NO → 로그 분석 및 원인 파악
        ↓
3. 메모리/디스크 문제?
    YES → 리소스 정리 및 재시작
    NO → 코드 레벨 디버깅 필요
        ↓
4. 복구 후
    → Discord 알림
    → Post-Mortem 작성
    → 재발 방지 대책 수립
```

---

## 📞 에스컬레이션 경로

| 시간 | 1차 대응 | 2차 대응 | 최종 대응 |
| :--- | :--- | :--- | :--- |
| **0-15분** | On-call 엔지니어 | - | - |
| **15-30분** | On-call 엔지니어 | 프론트엔드 리드 | - |
| **30분+** | On-call 엔지니어 | 프론트엔드 리드 | PM + 전체 팀 |

### 연락 방법
1. Discord `#장애-대응` 채널에 `@here` 멘션
2. 상황이 심각하면 개별 DM
3. 30분 이상 해결 안 되면 전체 회의 소집

---

## ✅ 복구 후 체크리스트

- [ ] 헬스체크 성공 확인 (`curl -I https://your-domain.com`)
- [ ] 주요 페이지 수동 테스트 (로그인, 메인, 주요 기능)
- [ ] PM2 프로세스 상태 정상 (`pm2 status`)
- [ ] Discord 알림 확인
- [ ] 관련 팀에 복구 완료 통지
- [ ] 로그 모니터링 (최소 10분)
- [ ] 장애 원인 기록 (Issue 생성)
- [ ] Post-Mortem 회의 일정 잡기

---

## 🛠️ 유용한 리소스

*   **장애 대응 상세 가이드**: [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
*   **GitHub Actions 워크플로우**: `.github/workflows/rollback.yml`
*   **PM2 Ecosystem 설정**: `/home/ubuntu/final_project/infra/pm2/ecosystem.config.js`
*   **서버 경로**: `/home/ubuntu/final_project/app/frontend`
*   **백업 경로**: `/home/ubuntu/final_project/backups/frontend`

---

## 📝 Post-Mortem 템플릿

```markdown
# 장애 보고서 - [날짜]

## 요약
- **발생 시각**: YYYY-MM-DD HH:MM
- **복구 시각**: YYYY-MM-DD HH:MM
- **영향 범위**: (예: 전체 사용자, 특정 기능)
- **장애 등급**: Critical / Major / Minor

## 타임라인
- HH:MM - 장애 감지
- HH:MM - 초기 조치 시작
- HH:MM - 롤백 완료
- HH:MM - 서비스 정상화 확인

## 원인
- 근본 원인 (Root Cause)
- 직접적 원인 (Immediate Cause)

## 대응 과정
- 수행한 조치들
- 효과적이었던 것
- 효과적이지 않았던 것

## 재발 방지 대책
1. 단기 대책 (즉시 적용)
2. 중기 대책 (1-2주 내)
3. 장기 대책 (개선 과제)

## 교훈
- 잘한 점
- 개선할 점
```

---

**마지막 업데이트**: 2024-01-27
**문서 관리자**: DevOps Team
