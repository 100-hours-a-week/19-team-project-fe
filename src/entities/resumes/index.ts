export { getResumes } from './api/getResumes';
export { createResume } from './api/createResume';
export { getResumeDetail } from './api/getResumeDetail';
export { deleteResume } from './api/deleteResume';
export { updateResumeTitle } from './api/updateResumeTitle';
export { updateResume } from './api/updateResume';
export { parseResumeSync } from './api/parseResumeSync';
export type { Resume, ResumesResponse } from './api/getResumes';
export type { CreateResumePayload, CreateResumeResponse } from './api/createResume';
export type { ResumeDetail } from './api/getResumeDetail';
export type { UpdateResumeTitlePayload } from './api/updateResumeTitle';
export type { UpdateResumePayload } from './api/updateResume';
export type {
  ResumeParseContentJson,
  ResumeParseProject,
  ResumeParseSyncData,
  ResumeParseSyncRequest,
  ResumeParseSyncResult,
} from './api/parseResumeSync';
export {
  normalizeResumeContent,
  normalizeResumeDetail,
  toStringArray,
} from './lib/normalizeResumeDetail';
