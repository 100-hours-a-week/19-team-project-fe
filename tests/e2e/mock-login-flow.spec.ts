import { expect, test } from '@playwright/test';
import { createMockFlowState, installMockFlowApi, mockReportGenerated } from './support/mockAuthFlow';

test('mock 기반 로그인 이후 핵심 플로우를 검증한다', async ({ browser }) => {
  const state = createMockFlowState();

  const seekerContext = await browser.newContext();
  const expertContext = await browser.newContext();

  const seekerPage = await seekerContext.newPage();
  const expertPage = await expertContext.newPage();

  await installMockFlowApi(seekerPage, 'seeker', state);
  await installMockFlowApi(expertPage, 'expert', state);

  await seekerPage.goto('/experts');
  await seekerPage.getByPlaceholder('나에게 Fit한 현직자를 찾아보세요').fill('백엔드');
  await seekerPage.getByRole('button', { name: '검색' }).click();
  await seekerPage.getByRole('link', { name: '자세히보기' }).first().click();
  await expect(seekerPage).toHaveURL(/\/experts\/202$/);

  await seekerPage.getByPlaceholder('https://example.com/job/123').fill('https://mock-job.dev/123');
  await seekerPage.locator('select').selectOption('501');
  await seekerPage.getByRole('button', { name: '피드백' }).click();
  await seekerPage.getByRole('button', { name: '확인' }).click();
  await expect(seekerPage).toHaveURL(/\/chat\?tab=sent$/);
  await expect(seekerPage.getByRole('button', { name: '요청 중' })).toBeVisible();

  await expertPage.goto('/chat?tab=received');
  await expect(expertPage.getByText('테스터구직자')).toBeVisible();
  await expertPage.getByRole('button', { name: '수락' }).click();
  await expertPage.getByRole('button', { name: '확인' }).click();
  await expect(expertPage).toHaveURL(/\/chat\/7001$/);

  await mockReportGenerated(state, 7001);
  await seekerPage.goto('/report');
  await expect(seekerPage.getByText('모의 생성 리포트')).toBeVisible();

  await seekerPage.goto('/resume/edit?resumeId=501');
  await expect(seekerPage.getByRole('heading', { name: '이력서 수정' })).toBeVisible();
  await seekerPage.locator('form input').first().fill('업데이트된 이력서 제목');
  await seekerPage.getByRole('button', { name: '이력서 수정' }).click();
  await expect(seekerPage).toHaveURL(/\/resume$/);
  await expect(seekerPage.getByText('업데이트된 이력서 제목')).toBeVisible();

  await seekerContext.close();
  await expertContext.close();
});
