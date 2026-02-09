import type { CareerLevel } from './career';
import type { Job } from './job';
import type { Skill } from './skill';

export type OnboardingMetadataResponse = {
  jobs: Job[];
  career_levels: CareerLevel[];
  skills: Skill[];
};
