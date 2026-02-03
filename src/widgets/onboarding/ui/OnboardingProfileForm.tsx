'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import type { CareerLevel, Job, Skill, UserType } from '@/entities/onboarding';
import {
  checkNickname,
  getCareerLevels,
  getJobs,
  getSkills,
  sendEmailVerification,
  signup,
  verifyEmailVerification,
} from '@/features/onboarding';
import {
  BusinessError,
  readAccessToken,
  setAuthCookies,
  useCommonApiErrorHandler,
} from '@/shared/api';
import iconMark from '@/shared/icons/icon-mark.png';
import iconMarkB from '@/shared/icons/icon-mark_B.png';
import iconCareer from '@/shared/icons/icon_career.png';
import iconJob from '@/shared/icons/Icon_job.png';
import iconTech from '@/shared/icons/Icon_tech.png';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { stompManager } from '@/shared/ws';

type RoleId = 'seeker' | 'expert';
type SheetId = 'job' | 'career' | 'tech' | null;

type OnboardingProfileFormProps = {
  role?: RoleId;
};

const nicknameLimit = 10;
const introductionLimit = 100;
const verificationCodeLength = 6;

const roleTitle: Record<RoleId, string> = {
  seeker: '구직자',
  expert: '현직자',
};

const signupErrorMessages: Record<string, string> = {
  SIGNUP_OAUTH_PROVIDER_INVALID: '소셜 로그인 제공자가 올바르지 않습니다.',
  SIGNUP_OAUTH_ID_EMPTY: '소셜 로그인 정보가 필요합니다.',
  NICKNAME_EMPTY: '닉네임을 입력해 주세요.',
  SIGNUP_USER_TYPE_INVALID: '유저 타입이 올바르지 않습니다.',
  CAREER_LEVEL_NOT_FOUND: '선택한 경력이 올바르지 않습니다.',
};

const defaultSignupErrorMessage = '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.';

const nicknameValidationMessages: Record<string, string> = {
  NICKNAME_EMPTY: '닉네임을 입력해 주세요.',
  NICKNAME_TOO_SHORT: '닉네임이 너무 짧아요.',
  NICKNAME_TOO_LONG: '닉네임이 너무 길어요.',
  NICKNAME_INVALID_CHARACTERS: '특수 문자/이모지는 사용할 수 없어요.',
  NICKNAME_CONTAINS_WHITESPACE: '닉네임에 공백을 포함할 수 없어요.',
};

const emailVerificationMessages: Record<string, string> = {
  VERIFICATION_CODE_INVALID: '인증번호 형식이 올바르지 않습니다.',
  VERIFICATION_CODE_MISMATCH: '인증번호가 일치하지 않습니다.',
  AUTH_UNAUTHORIZED: '인증 정보가 만료되었습니다. 다시 전송해 주세요.',
  VERIFICATION_CODE_EXPIRED: '인증 시간이 만료되었습니다. 다시 전송해 주세요.',
};

const TERMS_TEXT = `# Re-fit 이용약관

## 제1조 (목적)

본 약관은 일구하조(이하 “회사”)가 제공하는 Re-fit(이하 “서비스”)의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

## 제2조 (정의)

1. “서비스”란 회사가 제공하는 Re-fit 웹/모바일 및 관련 제반 서비스(이력서 업로드, AI 기반 파싱·분석·추천, 리포트 생성, 현직자 정보 탐색, 멘토링/상담 기능, 채팅 등)를 말합니다.
2. “이용자”란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.
3. “회원”이란 서비스에 회원가입을 완료하고 회사가 제공하는 서비스를 이용하는 자를 말합니다.
4. “콘텐츠”란 이용자가 서비스 내에 게시·업로드·전송하는 텍스트, 이미지, 파일(PDF/이미지 이력서 등), 링크, 메시지 등 일체의 정보를 말합니다.
5. “이력서 파일”이란 이용자가 서비스에 업로드하는 이력서/경력기술서/포트폴리오 등 문서 파일 또는 이미지 파일을 말합니다.
6. “AI 결과물”이란 이력서 파싱 결과, 요약·추천·리포트, 직무/공고 매칭 결과 등 AI 기반 기능을 통해 생성·제공되는 출력물을 말합니다.
7. “현직자(멘토)”란 서비스에 프로필 정보를 등록한 회원 또는 회사가 제휴/연동을 통해 제공하는 전문가를 말합니다.

## 제3조 (약관의 효력 및 변경)

1. 회사는 본 약관을 서비스 초기 화면 또는 연결 화면에 게시합니다.
2. 회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다.
3. 약관 변경 시 적용일자 및 변경 사유를 명시하여 적용일자 7일 전부터 공지합니다. 다만 이용자에게 불리하거나 중요한 변경은 30일 전부터 공지합니다.
4. 이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있으며, 변경 공지 후 적용일자까지 거부 의사를 표시하지 않으면 동의한 것으로 봅니다.

## 제4조 (이용계약의 성립)

1. 이용계약은 이용자가 약관에 동의하고 회원가입을 신청한 후 회사가 승낙함으로써 성립합니다.
2. 회사는 다음 각 호의 경우 승낙을 거절하거나 사후에 이용계약을 해지할 수 있습니다.
   1. 타인의 명의 도용 등 허위 정보로 신청한 경우
   2. 법령 또는 약관을 위반하여 신청한 경우
   3. 서비스 운영에 중대한 지장을 초래할 우려가 있는 경우

## 제5조 (회원정보 관리)

1. 회원은 회원정보가 변경된 경우 서비스 내에서 정보를 수정하거나 회사에 요청하여 변경해야 합니다.
2. 회원정보 미변경으로 발생한 불이익에 대하여 회사는 책임을 지지 않습니다.

## 제6조 (계정 및 보안)

1. 계정 및 인증수단(비밀번호, 소셜 로그인 토큰 등)의 관리 책임은 회원에게 있습니다.
2. 회원은 계정 도용 또는 부정 사용을 인지한 경우 즉시 회사에 통지해야 하며, 회사의 안내에 따라야 합니다.

## 제7조 (서비스 제공 및 운영)

1. 회사는 다음 기능을 포함하여 서비스를 제공합니다(일부 기능은 변경될 수 있음).
   1. 이력서 파일 업로드 및 문서 처리(형식 변환, OCR 등)
   2. AI 기반 이력서 파싱/요약/정규화 및 자동 입력 보조
   3. 공고/직무/역량 기반 분석 및 추천
   4. 리포트(커리어 피드백/개선점/액션 아이템 등) 생성
   5. 현직자 프로필 탐색 및 추천
   6. 채팅/커뮤니케이션 기능(제공되는 경우)
2. 회사는 서비스 품질 향상 또는 운영상 필요에 따라 서비스의 전부 또는 일부를 변경할 수 있습니다.
3. 회사는 정기점검, 유지보수, 업데이트를 위해 서비스 제공을 일시 중단할 수 있으며, 가능한 사전에 공지합니다.

## 제8조 (이력서 파일 및 민감정보 처리)

1. 이용자는 이력서 파일 업로드 시, 해당 파일에 포함된 정보(개인정보 및 민감할 수 있는 정보 포함)에 대해 업로드 권한을 보유해야 하며, 제3자의 권리를 침해하지 않아야 합니다.
2. 회사는 서비스 제공을 위해 이력서 파일을 처리할 수 있으며, 처리 방식 및 보관 정책은 개인정보처리방침 및 서비스 내 고지에 따릅니다.
3. 회사는 개인정보 보호를 위해 일부 데이터에 대해 비식별화/마스킹 처리를 적용할 수 있습니다.
4. 회사는 보안 및 운영 정책에 따라 이력서 파일 또는 파싱 결과를 일시적으로만 처리(Transient Processing)하거나, 저장 기간을 제한할 수 있습니다.

## 제9조 (AI 기반 기능의 한계 및 이용자 책임)

1. AI 결과물은 통계적·확률적 방식에 의해 생성되며, 정확성·완전성·최신성·특정 목적 적합성을 보장하지 않습니다.
2. 이용자는 AI 결과물을 참고자료로 활용해야 하며, 중요한 의사결정(지원/이직/면접/계약 등)은 이용자가 추가 확인 후 결정해야 합니다.
3. 이용자가 AI 결과물을 그대로 제출·공유함으로써 발생하는 불이익(허위 기재, 오기재, 사실관계 오류 등)에 대해 회사는 책임을 지지 않습니다.
4. 회사는 AI 모델, 프롬프트, 파이프라인, 평가기준 등을 개선하기 위해 변경할 수 있으며, 이로 인해 결과물의 형식/품질/내용이 달라질 수 있습니다.

## 제10조 (현직자/멘토 및 커뮤니케이션 기능)

1. 현직자와 AI 멘토의 정보 및 조언은 해당 제공자 또는 제휴처의 견해일 수 있으며 회사의 공식 입장이 아닙니다.
2. 회사는 현직자와 AI 멘토의 답변·상담 내용의 정확성 또는 결과(합격, 처우 개선 등)를 보증하지 않습니다.
3. 채팅/커뮤니케이션 기능 이용 시 이용자는 관계 법령 및 약관을 준수해야 하며, 괴롭힘/혐오/차별/성희롱/불법 콘텐츠 유포 등의 행위를 해서는 안 됩니다.
4. 회사는 안전한 서비스 운영을 위해 신고/제재/모니터링 정책을 운영할 수 있으며, 위반 시 이용 제한 조치를 할 수 있습니다.

## 제11조 (이용자의 의무 및 금지행위)

이용자는 다음 행위를 해서는 안 됩니다.

1. 타인의 개인정보/계정 도용, 허위 정보 등록
2. 서비스의 정상 운영 방해(과도한 요청, 취약점 공격, 비정상 트래픽 유발 등)
3. 이력서/콘텐츠에 불법 정보, 타인 권리 침해 내용 게시
4. 회사 또는 제3자의 지식재산권 침해
5. 회사의 사전 동의 없는 광고/홍보/스팸, 영리 목적의 무단 사용
6. AI 결과물의 취약점 악용(프롬프트 인젝션, 우회 시도 등) 또는 모델/시스템 역공학 시도
7. 기타 법령 및 공서양속에 반하는 행위

## 제12조 (콘텐츠 및 지식재산권)

1. 서비스 및 서비스에 포함된 소프트웨어, UI, 상표, 로고 등 일체의 지식재산권은 회사 또는 정당한 권리자에게 귀속됩니다.
2. 이용자가 서비스 내에 게시한 콘텐츠의 권리는 원칙적으로 이용자에게 귀속됩니다.
3. 다만 회사는 서비스 제공·운영·개선(노출, 저장, 전송, 품질 향상, 오류 분석 등)을 위해 필요한 범위에서 이용자의 콘텐츠를 이용할 수 있는 비독점적·무상 사용권을 가집니다.
4. 이용자는 자신이 게시한 콘텐츠가 제3자의 권리를 침해하지 않도록 해야 하며, 분쟁 발생 시 이용자가 책임을 부담합니다.

## 제13조 (유료서비스)

1. 회사는 일부 기능을 유료로 제공할 수 있으며, 유료서비스의 내용, 가격, 결제 방식, 제공 기간은 서비스 화면 또는 별도 정책으로 고지합니다.
2. 결제 취소/환불/해지는 관련 법령 및 회사의 환불정책(별도 고지)에 따릅니다.
3. 구독형 서비스의 경우 자동결제 여부, 갱신 주기, 해지 방법을 사전에 고지합니다.

## 제14조 (서비스 이용 제한 및 계약 해지)

1. 회사는 이용자가 약관을 위반하거나 서비스 운영을 방해하는 경우 사전 통지 후 서비스 이용을 제한할 수 있습니다. 다만 긴급한 경우 사후 통지할 수 있습니다.
2. 회원은 언제든지 서비스 내 탈퇴 기능을 통해 이용계약을 해지할 수 있습니다.
3. 해지/탈퇴 후에도 관련 법령 및 회사 정책에 따라 보관이 필요한 정보는 일정 기간 보관될 수 있습니다. 단, 회사는 회원 탈퇴 시 회원의 데이터(이력서, 리포트 등)를 반환할 의무가 없으며, 회원은 탈퇴 전 필요한 데이터를 직접 백업해야 합니다.

## 제15조 (책임의 제한)

1. 회사는 천재지변, 불가항력, 이용자 귀책 사유로 인한 서비스 장애에 대해 책임을 지지 않습니다.
2. 회사는 서비스가 제공하는 분석/추천/리포트 등으로 인한 취업 성공, 합격, 처우 개선 등 특정 성과를 보장하지 않습니다.
3. 회사는 이용자 간 또는 이용자와 제3자 간 분쟁에 개입하지 않으며, 해당 분쟁은 당사자들이 해결합니다.

## 제16조 (손해배상)

이용자가 본 약관 또는 관련 법령을 위반하여 회사에 손해를 발생시킨 경우 이용자는 회사가 입은 손해를 배상해야 합니다.

## 제17조 (개인정보보호)

회사는 관련 법령에 따라 이용자의 개인정보를 보호하며, 개인정보 처리에 관한 사항은 별도의 개인정보처리방침에 따릅니다.

## 제18조 (분쟁해결)

1. 회사는 이용자의 문의 및 불만 처리를 위한 고객센터를 운영합니다.
2. 회사와 이용자는 분쟁이 발생한 경우 성실히 협의하여 해결하도록 노력합니다.

## 제19조 (준거법 및 관할)

1. 본 약관은 대한민국 법령을 준거법으로 합니다.
2. 서비스 이용과 관련하여 분쟁이 발생한 경우 회사의 본점 소재지를 관할하는 법원을 전속 관할로 합니다(또는 민사소송법에 따름).

---

## 부칙

- 공고일자: [2026.02.03]
- 시행일자: [2026.02.03]`;

const PRIVACY_TEXT = `# Re-fit 개인정보처리방침

일구하조(이하 “회사”)는 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 보호하기 위해 다음과 같은 개인정보처리방침을 수립·공개합니다.

- 공고일자: 2026.02.03
- 시행일자: 2026.02.03

---

## 1. 개인정보의 처리 목적

회사는 다음의 목적을 위해 개인정보를 처리합니다. 처리한 개인정보는 아래 목적 이외의 용도로는 이용되지 않으며, 목적 변경 시 별도 동의를 받습니다.

1. 회원 가입 및 관리
   - 본인 식별·인증, 회원자격 유지·관리, 부정 이용 방지, 서비스 이용 안내 및 고지
2. 서비스 제공(핵심 기능)
   - 이력서 업로드 및 문서 처리(OCR/형식 변환 등)
   - AI 기반 이력서 파싱/요약/정규화, 리포트 생성, 추천 기능 제공
   - (제공되는 경우) 멘토/현직자 탐색, 상담/채팅 기능 제공
3. 고객 지원 및 민원 처리
   - 문의 응대, 분쟁 조정, 공지·안내, 서비스 품질 개선
4. 서비스 안정성 및 보안
   - 로그 분석, 장애 대응, 보안 이벤트 탐지, 비정상 이용 방지
5. 마케팅/프로모션(선택)
   - 이벤트/혜택 알림, 맞춤형 안내(별도 동의한 경우에 한함)

---

## 2. 처리하는 개인정보의 항목

### (1) 회원가입/계정 정보

- (필수) 이메일(또는 소셜 로그인 식별자), 닉네임, 비밀번호(자체 로그인 시)
- (선택) 프로필 이미지, 자기소개, 관심 직무/기술스택 등

### (2) 서비스 이용 과정에서 생성·수집되는 정보

- 접속 로그, IP, 쿠키/기기 정보(브라우저/OS), 이용 기록, 서비스 내 활동 기록, 오류 로그 등

### (3) 이력서/문서 업로드 관련 정보

- 이용자가 업로드한 이력서 파일(PDF/이미지 등) 및 그 안의 정보(예: 이름, 연락처, 학력·경력·자격 등)
- AI 파싱을 위한 문서 추출 텍스트, 구조화된 파싱 결과(JSON 등)

※ 이력서 파일에는 개인정보(연락처, 이메일, 주소 등)가 포함될 수 있습니다. 회사는 개인정보 보호를 위해 마스킹/비식별화 처리 를 적용할 수 있습니다.

### (4) 결제 정보(유료서비스 제공 시)

- 결제 승인 정보(결제일시, 결제수단 종류, 결제금액, 결제상태, 결제/환불 식별값 등)
- 실제 카드번호 등 민감한 결제정보는 결제대행사(PG)가 처리하며, 회사는 원칙적으로 저장하지 않습니다.

### (5) 고객 문의 시

- 이름(또는 닉네임), 이메일, 문의 내용, 첨부파일(이용자가 첨부한 경우)

---

## 3. 개인정보의 처리 및 보유 기간

회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시 동의받은 보유·이용기간 내에서 개인정보를 처리·보유합니다.

1. 회원 계정 정보
   - 보유기간: 회원 탈퇴 시까지
   - 단, 부정 이용 방지/분쟁 대응을 위해 필요한 경우 관련 법령에 따라 일정 기간 보관
2. 이력서 파일 및 AI 파싱 결과
   - 보유기간: 서비스 제공을 위한 최소 기간 동안 보관 후 파기
   - 기본 원칙: Transient Processing(일시 처리) 정책에 따라, 원문 이력서 파일 또는 파싱 결과를 영구 보관하지 않을 수 있으며, 운영 정책에 따라 보관 기간이 제한될 수 있습니다(서비스 화면 또는 별도 고지).
3. 서비스 이용 기록(로그)
   - 보유기간: 3개월 (보안 및 안정성 확보 목적)
   - 단, 통신비밀보호법 등 관련 법령이 요구하는 경우 그에 따름
4. 고객 문의
   - 보유기간: 문의 처리 완료 후 또는 관련 법령에 따른 기간
5. 관련 법령에 따른 보관 예시(해당 시)
   - 계약/청약철회/대금결제/재화 공급 기록: 3개월
   - 소비자 불만 또는 분쟁 처리 기록: 3개월
   - 표시/광고에 관한 기록: 3개월
   - 웹사이트 접속 기록: 3개월

---

## 4. 개인정보의 제3자 제공

회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.

다만, 아래의 경우 예외로 합니다.

1. 이용자가 사전에 동의한 경우
2. 법령에 근거가 있거나 수사기관의 적법한 절차에 따른 요청이 있는 경우

---

## 5. 개인정보 처리의 위탁

회사는 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁할 수 있으며, 위탁 시 관련 법령에 따라 안전하게 관리·감독합니다.

| 수탁자 | 위탁 업무 내용 | 보유/이용기간 |
| --- | --- | --- |
| [예: AWS / NCP 등 클라우드] | 인프라 운영(서버/DB/스토리지), 로그 관리 | 계약 종료 또는 위탁 목적 달성 시 |
| [예: S3 호환 스토리지] | 파일 저장(이력서 업로드 파일) | 동일 |
| [예: 메일 발송 서비스] | 이메일 안내/인증 메일 발송 | 동일 |
| [예: PG사] (유료서비스 시) | 결제 처리 | 관련 법령에 따른 기간 |
| Google LLC | AI 기반 이력서 파싱·분석·추천 및 챗봇 기능 제공 | 위탁 목적 달성 시까지 (또는 계약 종료 시까지) |

실제 위탁사/업무는 운영 환경에 따라 달라질 수 있으며, 변경 시 본 방침에 반영하여 고지합니다.

---

## 6. 개인정보의 국외 이전

회사는 원칙적으로 이용자의 개인정보를 국내에서 처리합니다.

다만, 클라우드/AI 서비스 이용 과정에서 국외 이전이 발생할 수 있으며, 해당 경우 아래 내용을 고지하고 필요한 절차(동의 등)를 이행합니다.

- 이전 받는 자: Google LLC
- 이전 국가: 미국 (USA)
- 이전 일시 및 방법: 서비스 내 AI 기능 이용 시점에 정보통신망을 통해 수시 전송
- 이전 항목: 이용자가 입력한 텍스트, 이력서 내 추출 텍스트, 프롬프트 데이터
- 이용 목적: AI 모델을 통한 답변 생성 및 이력서 분석
- 보유 기간: Google의 API 데이터 처리 정책에 따르며, 처리 완료 후 즉시 파기 (단, 로그 등 관리적 목적으로 보관되는 경우 해당 정책에 따름)

---

## 7. 개인정보의 파기 절차 및 방법

회사는 개인정보 보유기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때 지체 없이 파기합니다.

1. 파기 절차
   - 파기 사유가 발생한 개인정보를 선별하고, 내부 절차에 따라 파기합니다.
2. 파기 방법
   - 전자적 파일: 복구 불가능한 방식으로 삭제(영구삭제/덮어쓰기 등)
   - 종이 문서: 분쇄 또는 소각

---

## 8. 정보주체와 법정대리인의 권리·의무 및 행사방법

이용자는 언제든지 다음 권리를 행사할 수 있습니다.

1. 개인정보 열람 요구
2. 개인정보 정정·삭제 요구
3. 개인정보 처리정지 요구
4. 동의 철회(선택 동의 항목)

권리 행사는 서비스 내 설정/고객센터를 통해 가능하며, 회사는 지체 없이 조치합니다.

법정대리인은 만 14세 미만 아동의 개인정보에 대해 권리를 행사할 수 있습니다(서비스 정책에 따라 미성년자 가입 제한 가능).

---

## 9. 개인정보의 안전성 확보조치

회사는 개인정보 보호를 위해 다음과 같은 조치를 취합니다.

- 관리적 조치: 내부관리계획 수립, 정기 교육, 접근권한 최소화
- 기술적 조치: 접근통제, 암호화(전송구간 TLS 등), 로그 모니터링, 취약점 점검
- 물리적 조치: 전산실/서버실 접근 통제(해당 시)

---

## 10. 개인정보 자동 수집 장치의 설치·운영 및 거부

회사는 서비스 제공을 위해 쿠키(cookie) 등 자동 수집 장치를 사용할 수 있습니다.

- 목적: 로그인 유지, 이용 환경 개선, 보안 강화 등
- 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.
- 단, 쿠키 거부 시 일부 기능 이용에 제한이 있을 수 있습니다.

---

## 11. 개인정보 보호책임자 및 문의처

회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 불만처리 및 피해구제를 위해 아래와 같이 개인정보 보호책임자를 지정합니다.

- 개인정보 보호책임자: Daniel(정민수) / CEO
- 연락처: [이메일]
- 고객센터/문의: [이메일]

또한 이용자는 개인정보 침해에 대한 신고/상담이 필요한 경우 아래 기관에 문의할 수 있습니다.

- 개인정보침해신고센터(한국인터넷진흥원): 118
- 개인정보분쟁조정위원회: 1833-6972
- 대검찰청 사이버수사과: 1301
- 경찰청 사이버범죄 신고: 182

---

## 12. 고지의 의무

본 개인정보처리방침 내용 추가·삭제·수정이 있을 경우, 회사는 변경사항의 시행 7일 전(중요 변경 30일 전)부터 서비스 내 공지사항 등을 통해 고지합니다.`;

const MENTOR_PLEDGE_TEXT = `### [Re-fit] 멘토 개인정보 보호 및 보안 서약서

본인은 일구하조(이하 “회사”)가 제공하는 Re-fit 서비스(이하 “서비스”)의 멘토로서 활동함에 있어, 멘티(이용자)의 개인정보 보호를 위해 다음 사항을 준수할 것을 엄숙히 서약합니다.

제1조 (목적)
본 서약은 멘토링 과정에서 알게 된 멘티의 이력서, 포트폴리오, 상담 내용 등 일체의 개인정보 및 비공개 정보(이하 “개인정보 등”)를 보호하는 데 목적이 있습니다.

제2조 (비밀 유지 및 목적 외 이용 금지)
1. 본인은 서비스를 통해 제공받은 멘티의 개인정보 등을 오직 멘토링 및 피드백 제공 목적으로만 사용하겠습니다.
2. 본인은 회사의 사전 승인 없이 개인정보 등을 제3자에게 제공, 누설, 공개하거나, 멘토링 외의 목적(사적 연락, 영리 추구, 홍보, 채용 알선 등)으로 이용하지 않겠습니다.

제3조 (복제 및 저장 금지)
1. 본인은 멘티의 이력서 파일이나 상담 내용을 개인 PC, 스마트폰, 클라우드 저장소 등에 다운로드하거나 영구 저장하지 않겠습니다.
2. 본인은 화면 캡처(Screen Capture), 사진 촬영, 녹음 등의 방법을 통해 정보를 무단으로 수집하거나 외부로 유출하지 않겠습니다.
3. 서비스 기능상 불가피하게 임시 저장된 파일은 멘토링 종료 즉시 복구 불가능한 방법으로 파기하겠습니다.

제4조 (계정 관리 책임)
본인은 멘토 계정 및 접속 권한을 타인에게 양도하거나 공유하지 않으며, 계정 도용으로 인한 정보 유출 사고 예방을 위해 보안 수칙을 준수하겠습니다.

제5조 (위반 시 책임)
본 서약을 위반하여 멘티의 개인정보를 유출하거나 회사 및 멘티에게 손해를 끼친 경우, 본인은 다음과 같은 책임을 질 것을 동의합니다.
1. 멘토 자격 즉시 박탈 및 서비스 영구 이용 정지
2. 관련 법령(개인정보 보호법 등)에 따른 민·형사상 책임 및 손해배상 의무 부담

제6조 (서약의 효력)
본 서약의 효력은 멘토 활동 종료 후에도 멘티의 개인정보 보호 의무가 유지되는 한 계속 유효합니다.`;

const PRIVACY_PLEDGE_TEXT = `### [Re-fit] 멘토 개인정보 보호 및 보안 서약서

본인은 일구하조(이하 “회사”)가 제공하는 Re-fit 서비스(이하 “서비스”)의 멘토로서 활동함에 있어, 멘티(이용자)의 개인정보 보호를 위해 다음 사항을 준수할 것을 엄숙히 서약합니다.

제1조 (목적)
본 서약은 멘토링 과정에서 알게 된 멘티의 이력서, 포트폴리오, 상담 내용 등 일체의 개인정보 및 비공개 정보(이하 “개인정보 등”)를 보호하는 데 목적이 있습니다.

제2조 (비밀 유지 및 목적 외 이용 금지)
1. 본인은 서비스를 통해 제공받은 멘티의 개인정보 등을 오직 멘토링 및 피드백 제공 목적으로만 사용하겠습니다.
2. 본인은 회사의 사전 승인 없이 개인정보 등을 제3자에게 제공, 누설, 공개하거나, 멘토링 외의 목적(사적 연락, 영리 추구, 홍보, 채용 알선 등)으로 이용하지 않겠습니다.

제3조 (복제 및 저장 금지)
1. 본인은 멘티의 이력서 파일이나 상담 내용을 개인 PC, 스마트폰, 클라우드 저장소 등에 다운로드하거나 영구 저장하지 않겠습니다.
2. 본인은 화면 캡처(Screen Capture), 사진 촬영, 녹음 등의 방법을 통해 정보를 무단으로 수집하거나 외부로 유출하지 않겠습니다.
3. 서비스 기능상 불가피하게 임시 저장된 파일은 멘토링 종료 즉시 복구 불가능한 방법으로 파기하겠습니다.

제4조 (계정 관리 책임)
본인은 멘토 계정 및 접속 권한을 타인에게 양도하거나 공유하지 않으며, 계정 도용으로 인한 정보 유출 사고 예방을 위해 보안 수칙을 준수하겠습니다.

제5조 (위반 시 책임)
본 서약을 위반하여 멘티의 개인정보를 유출하거나 회사 및 멘티에게 손해를 끼친 경우, 본인은 다음과 같은 책임을 질 것을 동의합니다.
1. 멘토 자격 즉시 박탈 및 서비스 영구 이용 정지
2. 관련 법령(개인정보 보호법 등)에 따른 민·형사상 책임 및 손해배상 의무 부담

제6조 (서약의 효력)
본 서약의 효력은 멘토 활동 종료 후에도 멘티의 개인정보 보호 의무가 유지되는 한 계속 유효합니다.`;

function renderLegalText(text: string) {
  return text.split('\n').map((rawLine, index) => {
    const cleaned = rawLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
    if (!cleaned) {
      return <div key={`legal-spacer-${index}`} className="h-3" />;
    }

    let className = 'text-[12px] text-text-body';
    if (
      /^제\d+조/.test(cleaned) ||
      cleaned.startsWith('부칙') ||
      cleaned.startsWith('[Re-fit]') ||
      cleaned.startsWith('Re-fit 개인정보처리방침')
    ) {
      className = 'text-[14px] font-semibold text-text-body';
    } else if (/^\d+\.\s/.test(cleaned)) {
      className = 'text-[13px] font-semibold text-text-body';
    } else if (cleaned.startsWith('-')) {
      className = 'text-[12px] text-text-body';
    }

    return (
      <p key={`legal-line-${index}`} className={className}>
        {cleaned}
      </p>
    );
  });
}

export default function OnboardingProfileForm({ role }: OnboardingProfileFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role')?.toLowerCase();
  const resolvedRole: RoleId =
    roleParam === 'expert' || roleParam === 'seeker' ? roleParam : (role ?? 'seeker');
  const isExpert = resolvedRole === 'expert';
  const displayRole = roleTitle[resolvedRole] ?? roleTitle.seeker;
  const [currentStep, setCurrentStep] = useState<0 | 1>(() => (isExpert ? 0 : 1));
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerLevel | null>(null);
  const [selectedTech, setSelectedTech] = useState<Skill[]>([]);
  const [techQuery, setTechQuery] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [techLimitMessage, setTechLimitMessage] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [careerLevels, setCareerLevels] = useState<CareerLevel[]>([]);
  const [careerLoading, setCareerLoading] = useState(true);
  const [careerError, setCareerError] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string[]>([]);
  const [lastSentEmail, setLastSentEmail] = useState<string | null>(null);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [sendVerificationMessage, setSendVerificationMessage] = useState<string | null>(null);
  const [sendVerificationError, setSendVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerificationFailSheetOpen, setIsVerificationFailSheetOpen] = useState(false);
  const [verificationExpiresAt, setVerificationExpiresAt] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [nickname, setNickname] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [privacyPledgeOpen, setPrivacyPledgeOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [pledgeAgreed, setPledgeAgreed] = useState(false);
  const allRequiredAgreed = termsAgreed && privacyAgreed && (!isExpert || pledgeAgreed);
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isNicknameChecking, setIsNicknameChecking] = useState(false);
  const [checkedNickname, setCheckedNickname] = useState<string | null>(null);
  const handleCommonApiError = useCommonApiErrorHandler();

  useEffect(() => {
    const trimmed = nickname.trim();
    if (checkedNickname && trimmed !== checkedNickname) {
      setCheckedNickname(null);
      setNicknameCheckMessage(null);
    }
  }, [checkedNickname, nickname]);

  useEffect(() => {
    let isMounted = true;
    getSkills()
      .then((data) => {
        if (!isMounted) return;
        setSkills(data.skills);
      })
      .catch(async (error: unknown) => {
        if (!isMounted) return;
        if (await handleCommonApiError(error)) return;
        setSkillsError(error instanceof Error ? error.message : '스킬 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!isMounted) return;
        setSkillsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [handleCommonApiError]);

  useEffect(() => {
    let isMounted = true;
    getJobs()
      .then((data) => {
        if (!isMounted) return;
        setJobs(data.jobs);
      })
      .catch(async (error: unknown) => {
        if (!isMounted) return;
        if (await handleCommonApiError(error)) return;
        setJobsError(error instanceof Error ? error.message : '직무 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!isMounted) return;
        setJobsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [handleCommonApiError]);

  useEffect(() => {
    let isMounted = true;
    getCareerLevels()
      .then((data) => {
        if (!isMounted) return;
        setCareerLevels(data.career_levels);
      })
      .catch(async (error: unknown) => {
        if (!isMounted) return;
        if (await handleCommonApiError(error)) return;
        setCareerError(error instanceof Error ? error.message : '경력 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!isMounted) return;
        setCareerLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [handleCommonApiError]);

  const filteredTech = useMemo(() => {
    const query = techQuery.trim().toLowerCase();
    if (!query) return skills;
    return skills.filter((item) => item.name.toLowerCase().includes(query));
  }, [skills, techQuery]);

  const toggleTech = (value: Skill) => {
    setSelectedTech((prev) => {
      if (prev.some((item) => item.id === value.id)) {
        setTechLimitMessage(null);
        return prev.filter((item) => item.id !== value.id);
      }
      if (prev.length >= 5) {
        setTechLimitMessage('기술스택은 최대 5개까지 선택할 수 있어요.');
        return prev;
      }
      setTechLimitMessage(null);
      return [...prev, value];
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!selectedJob || !selectedCareer || selectedTech.length === 0) {
      setSubmitError('직무, 경력, 기술스택을 모두 선택해 주세요.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const raw = sessionStorage.getItem('kakaoLoginResult');
      if (!raw) {
        setSubmitError('소셜 로그인 정보가 없습니다. 다시 로그인해 주세요.');
        return;
      }

      let oauthId = '';
      let fallbackNickname = '';
      let email = '';

      try {
        const parsed = JSON.parse(raw) as {
          signup_required?: {
            oauth_provider?: string;
            oauth_id?: string;
            email?: string | null;
            nickname?: string | null;
          };
        };
        const signupRequired = parsed.signup_required;
        if (signupRequired) {
          oauthId = signupRequired.oauth_id ?? '';
          fallbackNickname = signupRequired.nickname ?? '';
          email = signupRequired.email ?? '';
        }
      } catch {
        setSubmitError('로그인 정보 파싱에 실패했습니다. 다시 로그인해 주세요.');
        return;
      }

      const resolvedNickname = nickname.trim() || fallbackNickname;
      if (!oauthId) {
        setSubmitError('소셜 로그인 정보가 부족합니다. 다시 로그인해 주세요.');
        return;
      }
      if (!resolvedNickname) {
        setSubmitError('닉네임을 입력해 주세요.');
        return;
      }
      if (!email) {
        setSubmitError('이메일 정보가 없습니다. 다시 로그인해 주세요.');
        return;
      }
      const userType: UserType = isExpert ? 'EXPERT' : 'JOB_SEEKER';

      const signupPayload = {
        oauth_provider: 'KAKAO' as const,
        oauth_id: oauthId,
        email,
        company_email:
          isExpert && isVerified ? (lastSentEmail ?? verificationEmail.trim()) : undefined,
        nickname: resolvedNickname,
        user_type: userType,
        career_level_id: selectedCareer.id,
        job_ids: [selectedJob.id],
        skills: selectedTech.map((skill, index) => ({
          skill_id: skill.id,
          display_order: index + 1,
        })),
        introduction: introduction.trim(),
      };

      const signupResult = await signup({
        ...signupPayload,
      });
      setAuthCookies({
        accessToken: signupResult.accessToken,
        refreshToken: signupResult.refreshToken,
        userId: signupResult.userId,
      });
      sessionStorage.setItem('signupSuccess', 'true');
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (!wsUrl) {
          console.warn('[WS] NEXT_PUBLIC_WS_URL is missing');
        } else {
          const accessToken = readAccessToken();
          const connectHeaders = accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined;
          await stompManager.connect(wsUrl, { connectHeaders });
        }
      } catch (wsError) {
        console.warn('[WS] connect after signup failed', wsError);
      }
      router.replace('/');
    } catch (error: unknown) {
      if (await handleCommonApiError(error)) {
        return;
      }
      if (error instanceof BusinessError) {
        setSubmitError(
          signupErrorMessages[error.code] ?? error.message ?? defaultSignupErrorMessage,
        );
      } else if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError(defaultSignupErrorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNicknameCheck = async () => {
    if (isNicknameChecking) return;
    const trimmed = nickname.trim();

    setIsNicknameChecking(true);
    setNicknameCheckMessage(null);

    try {
      const data = await checkNickname(trimmed);
      setCheckedNickname(trimmed);
      if (data.available) {
        setNicknameCheckMessage({ tone: 'success', text: '사용 가능한 닉네임입니다.' });
      } else {
        setNicknameCheckMessage({ tone: 'error', text: '이미 사용 중인 닉네임입니다.' });
      }
    } catch (error: unknown) {
      if (await handleCommonApiError(error)) {
        return;
      }
      if (error instanceof BusinessError) {
        setNicknameCheckMessage({
          tone: 'error',
          text:
            nicknameValidationMessages[error.code] ??
            error.message ??
            '닉네임 확인에 실패했습니다.',
        });
      } else if (error instanceof Error) {
        setNicknameCheckMessage({ tone: 'error', text: error.message });
      } else {
        setNicknameCheckMessage({ tone: 'error', text: '닉네임 확인에 실패했습니다.' });
      }
    } finally {
      setIsNicknameChecking(false);
    }
  };

  const isNicknameCheckDisabled =
    isNicknameChecking || nickname.trim().length === 0 || nickname.trim().length >= nicknameLimit;

  const isSubmitDisabled =
    isSubmitting ||
    !selectedJob ||
    !selectedCareer ||
    selectedTech.length === 0 ||
    !nickname.trim();
  const isVerificationSubmitDisabled =
    !isVerificationVisible ||
    isVerifying ||
    isVerified ||
    verificationCode.join('').length !== verificationCodeLength ||
    !lastSentEmail ||
    remainingSeconds === 0;

  const handleSendVerification = () => {
    const trimmedEmail = verificationEmail.trim();
    if (!trimmedEmail) {
      setSendVerificationError('이메일을 입력해 주세요.');
      return;
    }
    if (isSendingVerification) return;
    setIsSendingVerification(true);
    setSendVerificationError(null);
    setSendVerificationMessage(null);
    setVerificationError(null);
    setIsVerified(false);
    sendEmailVerification({ email: trimmedEmail })
      .then((data) => {
        setLastSentEmail(trimmedEmail);
        const expiresAt = new Date(data.expires_at);
        setVerificationExpiresAt(expiresAt);
        setRemainingSeconds(Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)));
        setIsVerificationVisible(true);
        setSendVerificationMessage('인증번호를 전송했습니다.');
      })
      .catch(async (error: unknown) => {
        setIsVerificationFailSheetOpen(true);
        if (await handleCommonApiError(error)) {
          return;
        }
        if (error instanceof BusinessError) {
          setSendVerificationError(
            emailVerificationMessages[error.code] ??
              error.message ??
              '인증번호 전송에 실패했습니다.',
          );
        } else if (error instanceof Error) {
          setSendVerificationError(error.message);
        } else {
          setSendVerificationError('인증번호 전송에 실패했습니다.');
        }
      })
      .finally(() => {
        setIsSendingVerification(false);
      });
  };

  const handleKeypadPress = (value: string) => {
    setVerificationCode((prev) => {
      if (value === 'backspace') {
        return prev.slice(0, -1);
      }
      if (prev.length >= verificationCodeLength) return prev;
      return [...prev, value];
    });
  };

  useEffect(() => {
    if (!lastSentEmail) return;
    if (verificationEmail.trim() === lastSentEmail) return;
    setVerificationCode([]);
    setIsVerified(false);
    setVerificationError(null);
    setIsVerificationVisible(false);
    setVerificationExpiresAt(null);
    setRemainingSeconds(null);
  }, [lastSentEmail, verificationEmail]);

  useEffect(() => {
    if (!verificationExpiresAt || !isVerificationVisible) {
      return;
    }

    const tick = () => {
      const secondsLeft = Math.max(
        0,
        Math.floor((verificationExpiresAt.getTime() - Date.now()) / 1000),
      );
      setRemainingSeconds(secondsLeft);
      if (secondsLeft === 0) {
        setVerificationError('인증 시간이 만료되었습니다. 다시 전송해 주세요.');
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [verificationExpiresAt, isVerificationVisible]);

  const handleVerifySubmit = async () => {
    const code = verificationCode.join('');
    if (!isVerificationVisible || isVerifying || isVerified) return;
    if (code.length !== verificationCodeLength) return;
    if (!lastSentEmail) return;
    if (remainingSeconds === 0) {
      setVerificationError('인증 시간이 만료되었습니다. 다시 전송해 주세요.');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setVerificationError('네트워크 오류가 발생했어요. 다시 시도해 주세요.');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    try {
      await verifyEmailVerification({ email: lastSentEmail, code });
      setIsVerified(true);
    } catch (error: unknown) {
      setIsVerificationFailSheetOpen(true);
      if (await handleCommonApiError(error)) {
        return;
      }
      if (error instanceof BusinessError) {
        setVerificationError(
          emailVerificationMessages[error.code] ?? error.message ?? '인증번호 확인에 실패했습니다.',
        );
      } else if (error instanceof Error) {
        setVerificationError(error.message);
      } else {
        setVerificationError('인증번호 확인에 실패했습니다.');
      }
      setVerificationCode([]);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!isExpert) return;
    if (!isVerified) return;
    setCurrentStep(1);
  }, [isExpert, isVerified]);

  const profileFormContent = (
    <>
      <div className="onboarding-form-stagger__item rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <div className="text-base font-semibold text-black">닉네임</div>
        <Input.Root className="mt-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input.Field
                placeholder="닉네임을 입력해 주세요"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                maxLength={nicknameLimit}
                className="rounded-none border-0 border-b-2 border-black bg-transparent px-0 py-2 pr-14 text-base text-black shadow-none focus:border-black focus:ring-0 disabled:border-black disabled:bg-transparent"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-caption">
                {nickname.length} / {nicknameLimit}
              </span>
            </div>
            <button
              type="button"
              onClick={handleNicknameCheck}
              disabled={isNicknameCheckDisabled}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-neutral-400 enabled:border-[var(--color-primary-main)] enabled:bg-[var(--color-primary-main)] enabled:text-white"
            >
              <svg
                data-slot="icon"
                fill="none"
                strokeWidth={2.5}
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
          </div>
          {nicknameCheckMessage ? (
            <p
              className={`mt-2 text-xs ${
                nicknameCheckMessage.tone === 'success' ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {nicknameCheckMessage.text}
            </p>
          ) : null}
        </Input.Root>
      </div>

      <div
        className={`onboarding-form-stagger__item flex flex-col gap-3 ${
          isExpert ? 'mt-2 mb-5' : 'mb-5'
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveSheet('job')}
          className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-3">
            <Image src={iconJob} alt="직무" width={40} height={40} />
            <div className="text-left">
              <span className="text-base font-semibold text-text-body">직무</span>
              <p className="mt-2 text-xs leading-relaxed text-text-caption">
                {selectedJob?.name || '직무를 선택해 주세요'}
              </p>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {selectedJob ? (
              <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
                {selectedJob.name}
              </span>
            ) : null}
            <span className="text-xl text-gray-300">›</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveSheet('career')}
          className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-3">
            <Image src={iconCareer} alt="경력" width={40} height={40} />
            <div className="text-left">
              <span className="text-base font-semibold text-text-body">경력</span>
              <p className="mt-2 text-xs leading-relaxed text-text-caption">
                {selectedCareer?.level || '경력을 선택해 주세요'}
              </p>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {selectedCareer ? (
              <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
                {selectedCareer.level}
              </span>
            ) : null}
            <span className="text-xl text-gray-300">›</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveSheet('tech')}
          className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-3">
            <Image src={iconTech} alt="기술스택" width={40} height={40} />
            <div className="text-left">
              <span className="text-base font-semibold text-text-body">기술스택</span>
              <p className="mt-2 text-xs leading-relaxed text-text-caption">기술을 선택해 주세요</p>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {selectedTech.map((tech) => (
              <span
                key={tech.id}
                className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]"
              >
                {tech.name}
              </span>
            ))}
            <span className="text-xl text-gray-300">›</span>
          </div>
        </button>
      </div>

      <div className="onboarding-form-stagger__item">
        <p className="text-base font-semibold text-text-title">자기 소개</p>
        <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
          <textarea
            className="h-28 w-full resize-none text-base text-text-body placeholder:text-gray-400 focus:outline-none"
            placeholder="Tell us everything..."
            value={introduction}
            onChange={(event) => setIntroduction(event.target.value)}
            maxLength={introductionLimit}
          />
          <p className="mt-2 text-right text-xs text-text-caption">
            {introduction.length}/{introductionLimit}
          </p>
        </div>
        <div className="mt-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={() => {
              const next = !allRequiredAgreed;
              setTermsAgreed(next);
              setPrivacyAgreed(next);
              if (isExpert) setPledgeAgreed(next);
            }}
            className="flex w-full items-center gap-3 text-left"
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                allRequiredAgreed ? 'border-[#2b4b7e] bg-[#2b4b7e]' : 'border-gray-300'
              }`}
              aria-hidden="true"
            >
              {allRequiredAgreed ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
            </span>
            <span className="text-sm font-semibold text-text-body">전체동의</span>
          </button>

          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-xs">
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-text-caption">
                <span className="font-semibold text-primary-main">(필수)</span> 이용약관
              </span>
              <span className="text-base text-gray-300">›</span>
            </button>
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-text-caption">
                <span className="font-semibold text-primary-main">(필수)</span> 개인정보 수집 및 이용 동의서
              </span>
              <span className="text-base text-gray-300">›</span>
            </button>
            {isExpert ? (
              <button
                type="button"
                onClick={() => setPledgeOpen(true)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-text-caption">
                  <span className="font-semibold text-primary-main">(필수)</span> 멘토 보안 서약서
                </span>
                <span className="text-base text-gray-300">›</span>
              </button>
            ) : null}
            {isExpert ? (
              <button
                type="button"
                onClick={() => setPrivacyPledgeOpen(true)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-text-caption">
                  <span className="font-semibold text-primary-main">(필수)</span> 개인정보 서약서
                </span>
                <span className="text-base text-gray-300">›</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="onboarding-form-stagger__item pt-6">
        {submitError ? <p className="mb-3 text-sm text-red-500">{submitError}</p> : null}
        <Button
          icon={<Image src={iconMark} alt="" width={20} height={20} />}
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
        >
          가입 완료
        </Button>
      </div>
    </>
  );

  return (
    <main className="flex min-h-screen flex-col bg-[#F7F7F7] px-2.5 pb-10 pt-4 text-text-body">
      <header className="relative flex items-center">
        <Link href="/onboarding" className="text-2xl text-neutral-700">
          ←
        </Link>
      </header>

      <section className="onboarding-form-stagger mt-10 flex flex-1 flex-col gap-6">
        <div className="onboarding-form-stagger__item">
          <div className="flex items-center gap-2">
            <Image src={iconMarkB} alt="" width={28} height={28} />
            <p className="text-2xl font-semibold text-text-title">환영합니다!</p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
              {displayRole}
            </span>
          </div>
        </div>

        {isExpert ? (
          <div className="onboarding-form-stagger__item">
            <div className="flex items-center gap-2">
              {['이메일 인증', '프로필 입력'].map((label, index) => {
                const stepIndex = index as 0 | 1;
                const isActive = currentStep === stepIndex;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setCurrentStep(stepIndex)}
                    className={`flex flex-1 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      isActive
                        ? 'border-[#2b4b7e] bg-[#edf4ff] text-[#2b4b7e]'
                        : 'border-gray-200 bg-white text-text-caption'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                        isActive ? 'bg-[#2b4b7e] text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {isExpert ? (
          <div className="relative overflow-hidden">
            <div
              className="flex w-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentStep * 100}%)` }}
            >
              <div className="w-full shrink-0 pr-1">
                <div className="onboarding-form-stagger__item rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-title">
                        이메일 인증
                        <span className="ml-1 text-sm font-semibold text-[var(--color-primary-main)]">
                          (회사 이메일로만 인증이 가능합니다.)
                        </span>
                      </p>
                    </div>
                  </div>
                  <Input.Root className="mt-4">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input.Field
                          placeholder="이메일을 입력해 주세요"
                          value={verificationEmail}
                          onChange={(event) => setVerificationEmail(event.target.value)}
                          className="rounded-none border-0 border-b-2 border-b-[var(--color-primary-main)] bg-transparent px-0 py-2 pr-14 text-sm text-text-body shadow-none focus:border-b-[var(--color-primary-main)] focus:ring-0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendVerification}
                        disabled={isSendingVerification || verificationEmail.trim().length === 0}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-neutral-400 enabled:border-[var(--color-primary-main)] enabled:bg-[var(--color-primary-main)] enabled:text-white"
                      >
                        <svg
                          data-slot="icon"
                          fill="none"
                          strokeWidth={2.5}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </button>
                    </div>
                    {sendVerificationMessage ? (
                      <p className="mt-2 text-xs text-[#2b4b7e]">{sendVerificationMessage}</p>
                    ) : null}
                    {sendVerificationError ? (
                      <p className="mt-2 text-xs text-red-500">{sendVerificationError}</p>
                    ) : null}
                  </Input.Root>
                  <div className="mt-6 min-h-[360px]">
                    <div
                      className={`transition-all duration-300 ${
                        isVerificationVisible
                          ? 'opacity-100 translate-y-0'
                          : 'pointer-events-none opacity-0 -translate-y-2'
                      }`}
                    >
                      <div className="text-center">
                        <p className="text-sm font-semibold text-text-title">
                          인증번호 6자리를 입력해 주세요
                        </p>
                        {typeof remainingSeconds === 'number' ? (
                          <p className="mt-2 text-xs text-text-caption">
                            남은 시간 {Math.floor(remainingSeconds / 60)}:
                            {String(remainingSeconds % 60).padStart(2, '0')}
                          </p>
                        ) : null}
                        {isVerifying ? (
                          <p className="mt-2 text-xs text-text-caption">인증 확인 중...</p>
                        ) : null}
                        {isVerified ? (
                          <p className="mt-2 text-xs text-[#2b4b7e]">인증 완료</p>
                        ) : null}
                        {verificationError ? (
                          <p className="mt-2 text-xs text-red-500">{verificationError}</p>
                        ) : null}
                        <div className="mt-4 flex items-center justify-center gap-3">
                          {Array.from({ length: verificationCodeLength }).map((_, index) => {
                            const isFilled = verificationCode[index] !== undefined;
                            return (
                              <span
                                key={`code-dot-${index}`}
                                className={`h-3 w-3 rounded-full border ${
                                  isFilled
                                    ? 'border-[#2b4b7e] bg-[#2b4b7e]'
                                    : 'border-[#bcd1f5] bg-[#edf4ff]'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-10 grid grid-cols-3 gap-6 px-2.5 text-center text-2xl font-semibold text-[#2b4b7e]">
                        {[
                          '3',
                          '7',
                          '0',
                          '6',
                          '8',
                          '2',
                          '4',
                          '1',
                          '5',
                          'biometric',
                          '9',
                          'backspace',
                        ].map((item) => {
                          if (item === 'biometric') {
                            return (
                              <button
                                key="biometric"
                                type="button"
                                aria-hidden="true"
                                className="flex h-16 items-center justify-center text-gray-300"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                  className="h-6 w-6"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7 4h2m6 0h2M4 7v2m0 6v2m16-8v2m0 6v2M8 8h8v8H8z"
                                  />
                                </svg>
                              </button>
                            );
                          }

                          if (item === 'backspace') {
                            return (
                              <button
                                key="backspace"
                                type="button"
                                onClick={() => handleKeypadPress('backspace')}
                                className="flex h-16 items-center justify-center text-[#2b4b7e]"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  className="h-6 w-6"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10 6h8a2 2 0 012 2v8a2 2 0 01-2 2h-8l-4-6 4-6z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13 10l4 4m0-4l-4 4"
                                  />
                                </svg>
                              </button>
                            );
                          }

                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleKeypadPress(item)}
                              className="flex h-16 items-center justify-center"
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex justify-center">
                        <div className="w-full max-w-xs">
                          <Button
                            type="button"
                            onClick={handleVerifySubmit}
                            disabled={isVerificationSubmitDisabled}
                            icon={<Image src={iconMark} alt="" width={20} height={20} />}
                          >
                            제출
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full shrink-0 pl-1">{profileFormContent}</div>
            </div>
          </div>
        ) : (
          profileFormContent
        )}
      </section>

      <BottomSheet
        open={activeSheet !== null}
        title={
          activeSheet === 'job' ? '직무 선택' : activeSheet === 'career' ? '경력 선택' : '기술스택'
        }
        actionLabel="완료"
        onAction={() => setActiveSheet(null)}
        onClose={() => setActiveSheet(null)}
      >
        {activeSheet === 'tech' ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 rounded-full bg-[#edf4ff] px-4 py-3">
              <input
                value={techQuery}
                onChange={(event) => setTechQuery(event.target.value)}
                className="w-full bg-transparent text-sm text-text-body outline-none"
                placeholder="기술을 검색해 보세요"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedTech.map((tech) => (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() => toggleTech(tech)}
                  className="rounded-full border border-[#bcd1f5] bg-[#edf4ff] px-3 py-1 text-xs text-[#2b4b7e]"
                >
                  {tech.name} ×
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 pr-1">
              {skillsLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
              {skillsError ? <p className="text-sm text-red-500">{skillsError}</p> : null}
              {techLimitMessage ? <p className="text-xs text-red-500">{techLimitMessage}</p> : null}
              {!skillsLoading && !skillsError
                ? filteredTech.map((item) => {
                    const isSelected = selectedTech.some((tech) => tech.id === item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleTech(item)}
                        className="flex items-center justify-between border-b border-gray-100 pb-5 pt-2 text-left"
                      >
                        <span className="text-sm font-medium leading-relaxed text-text-body">
                          {item.name}
                        </span>
                        <span
                          className={`h-5 w-5 rounded-full border ${
                            isSelected ? 'border-[#2b4b7e] bg-[#2b4b7e]' : 'border-gray-300'
                          }`}
                        />
                      </button>
                    );
                  })
                : null}
            </div>
          </div>
        ) : null}

        {activeSheet === 'job' ? (
          <div className="flex h-full flex-col">
            {jobsLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
            {jobsError ? <p className="text-sm text-red-500">{jobsError}</p> : null}
            {!jobsLoading && !jobsError ? (
              <div className="flex flex-col gap-6 pr-1">
                {jobs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedJob(item)}
                    className="flex items-center justify-between py-4 text-left"
                  >
                    <span className="text-xl font-semibold leading-relaxed text-text-body">
                      {item.name}
                    </span>
                    <span
                      className={`h-5 w-5 rounded-md border ${
                        selectedJob?.id === item.id
                          ? 'border-[#2b4b7e] bg-[#2b4b7e]'
                          : 'border-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeSheet === 'career' ? (
          <div className="flex h-full flex-col">
            {careerLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
            {careerError ? <p className="text-sm text-red-500">{careerError}</p> : null}
            {!careerLoading && !careerError ? (
              <div className="flex flex-col gap-6 pr-1">
                {careerLevels.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedCareer(item)}
                    className="flex items-center justify-between py-4 text-left"
                  >
                    <span className="text-xl font-semibold leading-relaxed text-text-body">
                      {item.level}
                    </span>
                    <span
                      className={`h-5 w-5 rounded-md border ${
                        selectedCareer?.id === item.id
                          ? 'border-[#2b4b7e] bg-[#2b4b7e]'
                          : 'border-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={isVerificationFailSheetOpen}
        title="안내"
        actionLabel="완료"
        onAction={() => setIsVerificationFailSheetOpen(false)}
        onClose={() => setIsVerificationFailSheetOpen(false)}
      >
        <div className="flex flex-col gap-4 px-1 text-sm text-text-body">
          <div className="rounded-2xl border border-[#f5d08a] bg-[#fff4d6] px-4 py-3 text-center text-[13px] font-semibold text-[#8a5a00]">
            우선 프로필 입력으로 넘어가 주세요.
          </div>
          <div className="rounded-2xl border border-[#bcd1f5] bg-[#edf4ff] px-4 py-3 text-center text-[13px] font-semibold text-[#2b4b7e]">
            이메일 인증은 추후 [마이페이지] &gt; [현직자 인증]
            <br />
            메뉴에서 진행할 수 있어요.
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
            <ul className="space-y-3 text-[13px] leading-relaxed text-text-body">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2b4b7e]" />
                <span>
                  기업 이메일이 등록되지 않은 경우에는 <strong>[문의하기]</strong>를 통해 별도로
                  문의해 주세요.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2b4b7e]" />
                <span>이메일 인증을 완료하지 않으면 인증됨 뱃지를 받을 수 없습니다.</span>
              </li>
            </ul>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        open={termsOpen}
        title="이용약관"
        actionLabel="닫기"
        onAction={() => setTermsOpen(false)}
        onClose={() => setTermsOpen(false)}
      >
        <div className="space-y-1">{renderLegalText(TERMS_TEXT)}</div>
      </BottomSheet>

      <BottomSheet
        open={privacyOpen}
        title="개인정보 처리 방침"
        actionLabel="닫기"
        onAction={() => setPrivacyOpen(false)}
        onClose={() => setPrivacyOpen(false)}
      >
        <div className="space-y-1">{renderLegalText(PRIVACY_TEXT)}</div>
      </BottomSheet>

      <BottomSheet
        open={pledgeOpen}
        title="멘토 개인정보 보호 서약"
        actionLabel="닫기"
        onAction={() => setPledgeOpen(false)}
        onClose={() => setPledgeOpen(false)}
      >
        <div className="space-y-1">{renderLegalText(MENTOR_PLEDGE_TEXT)}</div>
      </BottomSheet>

      <BottomSheet
        open={privacyPledgeOpen}
        title="개인정보 서약서"
        actionLabel="닫기"
        onAction={() => setPrivacyPledgeOpen(false)}
        onClose={() => setPrivacyPledgeOpen(false)}
      >
        <div className="space-y-1">{renderLegalText(PRIVACY_PLEDGE_TEXT)}</div>
      </BottomSheet>
    </main>
  );
}
