#!/bin/bash
# SLO 검증 시스템 테스트 스크립트
# 가상의 메트릭 데이터를 생성하여 SLO 검증을 테스트합니다.

set -euo pipefail

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCENARIO=${1:-good}  # good, bad, mixed
COUNT=${2:-50}       # 생성할 메트릭 개수
BASE_URL=${3:-http://localhost:3000}  # 로컬 개발 서버

echo "============================================"
echo "📊 SLO 테스트 메트릭 생성기"
echo "============================================"
echo ""
echo "시나리오: $SCENARIO"
echo "메트릭 개수: $COUNT"
echo "대상 서버: $BASE_URL"
echo ""

# 시나리오 설명
case "$SCENARIO" in
  good)
    echo "✅ GOOD 시나리오: 모든 SLO 목표 달성"
    echo "   - LCP: 1000-2000ms (목표: <2500ms)"
    echo "   - FCP: 500-1500ms (목표: <1800ms)"
    echo "   - CLS: 0.01-0.08 (목표: <0.1)"
    echo "   - INP: 50-150ms (목표: <200ms)"
    ;;
  bad)
    echo "❌ BAD 시나리오: 모든 SLO 목표 실패"
    echo "   - LCP: 3000-5000ms (목표: <2500ms)"
    echo "   - FCP: 2500-4000ms (목표: <1800ms)"
    echo "   - CLS: 0.15-0.3 (목표: <0.1)"
    echo "   - INP: 300-500ms (목표: <200ms)"
    ;;
  mixed)
    echo "⚠️  MIXED 시나리오: 일부 SLO 목표 미달"
    echo "   - LCP: 1500-3500ms (목표: <2500ms)"
    echo "   - FCP: 1000-2500ms (목표: <1800ms)"
    echo "   - CLS: 0.05-0.15 (목표: <0.1)"
    echo "   - INP: 100-300ms (목표: <200ms)"
    ;;
  *)
    echo "❌ 잘못된 시나리오: $SCENARIO"
    echo "사용 가능한 시나리오: good, bad, mixed"
    exit 1
    ;;
esac

echo ""
echo "============================================"
echo ""

# 개발 서버 실행 확인
if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|301\|302"; then
  echo -e "${RED}❌ 서버가 실행 중이 아닙니다: $BASE_URL${NC}"
  echo ""
  echo "로컬 개발 서버를 먼저 시작하세요:"
  echo "  NEXT_PUBLIC_METRICS_ENABLED=true pnpm dev"
  echo ""
  echo "또는 배포된 서버 URL을 지정하세요:"
  echo "  bash scripts/test-slo-metrics.sh good 50 https://your-domain.com"
  exit 1
fi

echo -e "${GREEN}✅ 서버 연결 확인 완료${NC}"
echo ""

# 테스트 메트릭 생성
echo "📤 테스트 메트릭 전송 중..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/metrics/test?count=$COUNT&scenario=$SCENARIO")

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ 테스트 메트릭 전송 성공!${NC}"
  echo ""
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${RED}❌ 테스트 메트릭 전송 실패${NC}"
  echo "$RESPONSE"
  exit 1
fi

echo ""
echo "============================================"
echo ""
echo "⏳ CloudWatch 통계 집계 대기 중... (30초)"
echo "   (CloudWatch는 메트릭을 5분 단위로 집계합니다)"
sleep 30

echo ""
echo "🔍 SLO 검증 실행 중..."
echo ""

# SLO 검증 스크립트 실행
if bash scripts/verify-slo-cloudwatch.sh normal; then
  echo ""
  echo -e "${GREEN}✅ SLO 검증 완료!${NC}"

  if [ "$SCENARIO" = "good" ]; then
    echo -e "${GREEN}✅ 예상대로 GOOD 시나리오가 통과했습니다.${NC}"
  elif [ "$SCENARIO" = "bad" ]; then
    echo -e "${YELLOW}⚠️  주의: BAD 시나리오임에도 통과했습니다.${NC}"
    echo "   (데이터가 충분하지 않거나 기존 좋은 메트릭이 평균을 높였을 수 있습니다)"
  fi
else
  echo ""
  echo -e "${RED}❌ SLO 검증 실패${NC}"

  if [ "$SCENARIO" = "bad" ]; then
    echo -e "${GREEN}✅ 예상대로 BAD 시나리오가 실패했습니다.${NC}"
  elif [ "$SCENARIO" = "good" ]; then
    echo -e "${YELLOW}⚠️  주의: GOOD 시나리오임에도 실패했습니다.${NC}"
    echo "   (기존 나쁜 메트릭이 평균을 낮췄을 수 있습니다)"
  fi
fi

echo ""
echo "============================================"
echo ""
echo "📊 CloudWatch 콘솔에서 확인:"
echo "   https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-2#metricsV2:graph=~(metrics~(~(~'ReFit*2fFrontend~'LCP)))"
echo ""
echo "🔄 다시 테스트하려면:"
echo "   bash scripts/test-slo-metrics.sh good 50      # 좋은 성능"
echo "   bash scripts/test-slo-metrics.sh bad 50       # 나쁜 성능"
echo "   bash scripts/test-slo-metrics.sh mixed 50     # 혼합 성능"
echo ""
echo "============================================"
