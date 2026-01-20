# 빅뱅 배포 가이드 (Big Bang Deployment)

## 개요

빅뱅 배포는 전체 시스템을 한 번에 새 버전으로 교체하는 배포 전략입니다. 모든 사용자가 동시에 새 버전을 사용하게 됩니다.

## 배포 환경

| 항목 | 내용 |
|------|------|
| 서버 | Ubuntu 인스턴스 |
| 런타임 | Node.js 22 |
| 패키지 매니저 | pnpm |
| 프로세스 매니저 | PM2 |
| 웹 서버 | Caddy (Reverse Proxy) |
| 프레임워크 | Next.js |

## 디렉토리 구조

```
~/
├── app/
│   └── frontend/          # 프로젝트 소스 코드
├── logs/
│   └── frontend/
└── backups/
    └── frontend/
```

---

## 1단계: 초기 서버 설정

최초 배포 시 한 번만 실행합니다.

### 1.1 설정 스크립트 실행

```bash
# 스크립트 실행 권한 부여
chmod +x setup.sh

# 초기 설정 실행
./setup.sh
```

### 1.2 설치되는 항목

- **Node.js 22** (NVM을 통한 설치)
- **pnpm** (패키지 매니저)
- **PM2** (프로세스 매니저)

### 1.3 프로젝트 클론

```bash
git clone https://github.com/100-hours-a-week/19-team-project-fe.git ~/app/frontend
cd ~/app/frontend
```

### 1.4 환경 변수 설정

```bash
# 환경 변수 파일 생성
cp .env.example .env.production

# 필요한 값 수정
vi .env.production
```

---

## 2단계: 배포 실행

### 2.1 배포 스크립트 실행

```bash
cd ~/app/frontend
chmod +x deploy.sh
./deploy.sh
```

### 2.2 배포 프로세스

배포 스크립트는 다음 순서로 실행됩니다:

```
[1/6] 현재 버전 백업
       └─ .next 폴더를 ~/backups/frontend-{timestamp}로 복사

[2/6] 소스 코드 업데이트
       └─ git pull origin main

[3/6] 의존성 설치
       └─ pnpm install --frozen-lockfile

[4/6] 환경 변수 확인
       └─ .env.production 파일 존재 여부 확인

[5/6] 프로덕션 빌드
       └─ pnpm run build

[6/6] 서비스 재시작
       └─ PM2 또는 systemd로 서비스 재시작
       └─ Caddy 리로드
```

---

## 3단계: PM2 서비스 관리

### 3.1 최초 실행

```bash
# ecosystem.config.js 사용
pm2 start ecosystem.config.js

# 시스템 재부팅 시 자동 시작 설정
pm2 startup
pm2 save
```

### 3.2 서비스 관리 명령어

```bash
# 상태 확인
pm2 status

# 로그 확인
pm2 logs frontend

# 재시작
pm2 restart frontend

# 중지
pm2 stop frontend

# 삭제
pm2 delete frontend
```

### 3.3 모니터링

```bash
# 실시간 모니터링
pm2 monit

# 상세 정보
pm2 show frontend
```

---

## 4단계: 배포 검증

### 4.1 서비스 상태 확인

```bash
# PM2 상태
pm2 status

# 포트 확인
curl http://localhost:3000

# 프로세스 확인
ps aux | grep node
```

### 4.2 로그 확인

```bash
# PM2 로그
pm2 logs frontend --lines 100

# 에러 로그
cat ~/logs/frontend-error.log

# 출력 로그
cat ~/logs/frontend-out.log
```

---

## 5단계: 롤백

배포 후 문제 발생 시 이전 버전으로 롤백합니다.

### 5.1 백업 확인

```bash
ls -la ~/backups/
```

### 5.2 롤백 실행

```bash
# 가장 최근 백업으로 롤백
LATEST_BACKUP=$(ls -t ~/backups | head -1)
rm -rf ~/app/frontend/.next
cp -r ~/backups/$LATEST_BACKUP ~/app/frontend/.next

# 서비스 재시작
pm2 restart frontend
```

### 5.3 Git을 통한 롤백

```bash
cd ~/app/frontend

# 이전 커밋으로 되돌리기
git log --oneline -5  # 커밋 확인
git checkout <commit-hash>

# 재빌드 및 재시작
pnpm install
pnpm build
pm2 restart frontend
```

---

## 트러블슈팅

### 빌드 실패

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
rm -rf .next
pnpm install
pnpm build
```

### 포트 충돌

```bash
# 3000번 포트 사용 중인 프로세스 확인
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

### PM2 문제

```bash
# PM2 프로세스 전체 삭제 후 재시작
pm2 delete all
pm2 start ecosystem.config.js
```

### 메모리 부족

```bash
# 메모리 사용량 확인
free -h

# PM2 메모리 제한 설정 (ecosystem.config.js)
max_memory_restart: '500M'
```

---

## 배포 체크리스트

- [ ] 로컬에서 빌드 테스트 완료
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 마이그레이션 (필요시)
- [ ] 백업 완료 확인
- [ ] 배포 스크립트 실행
- [ ] 서비스 정상 동작 확인
- [ ] 로그 에러 없음 확인
