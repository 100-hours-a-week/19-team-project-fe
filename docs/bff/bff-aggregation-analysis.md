# BFF Aggregation Candidates (AST)

| Page | Widgets | API Calls | Count |
|---|---|---:|---:|
| / | Footer, Header, SearchBar, SplashGate, HomeGuardToast, RecruitmentLinksTicker, SignupConfetti, TechBlogBanner, TechBlogTicker | - | 0 |
| /chat | ChatList, Footer | getChatList, getUserMe | 2 |
| /chat/[chatId] | - | - | 0 |
| /chat/[chatId]/detail | - | - | 0 |
| /experts | ExpertSearchPage | getExperts | 1 |
| /experts/[id] | ExpertDetailPage | createChat, getChatList, getExpertDetail, getMe, getResumes | 5 |
| /me | MyPage | getUserMe | 1 |
| /me/edit | MyPageEdit | checkNickname, createPresignedUrl, getCareerLevels, getJobs, getSkills, getUserMe, updateUserMe, uploadToPresignedUrl | 8 |
| /me/verify | MyPageVerify | sendEmailVerification, verifyEmailVerification | 2 |
| /oauth/kakao/callback | KakaoCallbackClient | kakaoLogin | 1 |
| /onboarding | OnboardingRoleSelect | - | 0 |
| /onboarding/profile | OnboardingProfileForm | checkNickname, getCareerLevels, getJobs, getSkills, sendEmailVerification, signup, verifyEmailVerification | 7 |
| /report | Footer, Header | - | 0 |
| /resume | ResumePage | deleteResume, getResumes | 2 |
| /resume/[resumeId] | ResumeDetailPage | getResumeDetail | 1 |
| /resume/edit | ResumeEditPage | createPresignedUrl, createResume, getResumeDetail, parseResumeSync, updateResume, uploadToPresignedUrl | 6 |
