'use client';

import { useState } from 'react';

export default function WhyRefitSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      aria-labelledby="why-refit"
      className="mt-4 rounded-3xl border border-white/60 bg-[linear-gradient(135deg,#35558b_0%,#65778c_100%)] px-5 py-3 text-white shadow-[0_16px_36px_rgba(31,46,71,0.25)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="why-refit" className="text-xs font-semibold tracking-[0.14em] text-white/85">
          WHY RE:FIT
        </h2>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-full border border-white/35 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
          aria-expanded={expanded}
        >
          {expanded ? '접기' : '자세히 보기'}
        </button>
      </div>

      {expanded ? (
        <div className="mt-3 space-y-3 text-sm leading-6 text-white/90">
          <p>
            RE:FIT은 현직자와의 대화를 통해 취업과 이직 준비의 방향을 더 선명하게 만드는 커리어
            피드백 플랫폼입니다. 지원하려는 직무에 맞는 전문가를 찾고, 실제 채용 기준과 직무 요구
            역량을 기준으로 이력서와 포트폴리오를 점검할 수 있습니다.
          </p>
          <p>
            현직자 피드백은 단순한 조언이 아닌, 채용 맥락에 기반한 구체적인 개선 방향으로
            이어집니다. 직무별 전문가와의 커피챗을 통해 취업 준비와 이직 전략을 체계적으로 정리하고,
            내 커리어 목표에 맞는 실행 계획을 빠르게 세울 수 있습니다.
          </p>
        </div>
      ) : null}
    </section>
  );
}
