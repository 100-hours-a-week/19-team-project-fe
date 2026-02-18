# SST environment 블록이 .env.local 환경변수를 빈 문자열로 덮어쓰는 문제

## 증상

- `.env.local`에 `NEXT_PUBLIC_API_BASE_URL=https://dev.re-fit.kr` 설정 완료
- `npx sst deploy --stage dev` 재배포 완료
- CloudFront 캐시 무효화 정상 (`DistributionInvalidation` 로그 확인)
- **그런데 클라이언트 JS 번들에 값이 인라인되지 않음**
- API 요청이 `https://dev.re-fit.kr/api/...`가 아닌 `https://<cloudfront>/api/...`로 전송됨

## 원인

`sst.config.ts`의 `environment` 블록에서 `process.env`는 **쉘(shell) 환경변수**를 읽는다. `.env.local` 파일이 아니다.

```typescript
// ❌ 문제 코드
environment: {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
}
```

### 동작 순서

1. `npx sst deploy` 실행
2. `sst.config.ts`에서 `process.env.NEXT_PUBLIC_API_BASE_URL` 참조 → 쉘에 없으므로 `undefined`
3. `?? ''` nullish coalescing → 빈 문자열 `''`
4. SST가 `NEXT_PUBLIC_API_BASE_URL=''`을 OpenNext 빌드 환경에 주입
5. Next.js 빌드 시 환경변수 우선순위: **`process.env` (SST 주입) > `.env.local`**
6. 빈 문자열이 `.env.local` 값을 덮어씀
7. 클라이언트 번들에 `NEXT_PUBLIC_API_BASE_URL=""`로 인라인

### 핵심 포인트

- Next.js 환경변수 우선순위: `process.env` (런타임) > `.env.local` > `.env`
- **빈 문자열 `''`도 "정의된 값"**이므로 `.env.local`보다 우선한다
- `undefined`여야 `.env.local` fallback이 동작한다

## 해결

쉘에 값이 없으면 `environment` 객체에 포함하지 않도록 변경한다.

```typescript
// ✅ 수정 코드
const envKeys = [
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_KAKAO_REDIRECT_URL',
  'NEXT_PUBLIC_WS_URL',
  'NEXT_PUBLIC_API_PATH_SUFFIX',
  'NEXT_PUBLIC_API_PATH_SUFFIX_TARGETS',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_METRICS_ENABLED',
] as const;

const environment: Record<string, string> = {};
for (const key of envKeys) {
  if (process.env[key]) {
    environment[key] = process.env[key];
  }
}

new sst.aws.Nextjs('ReFitWeb', {
  environment, // 쉘에 없는 변수는 포함되지 않음 → .env.local fallback 동작
});
```

## 검증 방법

배포 후 JS 번들에 값이 인라인됐는지 확인:

```bash
# 1. 로그인 페이지에서 JS 번들 URL 추출 후 값 검색
curl -s https://<cloudfront-url>/login \
  | grep -o '_next/static/[^"]*\.js' \
  | while read js; do
      result=$(curl -s "https://<cloudfront-url>/$js" | grep -c 'dev\.re-fit\.kr')
      if [ "$result" -gt 0 ]; then echo "FOUND in $js"; fi
    done

# 2. 브라우저 DevTools → Network 탭에서 카카오 로그인 요청 URL 확인
#    https://dev.re-fit.kr/api/... 로 시작해야 정상
```

## 환경별 동작 비교

| 시나리오 | 쉘 환경변수 | `.env.local` | 빌드 결과 |
|---------|-----------|-------------|----------|
| 로컬 배포 (수정 전) | 없음 → `''` 주입 | `https://dev.re-fit.kr` | `''` (버그) |
| 로컬 배포 (수정 후) | 없음 → 미포함 | `https://dev.re-fit.kr` | `https://dev.re-fit.kr` |
| CI/CD (GitHub Actions) | Secrets에서 주입 | 없음 | Secrets 값 |
