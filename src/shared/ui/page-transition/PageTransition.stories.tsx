import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { PageTransition } from '@/shared/ui/page-transition';

const meta = {
  title: 'Shared/PageTransition',
  component: PageTransition,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '페이지 전환 방향에 따라 진입 애니메이션을 적용하는 래퍼 컴포넌트입니다. nav-direction 세션값(forward/back)을 기준으로 동작합니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-[#f7f7f7] p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PageTransition>;

export default meta;

type Story = StoryObj<typeof meta>;

function PageTransitionDemo() {
  const [key, setKey] = useState(0);

  const remountWithDirection = (direction: 'forward' | 'back') => {
    sessionStorage.setItem('nav-direction', direction);
    setKey((prev) => prev + 1);
  };

  return (
    <div className="w-[320px] space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => remountWithDirection('forward')}
          className="rounded-full bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white"
        >
          Forward
        </button>
        <button
          type="button"
          onClick={() => remountWithDirection('back')}
          className="rounded-full border border-brand-primary px-3 py-1.5 text-xs font-semibold text-brand-primary"
        >
          Back
        </button>
      </div>
      <PageTransition key={key}>
        <div
          data-testid="transition-target"
          className="rounded-xl bg-white p-4 text-sm shadow-card-soft"
        >
          페이지 콘텐츠
        </div>
      </PageTransition>
    </div>
  );
}

export const Default: Story = {
  render: () => <PageTransitionDemo />,
};

export const DirectionInteraction: Story = {
  render: () => <PageTransitionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Forward' }));
    await expect(canvas.getByTestId('transition-target')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(canvas.getByTestId('transition-target')).toBeInTheDocument();
  },
};
