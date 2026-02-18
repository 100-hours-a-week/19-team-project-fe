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

    new sst.aws.Nextjs('ReFitWeb', {
      warm: 1,
      server: {
        memory: '1024 MB',
        timeout: '30 seconds',
      },
      environment,
    });
  },
});
