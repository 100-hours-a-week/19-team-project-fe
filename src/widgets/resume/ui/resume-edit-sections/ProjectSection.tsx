'use client';

import { useShallow } from 'zustand/react/shallow';

import { useResumeEditStore } from '@/features/resume';
import { inlineFieldClass } from './constants';
import { useRenderMetric } from './useRenderMetric';

export function ProjectSection() {
  useRenderMetric('ResumeEdit.ProjectSection');

  const { projects, addProject, updateProject, removeProject } = useResumeEditStore(
    useShallow((state) => ({
      projects: state.projects,
      addProject: state.addProject,
      updateProject: state.updateProject,
      removeProject: state.removeProject,
    })),
  );

  return (
    <section>
      <h2 className="text-lg font-semibold text-black">프로젝트</h2>
      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-card-soft">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className={`rounded-xl border border-gray-200 p-3 ${index > 0 ? 'mt-3' : ''}`}
          >
            <div className="flex items-center gap-2">
              <input
                placeholder="프로젝트 이름"
                value={project.title}
                onChange={(event) => updateProject(project.id, { title: event.target.value })}
                className={`${inlineFieldClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeProject(project.id)}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-xl text-gray-500"
                aria-label="프로젝트 삭제"
              >
                -
              </button>
            </div>
            <input
              placeholder="YYYY.MM - YYYY.MM (0년 0개월)"
              value={project.period}
              onChange={(event) => updateProject(project.id, { period: event.target.value })}
              className={`${inlineFieldClass} mt-2`}
            />
            <textarea
              value={project.description}
              onChange={(event) => updateProject(project.id, { description: event.target.value })}
              className="mt-2 w-full rounded-md border border-gray-200 px-2.5 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-main focus:outline-none focus:ring-2 focus:ring-primary-main/20"
              rows={3}
              placeholder="프로젝트 설명"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addProject}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 py-2 text-sm text-gray-600"
        >
          + 주요 프로젝트 추가
        </button>
      </div>
    </section>
  );
}
