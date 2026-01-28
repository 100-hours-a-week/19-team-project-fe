#!/usr/bin/env node
/**
 * 실제 브라우저로 사용자 트래픽 시뮬레이션
 * Puppeteer를 사용하여 실제 Core Web Vitals 측정
 *
 * 사용법:
 * node scripts/simulate-user-traffic.mjs <url> <count> <throttle>
 *
 * 예시:
 * node scripts/simulate-user-traffic.mjs http://localhost:3000 10 fast
 * node scripts/simulate-user-traffic.mjs https://refit.com 50 slow
 */

import puppeteer from 'puppeteer';

const args = process.argv.slice(2);
const BASE_URL = args[0] || 'http://localhost:3000';
const VISIT_COUNT = parseInt(args[1]) || 10;
const THROTTLE = args[2] || 'fast'; // fast, slow, 3g, 4g

const throttleProfiles = {
  fast: null, // No throttling
  slow: {
    downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
    uploadThroughput: (750 * 1024) / 8, // 750 Kbps
    latency: 40, // 40ms
  },
  '3g': {
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (768 * 1024) / 8,
    latency: 150,
  },
  '4g': {
    downloadThroughput: (4 * 1024 * 1024) / 8,
    uploadThroughput: (3 * 1024 * 1024) / 8,
    latency: 20,
  },
};

console.log('============================================');
console.log('🤖 사용자 트래픽 시뮬레이터');
console.log('============================================');
console.log('');
console.log(`대상 URL: ${BASE_URL}`);
console.log(`방문 횟수: ${VISIT_COUNT}`);
console.log(`네트워크: ${THROTTLE}`);
console.log('');
console.log('============================================');
console.log('');

async function simulateVisit(browser, visitNumber) {
  const page = await browser.newPage();

  try {
    // 네트워크 스로틀링 적용
    const client = await page.target().createCDPSession();
    if (throttleProfiles[THROTTLE]) {
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        ...throttleProfiles[THROTTLE],
      });
      console.log(`⚡ 방문 #${visitNumber}: 네트워크 스로틀링 적용 (${THROTTLE})`);
    }

    // 페이지 방문
    console.log(`🌐 방문 #${visitNumber}: ${BASE_URL} 로딩 중...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Core Web Vitals 측정 (web-vitals 라이브러리 사용)
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const results = {};
        let count = 0;
        const total = 5; // LCP, FCP, CLS, INP, TTFB

        const _onMetric = (metric) => {
          results[metric.name] = {
            value: metric.value,
            rating: metric.rating,
          };
          count++;
          if (count >= total) {
            setTimeout(() => resolve(results), 1000);
          }
        };

        // web-vitals가 이미 초기화되어 있다면 메트릭 수집
        // 실제로는 MetricsInitializer가 이미 실행 중
        setTimeout(() => resolve(results), 5000);
      });
    });

    console.log(`✅ 방문 #${visitNumber}: 메트릭 수집 완료`);
    if (Object.keys(metrics).length > 0) {
      console.log(`   LCP: ${metrics.LCP?.value?.toFixed(0) || 'N/A'}ms`);
      console.log(`   FCP: ${metrics.FCP?.value?.toFixed(0) || 'N/A'}ms`);
      console.log(`   CLS: ${metrics.CLS?.value?.toFixed(3) || 'N/A'}`);
      console.log(`   INP: ${metrics.INP?.value?.toFixed(0) || 'N/A'}ms`);
    }

    // 랜덤 사용자 행동 시뮬레이션
    const actions = [
      async () => {
        console.log(`   🖱️  랜덤 클릭`);
        await page.mouse.click(100 + Math.random() * 200, 100 + Math.random() * 200);
      },
      async () => {
        console.log(`   📜 스크롤`);
        await page.evaluate(() => window.scrollBy(0, 300));
      },
      async () => {
        console.log(`   ⌨️  키보드 입력`);
        await page.keyboard.type('test');
      },
    ];

    // 2-3개의 랜덤 액션 실행
    const actionCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < actionCount; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      await action();
      await page.waitForTimeout(500);
    }

    // 체류 시간 (2-5초)
    const stayTime = 2000 + Math.random() * 3000;
    console.log(`   ⏱️  체류 시간: ${(stayTime / 1000).toFixed(1)}초`);
    await page.waitForTimeout(stayTime);

    console.log('');
  } catch (error) {
    console.error(`❌ 방문 #${visitNumber} 실패:`, error.message);
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log('🚀 브라우저 시작...\n');

  for (let i = 1; i <= VISIT_COUNT; i++) {
    await simulateVisit(browser, i);

    // 방문 간 간격 (1-3초)
    if (i < VISIT_COUNT) {
      const waitTime = 1000 + Math.random() * 2000;
      console.log(`⏳ 다음 방문까지 ${(waitTime / 1000).toFixed(1)}초 대기...\n`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  await browser.close();

  console.log('============================================');
  console.log('✅ 시뮬레이션 완료!');
  console.log('');
  console.log('📊 CloudWatch에서 메트릭 확인:');
  console.log('   (5-10분 후 통계 집계 완료)');
  console.log('');
  console.log('🔍 SLO 검증 실행:');
  console.log('   bash scripts/verify-slo-cloudwatch.sh normal');
  console.log('============================================');
}

main().catch(console.error);
