const TARGET_URL = process.env.LHCI_TARGET_URL || 'https://re-fit.kr';

module.exports = {
  ci: {
    collect: {
      url: [TARGET_URL],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        extraHeaders: {
          'x-lighthouse-run': '1',
        },
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lhci_reports/desktop',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
};
