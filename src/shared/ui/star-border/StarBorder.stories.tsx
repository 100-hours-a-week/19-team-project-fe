import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { StarBorder } from '@/shared/ui/star-border';

const meta = {
  title: 'Shared/StarBorder',
  component: StarBorder,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: '요청 보내기',
    color: '#4aa3ff',
    speed: '6s',
    starOpacity: 0.7,
    onClick: fn(),
  },
} satisfies Meta<typeof StarBorder>;

export default meta;

type Story = StoryObj<typeof meta>;
const onClickMock = fn();

export const Default: Story = {};

export const FastAndWarm: Story = {
  args: {
    color: '#ffb85c',
    speed: '3.5s',
    starOpacity: 0.85,
    children: '빠른 요청',
  },
};

export const ClickInteraction: Story = {
  args: {
    onClick: onClickMock,
    children: '클릭 테스트',
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    onClickMock.mockClear();
    await userEvent.click(canvas.getByRole('button', { name: '클릭 테스트' }));
    await expect(onClickMock).toHaveBeenCalledTimes(1);
  },
};
