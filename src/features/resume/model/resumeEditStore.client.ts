'use client';

import { create } from 'zustand';

import type {
  ResumeDetail,
  ResumeParseContentJson,
  ResumeParseTaskResult,
} from '@/entities/resumes';

export type CareerItem = {
  id: string;
  company: string;
  period: string;
  role: string;
  title: string;
};

export type ProjectItem = {
  id: string;
  title: string;
  period: string;
  description: string;
};

type ContentProjectItem = {
  title?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
};

type ContentCareerItem = {
  company?: string;
  company_name?: string;
  job?: string;
  position?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
};

export type SimpleItem = {
  id: string;
  value: string;
};

export const EDUCATION_OPTIONS = [
  '고등학교 졸업',
  '2년제 재학/휴학',
  '2년제 졸업',
  '4년제 재학/휴학',
  '4년제 졸업',
] as const;

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptyCareer = (): CareerItem => ({
  id: createId(),
  company: '',
  period: '',
  role: '',
  title: '',
});

const createEmptyProject = (): ProjectItem => ({
  id: createId(),
  title: '',
  period: '',
  description: '',
});

const createEmptySimpleItem = (): SimpleItem => ({ id: createId(), value: '' });

const mapEducationLevel = (
  educationLevel: string,
  fallbackList: string[],
  allowedLevels: readonly string[],
): string | null => {
  const normalized = educationLevel.trim();
  if (allowedLevels.includes(normalized)) return normalized;

  const listMatch = fallbackList.find((item) => allowedLevels.includes(item));
  if (listMatch) return listMatch;

  if (/고등학교/.test(normalized)) return '고등학교 졸업';
  if (/2년제/.test(normalized) && /재학|휴학/.test(normalized)) return '2년제 재학/휴학';
  if (/2년제/.test(normalized)) return '2년제 졸업';
  if (/4년제/.test(normalized) && /재학|휴학/.test(normalized)) return '4년제 재학/휴학';
  if (/4년제/.test(normalized)) return '4년제 졸업';

  return null;
};

const toSimpleItems = (values: string[]): SimpleItem[] => {
  if (!values.length) return [createEmptySimpleItem()];
  return values.map((value) => ({ id: createId(), value }));
};

const toReadableText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';

  const record = value as Record<string, unknown>;
  const candidate =
    record.value ??
    record.name ??
    record.title ??
    record.description ??
    record.award ??
    record.activity ??
    '';
  return typeof candidate === 'string' ? candidate.trim() : '';
};

const toTextArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map(toReadableText).filter(Boolean);
};

const normalizeYearMonth = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const normalized = trimmed.replace(/[./]/g, '-');
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(normalized)) {
    return normalized.slice(0, 7);
  }
  return trimmed;
};

const formatDateToken = (value: string) => {
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(value)) {
    return value.replace(/-/g, '.');
  }
  return value;
};

const buildPeriodFromDates = (start?: string, end?: string, isCurrent?: boolean) => {
  const startValue = start ? formatDateToken(start) : '';
  const endValue = end ? formatDateToken(end) : isCurrent ? 'Present' : '';
  return [startValue, endValue].filter(Boolean).join(' - ');
};

const normalizeCareerItems = (value: unknown): CareerItem[] => {
  if (!Array.isArray(value)) {
    return [createEmptyCareer()];
  }

  const parsed = value
    .map((item) => {
      if (typeof item === 'string') {
        const [company = '', period = '', role = '', titleValue = ''] = item
          .split('|')
          .map((entry) => entry.trim());
        return { id: createId(), company, period, role, title: titleValue };
      }
      if (item && typeof item === 'object') {
        const career = item as ContentCareerItem;
        const company = career.company ?? career.company_name ?? '';
        const role = career.job ?? '';
        const titleValue = career.position ?? '';
        const period = buildPeriodFromDates(career.start_date, career.end_date, career.is_current);
        return { id: createId(), company, period, role, title: titleValue };
      }
      return null;
    })
    .filter((item): item is CareerItem => Boolean(item));

  return parsed.length ? parsed : [createEmptyCareer()];
};

const normalizeProjectItems = (value: unknown): ProjectItem[] => {
  if (!Array.isArray(value)) return [createEmptyProject()];

  const parsed = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const project = item as ContentProjectItem;
      return {
        id: createId(),
        title: project.title ?? '',
        period: buildPeriodFromDates(project.start_date, project.end_date),
        description: project.description ?? '',
      };
    })
    .filter((item): item is ProjectItem => Boolean(item));

  return parsed.length ? parsed : [createEmptyProject()];
};

export const splitPeriod = (period: string) => {
  const raw = period.replace(/[~–—]/g, '-');
  const [startRaw = '', endRaw = ''] = raw.split('-').map((item) => item.trim());
  const start = normalizeYearMonth(startRaw);
  const end = normalizeYearMonth(endRaw);
  return { start, end };
};

type ResumeEditStore = {
  title: string;
  isFresher: boolean;
  fileUrl: string;
  careers: CareerItem[];
  projects: ProjectItem[];
  education: SimpleItem[];
  educationDetails: string[];
  awards: SimpleItem[];
  certificates: SimpleItem[];
  activities: SimpleItem[];
  resetForm: () => void;
  setTitle: (title: string) => void;
  setIsFresher: (isFresher: boolean) => void;
  setFileUrl: (fileUrl: string) => void;
  setEducationValue: (value: string) => void;
  addCareer: () => void;
  updateCareer: (id: string, patch: Partial<Omit<CareerItem, 'id'>>) => void;
  removeCareer: (id: string) => void;
  addProject: () => void;
  updateProject: (id: string, patch: Partial<Omit<ProjectItem, 'id'>>) => void;
  removeProject: (id: string) => void;
  addAward: () => void;
  updateAward: (id: string, value: string) => void;
  removeAward: (id: string) => void;
  addCertificate: () => void;
  updateCertificate: (id: string, value: string) => void;
  removeCertificate: (id: string) => void;
  addActivity: () => void;
  updateActivity: (id: string, value: string) => void;
  removeActivity: (id: string) => void;
  applyResumeDetail: (data: ResumeDetail) => void;
  applyParsedResult: (
    result: ResumeParseTaskResult | null,
    context?: { fileUrl: string; status: string; taskId: string },
  ) => boolean;
};

const getInitialState = () => ({
  title: '',
  isFresher: false,
  fileUrl: '',
  careers: [createEmptyCareer()],
  projects: [createEmptyProject()],
  education: [createEmptySimpleItem()],
  educationDetails: [] as string[],
  awards: [createEmptySimpleItem()],
  certificates: [createEmptySimpleItem()],
  activities: [createEmptySimpleItem()],
});

const updateSimpleList = (list: SimpleItem[], id: string, value: string) =>
  list.map((entry) => (entry.id === id ? { ...entry, value } : entry));

const removeSimpleItem = (list: SimpleItem[], id: string) => {
  const next = list.filter((entry) => entry.id !== id);
  return next.length ? next : [createEmptySimpleItem()];
};

export const useResumeEditStore = create<ResumeEditStore>((set, get) => ({
  ...getInitialState(),
  resetForm: () => set(getInitialState()),
  setTitle: (title) => set({ title }),
  setIsFresher: (isFresher) =>
    set((state) => {
      if (!isFresher) return { isFresher };
      return {
        isFresher,
        careers:
          state.careers.length === 1 &&
          !state.careers[0]?.company &&
          !state.careers[0]?.period &&
          !state.careers[0]?.role &&
          !state.careers[0]?.title
            ? state.careers
            : [createEmptyCareer()],
      };
    }),
  setFileUrl: (fileUrl) => set({ fileUrl }),
  setEducationValue: (value) =>
    set((state) => ({
      education: [{ id: state.education[0]?.id ?? createId(), value }],
    })),
  addCareer: () => set((state) => ({ careers: [...state.careers, createEmptyCareer()] })),
  updateCareer: (id, patch) =>
    set((state) => ({
      careers: state.careers.map((career) => (career.id === id ? { ...career, ...patch } : career)),
    })),
  removeCareer: (id) =>
    set((state) => {
      const next = state.careers.filter((item) => item.id !== id);
      return { careers: next.length ? next : [createEmptyCareer()] };
    }),
  addProject: () => set((state) => ({ projects: [...state.projects, createEmptyProject()] })),
  updateProject: (id, patch) =>
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id ? { ...project, ...patch } : project,
      ),
    })),
  removeProject: (id) =>
    set((state) => {
      const next = state.projects.filter((item) => item.id !== id);
      return { projects: next.length ? next : [createEmptyProject()] };
    }),
  addAward: () => set((state) => ({ awards: [...state.awards, createEmptySimpleItem()] })),
  updateAward: (id, value) =>
    set((state) => ({ awards: updateSimpleList(state.awards, id, value) })),
  removeAward: (id) => set((state) => ({ awards: removeSimpleItem(state.awards, id) })),
  addCertificate: () =>
    set((state) => ({ certificates: [...state.certificates, createEmptySimpleItem()] })),
  updateCertificate: (id, value) =>
    set((state) => ({ certificates: updateSimpleList(state.certificates, id, value) })),
  removeCertificate: (id) =>
    set((state) => ({ certificates: removeSimpleItem(state.certificates, id) })),
  addActivity: () => set((state) => ({ activities: [...state.activities, createEmptySimpleItem()] })),
  updateActivity: (id, value) =>
    set((state) => ({ activities: updateSimpleList(state.activities, id, value) })),
  removeActivity: (id) =>
    set((state) => ({ activities: removeSimpleItem(state.activities, id) })),
  applyResumeDetail: (data) =>
    set(() => {
      const content = (data.contentJson ?? {}) as ResumeParseContentJson;
      const educationValue = toTextArray(content.education);
      const awardsValue = toTextArray(content.awards);
      const certificatesValue = toTextArray(content.certificates);
      const activitiesValue = toTextArray(content.activities);
      const resolvedEducation =
        mapEducationLevel(data.educationLevel ?? '', educationValue, EDUCATION_OPTIONS) ??
        educationValue[0] ??
        '';

      return {
        title: data.title ?? '',
        isFresher: Boolean(data.isFresher),
        fileUrl: data.fileUrl ?? '',
        careers: normalizeCareerItems(content.careers),
        projects: normalizeProjectItems(content.projects),
        educationDetails: educationValue,
        education: [{ id: createId(), value: resolvedEducation }],
        awards: toSimpleItems(awardsValue),
        certificates: toSimpleItems(certificatesValue),
        activities: toSimpleItems(activitiesValue),
      };
    }),
  applyParsedResult: (result, context) => {
    if (context?.fileUrl) {
      set({ fileUrl: context.fileUrl });
    }

    if (!result) {
      set({
        isFresher: false,
        education: [{ id: get().education[0]?.id ?? createId(), value: EDUCATION_OPTIONS[0] }],
        educationDetails: [],
        careers: [createEmptyCareer()],
        projects: [createEmptyProject()],
        awards: [createEmptySimpleItem()],
        certificates: [createEmptySimpleItem()],
        activities: [createEmptySimpleItem()],
      });
      return true;
    }

    const contentJson = (result.content_json ?? {}) as ResumeParseContentJson;
    const careersValue = Array.isArray(contentJson.careers) ? contentJson.careers : [];
    const projectsValue = Array.isArray(contentJson.projects) ? contentJson.projects : [];
    const educationValue = toTextArray(contentJson.education);
    const awardsValue = toTextArray(contentJson.awards);
    const certificatesValue = toTextArray(contentJson.certificates);
    const activitiesValue = toTextArray(contentJson.activities);

    const mappedEducation =
      result.education_level || educationValue.length
        ? mapEducationLevel(result.education_level ?? '', educationValue, EDUCATION_OPTIONS)
        : null;

    set({
      isFresher: typeof result.is_fresher === 'boolean' ? result.is_fresher : get().isFresher,
      education: [
        {
          id: get().education[0]?.id ?? createId(),
          value: mappedEducation ?? EDUCATION_OPTIONS[0],
        },
      ],
      educationDetails: educationValue,
      careers: normalizeCareerItems(careersValue),
      projects: normalizeProjectItems(projectsValue),
      awards: toSimpleItems(awardsValue.filter(Boolean)),
      certificates: toSimpleItems(certificatesValue.filter(Boolean)),
      activities: toSimpleItems(activitiesValue.filter(Boolean)),
    });

    return true;
  },
}));

export const buildResumeContentJson = (state: Pick<
  ResumeEditStore,
  | 'careers'
  | 'projects'
  | 'education'
  | 'educationDetails'
  | 'awards'
  | 'certificates'
  | 'activities'
>) => ({
  careers: state.careers
    .map((career) => [career.company, career.period, career.role, career.title].filter(Boolean).join(' | '))
    .filter(Boolean),
  projects: state.projects.map((project) => {
    const [startDate, endDate] = project.period.split('-').map((item) => item.trim());
    return {
      title: project.title,
      start_date: startDate || '',
      end_date: endDate || '',
      description: project.description,
    };
  }),
  education:
    state.educationDetails.length > 0
      ? state.educationDetails
      : state.education.map((item) => item.value).filter(Boolean),
  awards: state.awards.map((item) => item.value).filter(Boolean),
  certificates: state.certificates.map((item) => item.value).filter(Boolean),
  activities: state.activities.map((item) => item.value).filter(Boolean),
});
