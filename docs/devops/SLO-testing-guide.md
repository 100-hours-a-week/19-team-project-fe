# SLO 검증 테스트 가이드

실제 트래픽 없이 SLO 검증 시스템을 테스트하는 방법을 안내합니다.

## 목차

1. [방법 1: 테스트 API로 가상 메트릭 생성](#방법-1-테스트-api로-가상-메트릭-생성)
2. [방법 2: 실제 브라우저 시뮬레이션](#방법-2-실제-브라우저-시뮬레이션)
3. [방법 3: AWS CLI로 직접 메트릭 주입](#방법-3-aws-cli로-직접-메트릭-주입)
4. [테스트 시나리오](#테스트-시나리오)
5. [문제 해결](#문제-해결)

---

## 방법 1: 테스트 API로 가상 메트릭 생성

**가장 빠르고 간단한 방법**입니다. 서버가 자동으로 가상 메트릭을 CloudWatch에 전송합니다.

### 1.1 로컬 개발 서버 시작

```bash
# 메트릭 테스트 활성화
NEXT_PUBLIC_METRICS_ENABLED=true pnpm dev
```

### 1.2 테스트 스크립트 실행

```bash
# GOOD 시나리오 (모든 SLO 통과)
bash scripts/test-slo-metrics.sh good 50

# BAD 시나리오 (모든 SLO 실패)
bash scripts/test-slo-metrics.sh bad 50

# MIXED 시나리오 (일부 SLO 실패)
bash scripts/test-slo-metrics.sh mixed 50
```

### 1.3 결과 확인

스크립트가 자동으로:
1. 가상 메트릭 생성 (50개)
2. CloudWatch에 전송
3. 30초 대기 (통계 집계)
4. SLO 검증 실행
5. 결과 출력

**예상 출력:**

```
============================================
📊 SLO 테스트 메트릭 생성기
============================================

시나리오: good
메트릭 개수: 50
대상 서버: http://localhost:3000

✅ GOOD 시나리오: 모든 SLO 목표 달성
   - LCP: 1000-2000ms (목표: <2500ms)
   - FCP: 500-1500ms (목표: <1800ms)
   - CLS: 0.01-0.08 (목표: <0.1)
   - INP: 50-150ms (목표: <200ms)

============================================

✅ 서버 연결 확인 완료

📤 테스트 메트릭 전송 중...
✅ 테스트 메트릭 전송 성공!

{
  "success": true,
  "message": "50개의 테스트 메트릭 생성 완료",
  "scenario": "good",
  "totalMetrics": 250
}

============================================

⏳ CloudWatch 통계 집계 대기 중... (30초)

🔍 SLO 검증 실행 중...

============================================
SLO 검증 시작 (CloudWatch)
모드: normal
============================================

Core Web Vitals 검증:
✅ LCP: 1523ms <= 2500ms
✅ FCP: 1042ms <= 1800ms
✅ CLS: 0.06 <= 0.1
✅ INP: 98ms <= 200ms

============================================
✅ 모든 SLO 검증 통과!
============================================
```

### 1.4 배포된 서버 테스트

```bash
# 프로덕션 서버에서 테스트
bash scripts/test-slo-metrics.sh good 50 https://refit.com
```

---

## 방법 2: 실제 브라우저 시뮬레이션

**실제 사용자 경험에 가장 가까운 방법**입니다. Puppeteer로 브라우저를 제어하여 진짜 Core Web Vitals를 측정합니다.

### 2.1 Puppeteer 설치

```bash
pnpm add -D puppeteer
```

### 2.2 시뮬레이션 실행

```bash
# 로컬 서버 (빠른 네트워크)
node scripts/simulate-user-traffic.mjs http://localhost:3000 10 fast

# 느린 네트워크 시뮬레이션
node scripts/simulate-user-traffic.mjs http://localhost:3000 20 slow

# 3G 네트워크 시뮬레이션
node scripts/simulate-user-traffic.mjs https://refit.com 30 3g
```

### 2.3 동작 방식

1. **Puppeteer가 실제 Chrome 브라우저 실행**
2. **페이지 방문** (지정된 횟수만큼)
3. **랜덤 사용자 행동 시뮬레이션**
   - 클릭
   - 스크롤
   - 키보드 입력
   - 2-5초 체류
4. **Core Web Vitals 자동 측정** (MetricsInitializer가 실행)
5. **CloudWatch에 자동 전송**

### 2.4 네트워크 프로파일

| 프로파일 | 다운로드 속도 | 업로드 속도 | 지연 시간 | 용도 |
|---------|-------------|-----------|---------|------|
| `fast` | 제한 없음 | 제한 없음 | 0ms | 최적 환경 테스트 |
| `slow` | 1.6 Mbps | 750 Kbps | 40ms | 일반 환경 |
| `3g` | 1.6 Mbps | 768 Kbps | 150ms | 모바일 3G |
| `4g` | 4 Mbps | 3 Mbps | 20ms | 모바일 4G |

---

## 방법 3: AWS CLI로 직접 메트릭 주입

**가장 직접적인 방법**입니다. 서버 없이 CloudWatch에 바로 메트릭을 전송합니다.

### 3.1 단일 메트릭 전송

```bash
# LCP 메트릭 전송
aws cloudwatch put-metric-data \
  --namespace "ReFit/Frontend" \
  --metric-name "LCP" \
  --value 2300 \
  --unit Milliseconds \
  --dimensions Environment=production,Page=/,Rating=good \
  --region ap-northeast-2
```

### 3.2 배치 메트릭 전송

```bash
# 스크립트로 여러 메트릭 전송
bash /private/tmp/claude/.../scratchpad/send-test-web-vitals.sh
```

---

## 테스트 시나리오

### 시나리오 1: 정상 배포 (GOOD)

**목적**: SLO 검증이 좋은 성능을 제대로 감지하는지 확인

```bash
bash scripts/test-slo-metrics.sh good 50
```

**예상 결과**:
- ✅ 모든 Core Web Vitals 통과
- ✅ SLO 검증 성공
- Discord: "✅ SLO 검증 통과" 메시지

### 시나리오 2: 성능 저하 감지 (BAD)

**목적**: SLO 검증이 나쁜 성능을 제대로 감지하는지 확인

```bash
bash scripts/test-slo-metrics.sh bad 50
```

**예상 결과**:
- ❌ 대부분의 Core Web Vitals 실패
- ⚠️ SLO 검증 실패 (경고)
- Discord: "⚠️ SLO 위반 감지 (경고)" 메시지

### 시나리오 3: 혼합 성능 (MIXED)

**목적**: 경계 케이스 테스트

```bash
bash scripts/test-slo-metrics.sh mixed 50
```

**예상 결과**:
- ⚠️ 일부 메트릭 통과, 일부 실패
- 결과는 랜덤하게 통과/실패 가능

### 시나리오 4: CD 워크플로우 통합 테스트

**목적**: 실제 배포 시나리오 테스트

```bash
# 1. GOOD 메트릭 생성
bash scripts/test-slo-metrics.sh good 100

# 2. 5분 대기 (CD 워크플로우와 동일)
sleep 300

# 3. SLO 검증 실행
bash scripts/verify-slo-cloudwatch.sh normal

# 4. 결과 확인
echo "Exit code: $?"
```

---

## CloudWatch 메트릭 확인

### AWS 콘솔

1. [CloudWatch 콘솔](https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-2#metricsV2:) 접속
2. **Metrics** → **All metrics** → **ReFit/Frontend**
3. 메트릭 선택:
   - LCP
   - FCP
   - CLS
   - INP
   - TTFB

### AWS CLI

```bash
# 모든 메트릭 목록 확인
aws cloudwatch list-metrics \
  --namespace "ReFit/Frontend" \
  --region ap-northeast-2

# LCP 통계 확인
aws cloudwatch get-metric-statistics \
  --namespace "ReFit/Frontend" \
  --metric-name "LCP" \
  --start-time "$(date -u -v-10M +%Y-%m-%dT%H:%M:%S)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
  --period 300 \
  --statistics Average,Maximum \
  --dimensions Name=Environment,Value=production \
  --region ap-northeast-2
```

---

## 문제 해결

### 1. "데이터 없음" 경고

**증상**:
```
⚠️  LCP: 데이터 없음 (충분한 트래픽 필요)
```

**원인**:
- CloudWatch 통계 집계 지연 (5-10분 소요)
- 메트릭이 아직 전송되지 않음

**해결**:
```bash
# 더 오래 대기
sleep 600  # 10분

# 또는 메트릭 확인
aws cloudwatch list-metrics --namespace "ReFit/Frontend" --region ap-northeast-2
```

### 2. "Test metrics are disabled in production"

**증상**:
```json
{"error": "Test metrics are disabled in production"}
```

**원인**: 프로덕션 환경에서 테스트 API가 비활성화됨

**해결**:
```bash
# EC2 서버의 .env.production에 추가
ENABLE_TEST_METRICS=true

# PM2 재시작
pm2 restart frontend
```

### 3. 서버 연결 실패

**증상**:
```
❌ 서버가 실행 중이 아닙니다: http://localhost:3000
```

**해결**:
```bash
# 로컬 개발 서버 시작
NEXT_PUBLIC_METRICS_ENABLED=true pnpm dev

# 또는 배포된 서버 URL 지정
bash scripts/test-slo-metrics.sh good 50 https://refit.com
```

### 4. AWS 권한 오류

**증상**:
```
AccessDenied: User is not authorized to perform: cloudwatch:PutMetricData
```

**해결**:
- EC2 IAM 역할에 CloudWatch 권한 추가
- 또는 AWS 액세스 키 설정 확인

---

## 자주 묻는 질문 (FAQ)

### Q1: 몇 개의 메트릭을 생성해야 하나요?

**A**: 최소 20개 이상 권장합니다.
- 20개: 빠른 테스트
- 50개: 일반 테스트
- 100개: 안정적인 통계

### Q2: CloudWatch 비용이 발생하나요?

**A**: 네, 커스텀 메트릭 비용이 발생합니다.
- 메트릭당: $0.30/월
- 테스트 50회: ~250개 메트릭 → 약 $0.01
- 실제 운영: ~$5-8/월

### Q3: 테스트 메트릭을 삭제할 수 있나요?

**A**: CloudWatch 메트릭은 자동으로 15개월 후 삭제됩니다. 수동 삭제는 불가능하지만, 테스트 메트릭은 `Environment=test` 차원으로 구분됩니다.

### Q4: BAD 시나리오인데 통과했어요.

**A**: 기존 GOOD 메트릭과 평균이 계산됩니다.
```bash
# CloudWatch 메트릭 삭제 불가능하므로
# 새로운 네임스페이스 사용
# (코드에서 Namespace를 "ReFit/Frontend/Test"로 변경)
```

### Q5: 실제 배포 전에 테스트하고 싶어요.

**A**: Staging 환경에서 테스트하세요.
```bash
# Staging 서버에서
bash scripts/test-slo-metrics.sh good 100 https://staging.refit.com
sleep 300
bash scripts/verify-slo-cloudwatch.sh normal
```

---

## 참고 자료

- [CloudWatch 메트릭 문서](https://docs.aws.amazon.com/cloudwatch/latest/monitoring/working_with_metrics.html)
- [Core Web Vitals 가이드](https://web.dev/vitals/)
- [Puppeteer 문서](https://pptr.dev/)
- [SLI/SLO 정의서](./SLI-SLO.md)
- [SLO 검증 계획](./SLO-verification-plan.md)
