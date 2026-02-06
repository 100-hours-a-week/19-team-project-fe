'use client';

import { useCallback, useMemo, useState } from 'react';

import type { ResumeDetail, ResumeParseContentJson, ResumeParseSyncResult } from '@/entities/resumes';

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
  description?: string;
};

export type SimpleItem = {
  id: string;
  value: string;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const mapEducationLevel = (
  educationLevel: string,
  fallbackList: string[],
  allowedLevels: string[],
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
  if (!values.length) return [{ id: createId(), value: '' }];
  return values.map((value) => ({ id: createId(), value }));
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

export function useResumeEditForm() {
  const [title, setTitle] = useState('');
  const [isFresher, setIsFresher] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [careers, setCareers] = useState<CareerItem[]>([
    { id: createId(), company: '', period: '', role: '', title: '' },
  ]);
  const [projects, setProjects] = useState<ProjectItem[]>([
    { id: createId(), title: '', period: '', description: '' },
  ]);
  const [education, setEducation] = useState<SimpleItem[]>([{ id: createId(), value: '' }]);
  const [awards, setAwards] = useState<SimpleItem[]>([{ id: createId(), value: '' }]);
  const [certificates, setCertificates] = useState<SimpleItem[]>([{ id: createId(), value: '' }]);
  const [activities, setActivities] = useState<SimpleItem[]>([{ id: createId(), value: '' }]);

  const educationOptions = useMemo(
    () => ['고등학교 졸업', '2년제 재학/휴학', '2년제 졸업', '4년제 재학/휴학', '4년제 졸업'],
    [],
  );

  const payload = useMemo(
    () => ({
      title,
      is_fresher: isFresher,
      education_level: education[0]?.value ?? '',
      file_url: fileUrl,
      content_json: {
        careers: careers
          .map((career) =>
            [career.company, career.period, career.role, career.title].filter(Boolean).join(' | '),
          )
          .filter(Boolean),
        projects: projects.map((project) => {
          const [startDate, endDate] = project.period.split('-').map((item) => item.trim());
          return {
            title: project.title,
            start_date: startDate || '',
            end_date: endDate || '',
            description: project.description,
          };
        }),
        education: education.map((item) => item.value).filter(Boolean),
        awards: awards.map((item) => item.value).filter(Boolean),
        certificates: certificates.map((item) => item.value).filter(Boolean),
        activities: activities.map((item) => item.value).filter(Boolean),
      },
    }),
    [title, isFresher, fileUrl, careers, projects, education, awards, certificates, activities],
  );

  const formatDateToken = useCallback((value: string) => {
    if (/^\d{4}-\d{2}(-\d{2})?$/.test(value)) {
      return value.replace(/-/g, '.');
    }
    return value;
  }, []);

  const buildPeriodFromDates = useCallback(
    (start?: string, end?: string, isCurrent?: boolean) => {
      const startValue = start ? formatDateToken(start) : '';
      const endValue = end ? formatDateToken(end) : isCurrent ? 'Present' : '';
      return [startValue, endValue].filter(Boolean).join(' - ');
    },
    [formatDateToken],
  );

  const normalizeCareerItems = useCallback(
    (value: unknown): CareerItem[] => {
      if (!Array.isArray(value)) {
        return [{ id: createId(), company: '', period: '', role: '', title: '' }];
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
            const period = buildPeriodFromDates(
              career.start_date,
              career.end_date,
              career.is_current,
            );
            return { id: createId(), company, period, role, title: titleValue };
          }
          return null;
        })
        .filter((item): item is CareerItem => Boolean(item));

      return parsed.length
        ? parsed
        : [{ id: createId(), company: '', period: '', role: '', title: '' }];
    },
    [buildPeriodFromDates],
  );

  const splitPeriod = (period: string) => {
    const raw = period.replace(/[~–—]/g, '-');
    const [startRaw = '', endRaw = ''] = raw.split('-').map((item) => item.trim());
    const start = normalizeYearMonth(startRaw);
    const end = normalizeYearMonth(endRaw);
    return { start, end };
  };

  const applyResumeDetail = useCallback(
    (data: ResumeDetail) => {
      setTitle(data.title ?? '');
      setIsFresher(Boolean(data.isFresher));
      setFileUrl(data.fileUrl ?? '');

      const content = data.contentJson ?? {};
      const careersValue = (content as { careers?: unknown }).careers;
      const projectsValue = Array.isArray((content as { projects?: ContentProjectItem[] }).projects)
        ? ((content as { projects?: ContentProjectItem[] }).projects ?? []).map((project) => ({
            id: createId(),
            title: project.title ?? '',
            period: buildPeriodFromDates(project.start_date, project.end_date),
            description: project.description ?? '',
          }))
        : [];
      const educationValue = Array.isArray((content as { education?: string[] }).education)
        ? ((content as { education?: string[] }).education ?? [])
        : [];
      const awardsValue = Array.isArray((content as { awards?: string[] }).awards)
        ? ((content as { awards?: string[] }).awards ?? [])
        : [];
      const certificatesValue = Array.isArray(
        (content as { certificates?: string[] }).certificates,
      )
        ? ((content as { certificates?: string[] }).certificates ?? [])
        : [];
      const activitiesValue = Array.isArray((content as { activities?: string[] }).activities)
        ? ((content as { activities?: string[] }).activities ?? [])
        : [];

      setCareers(normalizeCareerItems(careersValue));
      setProjects(
        projectsValue.length
          ? projectsValue
          : [{ id: createId(), title: '', period: '', description: '' }],
      );
      const resolvedEducation =
        mapEducationLevel(data.educationLevel ?? '', educationValue, educationOptions) ??
        educationValue[0] ??
        '';
      setEducation([{ id: createId(), value: resolvedEducation }]);
      setAwards(
        awardsValue.length
          ? awardsValue.map((item) => ({ id: createId(), value: item }))
          : [{ id: createId(), value: '' }],
      );
      setCertificates(
        certificatesValue.length
          ? certificatesValue.map((item) => ({ id: createId(), value: item }))
          : [{ id: createId(), value: '' }],
      );
      setActivities(
        activitiesValue.length
          ? activitiesValue.map((item) => ({ id: createId(), value: item }))
          : [{ id: createId(), value: '' }],
      );
    },
    [buildPeriodFromDates, educationOptions, normalizeCareerItems],
  );

  const applyParsedResult = useCallback(
    (result: ResumeParseSyncResult | null) => {
      if (!result) return false;

      const contentJson = (result.content_json ?? {}) as ResumeParseContentJson;
      const careersValue = Array.isArray(contentJson.careers) ? contentJson.careers : [];
      const projectsValue = Array.isArray(contentJson.projects) ? contentJson.projects : [];
      const educationValue = Array.isArray(contentJson.education) ? contentJson.education : [];
      const awardsValue = Array.isArray(contentJson.awards) ? contentJson.awards : [];
      const certificatesValue = Array.isArray(contentJson.certificates)
        ? contentJson.certificates
        : [];
      const activitiesValue = Array.isArray(contentJson.activities) ? contentJson.activities : [];

      if (typeof result.is_fresher === 'boolean') {
        setIsFresher(result.is_fresher);
      }

      const mappedEducation =
        result.education_level || educationValue.length
          ? mapEducationLevel(result.education_level ?? '', educationValue, educationOptions)
          : null;
      if (mappedEducation) {
        setEducation([{ id: education[0]?.id ?? createId(), value: mappedEducation }]);
      }

      setCareers(normalizeCareerItems(careersValue));

      setProjects(
        projectsValue.length
          ? projectsValue.map((project) => {
              const period = buildPeriodFromDates(project.start_date, project.end_date);
              return {
                id: createId(),
                title: project.title ?? '',
                period,
                description: project.description ?? '',
              };
            })
          : [{ id: createId(), title: '', period: '', description: '' }],
      );

      setAwards(toSimpleItems(awardsValue.filter(Boolean)));
      setCertificates(toSimpleItems(certificatesValue.filter(Boolean)));
      setActivities(toSimpleItems(activitiesValue.filter(Boolean)));
      return true;
    },
    [buildPeriodFromDates, education, educationOptions, normalizeCareerItems],
  );

  return {
    title,
    setTitle,
    isFresher,
    setIsFresher,
    fileUrl,
    setFileUrl,
    careers,
    setCareers,
    projects,
    setProjects,
    education,
    setEducation,
    awards,
    setAwards,
    certificates,
    setCertificates,
    activities,
    setActivities,
    educationOptions,
    payload,
    splitPeriod,
    applyResumeDetail,
    applyParsedResult,
  };
}
