module.exports = {
  // Google Spreadsheet ID (docs.google.com/spreadsheets/d/<ID>/...)
  LHCI_GOOGLE_SPREAD_SHEET_ID: '1edhiAL65Vy1IDJTa2bXuYlLPKnsDY2F2bCiGZW6LETA',

  // Lighthouse score thresholds
  LHCI_GREEN_MIN_SCORE: 90,
  LHCI_ORANGE_MIN_SCORE: 50,
  LHCI_RED_MIN_SCORE: 0,

  // Page names to monitor (order matters for reporting)
  LHCI_MONITORING_PAGE_NAMES: [
    'Home',
    'Login',
    'Onboarding',
    'OnboardingProfile',
    'Experts',
    'Report',
    'Chat',
    'Me',
    'MeEdit',
    'MeVerify',
    'Resume',
    'ResumeEdit',
    'OauthKakaoCallback',
  ],

  // Page name -> URL path mapping
  LHCI_PAGE_NAME_TO_URL: {
    Home: '/',
    Login: '/login',
    Onboarding: '/onboarding',
    OnboardingProfile: '/onboarding/profile',
    Experts: '/experts',
    Report: '/report',
    Chat: '/chat',
    Me: '/me',
    MeEdit: '/me/edit',
    MeVerify: '/me/verify',
    Resume: '/resume',
    ResumeEdit: '/resume/edit',
    OauthKakaoCallback: '/oauth/kakao/callback',
  },

  // Page name -> Google Sheet tab ID mapping
  LHCI_PAGE_NAME_TO_SHEET_ID: {
    Home: 0,
    Login: 2111283884,
    Onboarding: 971910900,
    OnboardingProfile: 1683318239,
    Experts: 1856451620,
    Report: 982141547,
    Chat: 950860914,
    Me: 1514673424,
    MeEdit: 569525802,
    MeVerify: 1491329263,
    Resume: 712819092,
    ResumeEdit: 1003349984,
    OauthKakaoCallback: 439658281,
  },

  getLhciPageNameFromUrl: (url) => {
    for (const [name, path] of Object.entries(module.exports.LHCI_PAGE_NAME_TO_URL)) {
      if (decodeURIComponent(path) === decodeURIComponent(url)) return name;
    }
    return undefined;
  },

  getLhciUrlFromPageName: (name) => module.exports.LHCI_PAGE_NAME_TO_URL[name],

  getLhciSheetIdFromPageName: (name) => module.exports.LHCI_PAGE_NAME_TO_SHEET_ID[name],
};
