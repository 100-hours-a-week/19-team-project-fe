import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { BottomSheet } from '@/shared/ui/bottom-sheet';

const meta = {
  title: 'Shared/BottomSheet',
  component: BottomSheet,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: false,
    onClose: fn(),
    children: null,
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

function BottomSheetDemo({
  defaultOpen = false,
  showAction = false,
}: {
  defaultOpen?: boolean;
  showAction?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="min-h-[280px] bg-[#f7f7f7] p-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
      >
        바텀시트 열기
      </button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="직무 선택"
        description="원하는 직무를 선택한 뒤 적용할 수 있습니다."
        actionLabel={showAction ? '적용' : undefined}
        onAction={showAction ? fn() : undefined}
      >
        <div className="space-y-2">
          <button
            type="button"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left"
          >
            프론트엔드 개발자
          </button>
          <button
            type="button"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left"
          >
            백엔드 개발자
          </button>
          <button
            type="button"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left"
          >
            데이터 엔지니어
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

export const Default: Story = {
  render: () => {
    return <BottomSheetDemo />;
  },
};

export const OpenedWithAction: Story = {
  render: () => {
    return <BottomSheetDemo defaultOpen showAction />;
  },
};

export const OpenInteraction: Story = {
  render: () => {
    return <BottomSheetDemo />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: '바텀시트 열기' });
    await userEvent.click(trigger);
    await expect(await body.findByRole('dialog')).toBeInTheDocument();
    await expect(body.getByText('직무 선택')).toBeInTheDocument();
  },
};

export const CloseByEscapeInteraction: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div className="min-h-[280px] bg-[#f7f7f7] p-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
        >
          바텀시트 열기
        </button>
        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          title="직무 선택"
          description="원하는 직무를 선택한 뒤 적용할 수 있습니다."
        >
          <div className="space-y-2">
            <button
              type="button"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left"
            >
              프론트엔드 개발자
            </button>
            <button
              type="button"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left"
            >
              백엔드 개발자
            </button>
          </div>
        </BottomSheet>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: '바텀시트 열기' });
    await userEvent.click(trigger);
    await expect(await body.findByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
};
