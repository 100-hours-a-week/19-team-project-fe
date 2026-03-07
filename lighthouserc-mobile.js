const {
  LHCI_MONITORING_PAGE_NAMES,
  getLhciUrlFromPageName,
} = require('./src/shared/config/lighthouse/Lighthouse.js');

const BASE_URL = 'http://localhost:3000';
const urls = LHCI_MONITORING_PAGE_NAMES.map((name) => {
  const path = getLhciUrlFromPageName(name);
  if (typeof path !== 'string') {
    throw new Error(`Missing LHCI URL mapping for page: ${name}`);
  }
  return `${BASE_URL}${path}`;
});

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 120000,
      chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage --disable-gpu',
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
