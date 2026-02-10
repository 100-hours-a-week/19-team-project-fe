export type OAuthProvider = 'KAKAO';

export type UserType = 'JOB_SEEKER' | 'EXPERT';

export type SignupSkill = {
  skill_id: number;
  display_order: number;
};

export type SignupRequest = {
  oauth_provider: OAuthProvider;
  oauth_id: string;
  email: string;
  company_email?: string;
  nickname: string;
  user_type: UserType;
  career_level_id: number;
  job_ids: number[];
  skills: SignupSkill[];
  introduction: string;
  terms_agreed: boolean;
};

export type SignupResponse = {
  user_id: number;
  access_token: string;
  refresh_token: string;
};
