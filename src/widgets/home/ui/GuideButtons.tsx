'use client';

import { useState } from 'react';
import Image from 'next/image';

import { BottomSheet } from '@/shared/ui/bottom-sheet';
import iconMark from '@/shared/icons/icon-mark.png';

type GuideId = 'seeker' | 'expert' | null;

const commonItems = [
  {
    id: 'common-1',
    title: '채팅 상세보기',
    body: '채팅방 우측 상단 메뉴에서 상세보기로 이동합니다.',
    note: '이력서 및 지원 공고 링크를 확인할 수 있습니다.',
  },
  {
    id: 'common-2',
    title: '채팅 종료',
    body: '채팅 상세보기 화면에서 채팅 종료가 가능합니다.',
    note: '종료 후에는 메시지를 주고받을 수 없습니다.',
  },
  {
    id: 'common-3',
    title: '현직자 ↔ 현직자 채팅',
    body: '현직자 간 커피챗도 가능합니다.',
    note: '직무/업계 경험 공유 및 네트워킹에 활용할 수 있습니다.',
  },
];

const seekerItems = [
  {
    id: 'seeker-1',
    title: '회원가입 및 프로필 입력',
    body: '닉네임, 직무, 경력, 기술 스택을 입력합니다.',
    note: '입력 정보는 현직자 검색 및 매칭에 활용됩니다.',
  },
  {
    id: 'seeker-2',
    title: '이력서 등록',
    body: '하단 [이력서] 탭에서 이력서를 생성하거나 업로드합니다.',
    note: 'PDF 업로드 시 AI 자동 파싱으로 손쉽게 등록할 수 있습니다.',
  },
  {
    id: 'seeker-3',
    title: '현직자 검색',
    body: '메인 검색바에서 직무/기술 스택/관심 분야로 검색합니다.',
    note: '검색 결과에서 원하는 현직자를 선택합니다.',
  },
  {
    id: 'seeker-4',
    title: '자료 첨부 (선택)',
    body: '채팅 요청 전 이력서 또는 지원 공고 링크를 첨부합니다.',
    note: '첨부 자료는 더 구체적인 피드백에 도움 됩니다.',
  },
  {
    id: 'seeker-5',
    title: '채팅 요청',
    body: '[채팅 요청하기] 버튼으로 현직자에게 커피챗을 요청합니다.',
    note: '요청 수락 후 채팅이 시작됩니다.',
  },
];

const expertItems = [
  {
    id: 'expert-1',
    title: '현직자 인증 (이메일 인증)',
    body: '회사 이메일로 현직자 인증이 가능합니다.',
    note: '마이페이지 [현직자 인증] 메뉴에서도 진행할 수 있습니다.',
  },
  {
    id: 'expert-2',
    title: '채팅 요청 확인',
    body: '현재 채팅 알림 기능은 제공되지 않습니다.',
    note: '하단 [채팅] 탭에서 요청을 직접 확인해야 합니다.',
  },
];

function GuideCard({
  index,
  title,
  body,
  note,
}: {
  index: number;
  title: string;
  body: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#edf4ff] text-[11px] font-semibold text-[#2b4b7e]">
          {index}
        </span>
        <p className="text-[13px] font-semibold text-text-body">{title}</p>
      </div>
      <p className="mt-2 text-[12px] text-text-body">{body}</p>
      {note ? <p className="mt-1 text-[11px] text-text-body">※ {note}</p> : null}
    </div>
  );
}

export default function GuideButtons() {
  const [activeGuide, setActiveGuide] = useState<GuideId>(null);

  return (
    <>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveGuide('seeker')}
          className="ml-2 flex items-center gap-2 rounded-full border border-[#2b4b7e] bg-[var(--color-primary-active)] px-3 py-2"
        >
          <Image src={iconMark} alt="" width={20} height={20} />
          <span className="text-sm font-semibold text-primary-main">구직자 이용 가이드</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveGuide('expert')}
          className="mr-2 flex items-center gap-2 rounded-full border border-[#2b4b7e] bg-[var(--color-primary-active)] px-3 py-2"
        >
          <Image src={iconMark} alt="" width={20} height={20} />
          <span className="text-sm font-semibold text-primary-main">현직자 이용 가이드</span>
        </button>
      </div>

      <BottomSheet
        open={activeGuide === 'seeker'}
        title="구직자 이용 가이드"
        actionLabel="완료"
        onAction={() => setActiveGuide(null)}
        onClose={() => setActiveGuide(null)}
      >
        <p className="text-center text-[15px] font-bold text-text-body">
          <span className="text-primary-main">re:fit</span> 가이드를 따라 더 빠르게 커리어를
          준비해요.
        </p>
        <div className="mt-3 space-y-3">
          {seekerItems.map((item, index) => (
            <GuideCard
              key={item.id}
              index={index + 1}
              title={item.title}
              body={item.body}
              note={item.note}
            />
          ))}
        </div>
        <div className="mt-6 space-y-3">
          <p className="text-[13px] font-semibold text-text-body">공통 이용 가이드</p>
          {commonItems.map((item, index) => (
            <GuideCard
              key={item.id}
              index={seekerItems.length + index + 1}
              title={item.title}
              body={item.body}
              note={item.note}
            />
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        open={activeGuide === 'expert'}
        title="현직자 이용 가이드"
        actionLabel="완료"
        onAction={() => setActiveGuide(null)}
        onClose={() => setActiveGuide(null)}
      >
        <p className="text-center text-[15px] font-bold text-text-body">
          경험을 나누는 작은 시작, <span className="text-primary-main">re:fit</span>이
          함께합니다.
        </p>
        <div className="mt-3 space-y-3">
          {expertItems.map((item, index) => (
            <GuideCard
              key={item.id}
              index={index + 1}
              title={item.title}
              body={item.body}
              note={item.note}
            />
          ))}
        </div>
        <div className="mt-6 space-y-3">
          <p className="text-[13px] font-semibold text-text-body">공통 이용 가이드</p>
          {commonItems.map((item, index) => (
            <GuideCard
              key={item.id}
              index={expertItems.length + index + 1}
              title={item.title}
              body={item.body}
              note={item.note}
            />
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
