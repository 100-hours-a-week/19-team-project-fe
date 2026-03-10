import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { AuthGateSheet } from '@/shared/ui/auth-gate';

const meta = {
  title: 'Shared/AuthGateSheet',
  component: AuthGateSheet,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: false,
    title: '로그인이 필요합니다',
    onClose: () => {},
    children: null,
  },
} satisfies Meta<typeof AuthGateSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

function AuthGateSheetDemo({ description }: { description?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-[280px] bg-[#f7f7f7] p-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
      >
        인증 시트 열기
      </button>
      <AuthGateSheet
        open={open}
        title="로그인이 필요합니다"
        description={description}
        onClose={() => setOpen(false)}
      >
        <button
          type="button"
          className="h-12 w-full rounded-full bg-[#fee500] text-sm font-semibold text-[#3c1e1e]"
        >
          카카오로 시작하기
        </button>
      </AuthGateSheet>
    </div>
  );
}

export const Default: Story = {
  render: () => <AuthGateSheetDemo />,
};

export const WithDescription: Story = {
  render: () => <AuthGateSheetDemo description="피드백을 보려면 로그인해 주세요." />,
};

export const OpenInteraction: Story = {
  render: () => <AuthGateSheetDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: '인증 시트 열기' }));
    await expect(await body.findByRole('dialog')).toBeInTheDocument();
    await expect(body.getByText('로그인이 필요합니다')).toBeInTheDocument();
  },
};
