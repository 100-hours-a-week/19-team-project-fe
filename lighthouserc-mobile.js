const {
  LHCI_MONITORING_PAGE_NAMES,
  getLhciUrlFromPageName,
} = require('./src/shared/config/lighthouse/Lighthouse.js');

const BASE_URL = 'http://localhost:3000';
const urls = LHCI_MONITORING_PAGE_NAMES.map(
  (name) => `${BASE_URL}${getLhciUrlFromPageName(name)}`
);

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 120000,
      chromeFlags: '--headless=new --no-sandbox --disable-dev-shm-usage',
      url: urls,
      numberOfRuns: 1,
      settings: {
        maxWaitForLoad: 90000,
        throttlingMethod: 'provided',
        extraHeaders: {
          'x-lighthouse-run': '1',
        },
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lhci_reports/mobile',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
};
