#!/bin/bash
set -e

# ============================================
# Re-Fit 프론트엔드 초기 설정 스크립트
# Ubuntu 인스턴스용
# ============================================

echo "============================================"
echo "프론트엔드 초기 설정 시작"
echo "============================================"

# 1. Node.js 설치 (NVM 사용)
echo "[1/5] Node.js 설치 확인..."
if ! command -v node &> /dev/null; then
    echo "Node.js가 없습니다. NVM으로 설치합니다..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 22
    nvm use 22
else
    echo "Node.js 버전: $(node -v)"
fi

# 2. pnpm 설치
echo "[2/5] pnpm 설치 확인..."
if ! command -v pnpm &> /dev/null; then
    echo "pnpm 설치 중..."
    npm install -g pnpm
else
    echo "pnpm 버전: $(pnpm -v)"
fi

# 3. PM2 설치
echo "[3/5] PM2 설치 확인..."
if ! command -v pm2 &> /dev/null; then
    echo "PM2 설치 중..."
    npm install -g pm2
else
    echo "PM2 버전: $(pm2 -v)"
fi

# 4. 프로젝트 클론
echo "[4/5] 프로젝트 설정..."
FE_DIR=~/refit/app/frontend
if [ ! -d "$FE_DIR" ]; then
    mkdir -p ~/app
    echo "프로젝트 디렉토리 생성: $FE_DIR"
    echo "아래 명령으로 프로젝트를 클론하세요:"
    echo "  git clone https://github.com/100-hours-a-week/19-team-project-fe.git $FE_DIR"
else
    echo "프로젝트 디렉토리가 이미 존재합니다: $FE_DIR"
fi

# 5. 필요한 디렉토리 생성
echo "[5/5] 디렉토리 생성..."
mkdir -p ~/backups
mkdir -p ~/logs

echo "============================================"
echo "초기 설정 완료!"
echo "============================================"
echo ""
echo "다음 단계:"
echo "1. 프로젝트 클론: git clone <repo-url> ~/app/frontend"
echo "2. 환경 변수 설정: cp .env.example .env.production"
echo "3. 배포 실행: ./deploy.sh"
echo ""
