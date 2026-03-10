import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { BlurText } from '@/shared/ui/blur-text';

const meta = {
  title: 'Shared/BlurText',
  component: BlurText,
  parameters: {
    layout: 'padded',
  },
  args: {
    text: '현직자와의 커피챗을 더 빠르게 시작해보세요.',
    animateBy: 'words',
    direction: 'top',
    delay: 120,
    className: 'text-lg font-semibold text-white',
  },
} satisfies Meta<typeof BlurText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Words: Story = {
  render: (args) => (
    <div className="rounded-2xl bg-[#111827] p-6">
      <BlurText {...args} />
    </div>
  ),
};

export const LettersBottom: Story = {
  render: (args) => (
    <div className="rounded-2xl bg-[#111827] p-6">
      <BlurText {...args} animateBy="letters" direction="bottom" className="text-base text-white" />
    </div>
  ),
};

export const RenderInteraction: Story = {
  render: (args) => (
    <div data-testid="blur-text-story" className="rounded-2xl bg-[#111827] p-6">
      <BlurText {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wrapper = canvas.getByTestId('blur-text-story');
    await expect(wrapper).toBeInTheDocument();
    await expect(wrapper.querySelectorAll('span').length).toBeGreaterThan(0);
  },
};
