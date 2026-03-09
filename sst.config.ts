/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 're-fit',
      removal: input?.stage === 'prod' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        aws: {
          region: 'ap-northeast-2',
        },
      },
    };
  },
  async run() {
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

    const BACKEND_ORIGIN_ID = 'backendAlb';
    const rawApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!rawApiUrl) throw new Error('NEXT_PUBLIC_API_BASE_URL is required');
    const BACKEND_DOMAIN = rawApiUrl.replace(/^https?:\/\//, '').trim();
    const BACKEND_PATH_PATTERNS = ['/swagger-ui/*', '/v3/api-docs*', '/actuator/*'];

    new sst.aws.Nextjs('ReFitWeb', {
      domain: {
        name: 're-fit.kr',
        cert: process.env.ACM_CERTIFICATE_ARN,
        dns: false,
      },
      warm: 3,
      streaming: true,
      server: {
        memory: '1769 MB',
        timeout: '30 seconds',
      },
      environment,
      transform: {
        cdn: (args) => {
          args.origins = $resolve(args.origins).apply((origins) => [
            ...origins,
            {
              domainName: BACKEND_DOMAIN,
              originId: BACKEND_ORIGIN_ID,
              customOriginConfig: {
                httpPort: 80,
                httpsPort: 443,
                originProtocolPolicy: 'https-only',
                originSslProtocols: ['TLSv1.2'],
              },
            },
          ]);

          args.orderedCacheBehaviors = $resolve(
            args.orderedCacheBehaviors ?? [],
          ).apply((behaviors) => [
            ...behaviors,
            ...BACKEND_PATH_PATTERNS.map((pathPattern) => ({
              pathPattern,
              targetOriginId: BACKEND_ORIGIN_ID,
              viewerProtocolPolicy: 'redirect-to-https' as const,
              allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
              cachedMethods: ['GET', 'HEAD'],
              compress: true,
              forwardedValues: {
                queryString: true,
                headers: ['Authorization'],
                cookies: { forward: 'none' },
              },
            })),
          ]);
        },
      },
    });
  },
});
