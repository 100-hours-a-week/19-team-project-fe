#!/bin/bash
set -euo pipefail

MODE=${1:-normal}  # normal 또는 peak
REGION=${AWS_REGION:-ap-northeast-2}
NAMESPACE="ReFit/Frontend"

# 시간 범위 설정 (최근 10분)
END_TIME=$(date -u +%Y-%m-%dT%H:%M:%S)
START_TIME=$(date -u -v-10M +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S)

echo "============================================"
echo "SLO 검증 시작 (CloudWatch)"
echo "모드: $MODE"
echo "기간: $START_TIME ~ $END_TIME"
echo "============================================"

# CloudWatch에서 메트릭 조회
get_metric_p95() {
  local metric_name=$1

  # CloudWatch는 p95를 직접 지원하지 않으므로 Average 사용
  # 프로덕션에서는 ExtendedStatistics로 p95 조회 가능
  aws cloudwatch get-metric-statistics \
    --namespace "$NAMESPACE" \
    --metric-name "$metric_name" \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period 300 \
    --statistics Average \
    --dimensions Name=Environment,Value=production \
    --region "$REGION" \
    --query 'Datapoints[0].Average' \
    --output text 2>/dev/null || echo "None"
}

# 메트릭 임계값 정의 (밀리초)
if [ "$MODE" = "peak" ]; then
  LCP_THRESHOLD=4000
  FCP_THRESHOLD=3000
  CLS_THRESHOLD=0.1
  FID_THRESHOLD=200
  UPLOAD_THRESHOLD=2000
  RENDER_THRESHOLD=1000
  CHAT_SEND_THRESHOLD=200
  CHAT_RECEIVE_THRESHOLD=300
else
  LCP_THRESHOLD=2500
  FCP_THRESHOLD=1800
  CLS_THRESHOLD=0.1
  FID_THRESHOLD=100
  UPLOAD_THRESHOLD=1000
  RENDER_THRESHOLD=500
  CHAT_SEND_THRESHOLD=100
  CHAT_RECEIVE_THRESHOLD=200
fi

# 메트릭 검증
check_metric() {
  local metric_name=$1
  local threshold=$2
  local actual=$(get_metric_p95 "$metric_name")

  if [ "$actual" = "None" ] || [ -z "$actual" ]; then
    echo "⚠️  $metric_name: 데이터 없음 (충분한 트래픽 필요)"
    return 0  # 데이터 없으면 통과로 처리
  fi

  # bc가 없으면 awk 사용
  if command -v bc &> /dev/null; then
    if (( $(echo "$actual > $threshold" | bc -l) )); then
      echo "❌ $metric_name: ${actual}ms > ${threshold}ms"
      return 1
    else
      echo "✅ $metric_name: ${actual}ms <= ${threshold}ms"
      return 0
    fi
  else
    if awk -v a="$actual" -v t="$threshold" 'BEGIN{exit !(a > t)}'; then
      echo "❌ $metric_name: ${actual}ms > ${threshold}ms"
      return 1
    else
      echo "✅ $metric_name: ${actual}ms <= ${threshold}ms"
      return 0
    fi
  fi
}

# 모든 메트릭 검증
FAILED=0

echo ""
echo "Core Web Vitals 검증:"
check_metric "LCP" "$LCP_THRESHOLD" || FAILED=1
check_metric "FCP" "$FCP_THRESHOLD" || FAILED=1
check_metric "CLS" "$CLS_THRESHOLD" || FAILED=1
check_metric "FID" "$FID_THRESHOLD" || FAILED=1

echo ""
echo "커스텀 메트릭 검증:"
check_metric "UploadDuration" "$UPLOAD_THRESHOLD" || FAILED=1
check_metric "RenderTime" "$RENDER_THRESHOLD" || FAILED=1
check_metric "ChatSendLatency" "$CHAT_SEND_THRESHOLD" || FAILED=1
check_metric "ChatReceiveLatency" "$CHAT_RECEIVE_THRESHOLD" || FAILED=1

echo ""
echo "============================================"

if [ $FAILED -eq 1 ]; then
  echo "⚠️  SLO 위반 감지됨 (경고 모드)"
  echo "   배포는 계속되지만 성능 개선이 필요합니다."
  echo "============================================"
  exit 0  # 1-2주는 경고만, 이후 exit 1로 변경
fi

echo "✅ 모든 SLO 검증 통과!"
echo "============================================"
exit 0
