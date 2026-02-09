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
      startServerReadyPattern: 'ready - started server',
      url: urls,
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lhci_reports/desktop',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
};
