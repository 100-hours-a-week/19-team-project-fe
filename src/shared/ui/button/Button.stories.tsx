import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '@/shared/ui/button';

const meta = {
  title: 'Shared/Button',
  component: Button,
  parameters: {
    layout: 'padded',
  },
  args: {
    children: '확인',
    variant: 'primary',
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '보조 버튼',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: '취소',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: '비활성화',
  },
};

export const WithIcon: Story = {
  args: {
    children: '다음',
    icon: <span aria-hidden="true">→</span>,
  },
};

export const LongText: Story = {
  args: {
    children: '지원서 초안을 저장하고 다음 단계로 이동하기',
  },
};

export const ClickInteraction: Story = {
  args: {
    children: '클릭 테스트',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: '클릭 테스트' });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
