import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { ProfileCard } from '@/shared/ui/profile-card';

const meta = {
  title: 'Shared/ProfileCard',
  component: ProfileCard,
  parameters: {
    layout: 'centered',
  },
  args: {
    name: '김리핏',
    title: 'Frontend Engineer',
    subtitle: 'Re:fit Mentor',
    cardHeight: '240px',
    maxHeight: '260px',
    aspectRatio: '0.74',
  },
} satisfies Meta<typeof ProfileCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[220px]">
      <ProfileCard {...args} />
    </div>
  ),
};

export const WithoutTilt: Story = {
  render: (args) => (
    <div className="w-[220px]">
      <ProfileCard {...args} enableTilt={false} behindGlowEnabled={false} />
    </div>
  ),
};

export const RenderInteraction: Story = {
  render: (args) => (
    <div className="w-[220px]">
      <ProfileCard {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('김리핏')).toBeInTheDocument();
    await expect(canvas.getByText('Frontend Engineer')).toBeInTheDocument();
  },
};
