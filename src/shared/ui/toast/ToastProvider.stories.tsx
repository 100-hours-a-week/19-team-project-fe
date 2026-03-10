import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useToast, ToastProvider } from '@/shared/ui/toast';

const meta = {
  title: 'Shared/ToastProvider',
  component: ToastProvider,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ToastProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

function ToastDemo() {
  const { pushToast } = useToast();

  return (
    <div className="min-h-[280px] bg-[#f7f7f7] p-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => pushToast('요청이 실패했습니다.', { variant: 'error', durationMs: 4000 })}
          className="rounded-full bg-[#f3d7d7] px-4 py-2 text-sm font-semibold text-[#b14a4a]"
        >
          Error Toast
        </button>
        <button
          type="button"
          onClick={() =>
            pushToast('저장이 완료되었습니다.', { variant: 'success', durationMs: 4000 })
          }
          className="rounded-full bg-[#eaf7ee] px-4 py-2 text-sm font-semibold text-[#1f7a3d]"
        >
          Success Toast
        </button>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
};

export const Interaction: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Error Toast' }));
    await expect(canvas.getByText('요청이 실패했습니다.')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: '닫기' }));
    await expect(canvas.queryByText('요청이 실패했습니다.')).not.toBeInTheDocument();
  },
};
