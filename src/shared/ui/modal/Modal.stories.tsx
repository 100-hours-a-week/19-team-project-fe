import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Modal } from '@/shared/ui/modal';

const meta = {
  title: 'Shared/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '확인/취소가 필요한 작업에 사용하는 다이얼로그입니다. compact 옵션으로 정보 밀도를 높일 수 있습니다.',
      },
    },
  },
  args: {
    open: false,
    title: '정말 삭제할까요?',
    description: '삭제 후에는 복구할 수 없습니다.',
    confirmLabel: '삭제',
    cancelLabel: '취소',
    compact: false,
    onCancel: fn(),
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    confirmLabel: { control: 'text' },
    cancelLabel: { control: 'text' },
    compact: { control: 'boolean' },
  },
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

function ModalDemo({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const onConfirm = fn();

  return (
    <div className="min-h-[280px] bg-[#f7f7f7] p-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
      >
        모달 열기
      </button>
      <Modal
        open={open}
        compact={compact}
        title="정말 삭제할까요?"
        description="삭제 후에는 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={() => {
          onConfirm();
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <ModalDemo />,
};

export const Playground: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);

    return (
      <div className="min-h-[280px] bg-[#f7f7f7] p-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
        >
          모달 열기
        </button>
        <Modal
          {...args}
          open={open}
          onCancel={() => setOpen(false)}
          onConfirm={() => setOpen(false)}
        />
      </div>
    );
  },
};

export const Compact: Story = {
  render: () => <ModalDemo compact />,
};

export const OpenCloseInteraction: Story = {
  render: () => <ModalDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: '모달 열기' }));
    await expect(await body.findByRole('dialog')).toBeInTheDocument();
    await userEvent.click(body.getByRole('button', { name: '취소' }));
    await waitFor(() => {
      expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
};
