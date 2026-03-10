import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Input } from '@/shared/ui/input';

const meta = {
  title: 'Shared/Input',
  component: Input.Root,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '폼 입력 조합 컴포넌트입니다. Label + Field + Message를 함께 사용하며, invalid/tone으로 에러 상태를 표현합니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-[360px] bg-[#f7f7f7] p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    invalid: false,
  },
  argTypes: {
    invalid: { control: 'boolean' },
  },
} satisfies Meta<typeof Input.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[320px]">
      <Input.Root>
        <Input.Label>이메일</Input.Label>
        <Input.Field placeholder="example@company.com" />
        <Input.Message>회사 이메일을 입력해 주세요.</Input.Message>
      </Input.Root>
    </div>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <div className="w-[320px]">
      <Input.Root invalid={args.invalid}>
        <Input.Label>이메일</Input.Label>
        <Input.Field placeholder="example@company.com" />
        <Input.Message tone={args.invalid ? 'error' : 'default'}>
          {args.invalid ? '유효한 이메일 형식이 아닙니다.' : '회사 이메일을 입력해 주세요.'}
        </Input.Message>
      </Input.Root>
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div className="w-[320px]">
      <Input.Root invalid>
        <Input.Label>이메일</Input.Label>
        <Input.Field value="invalid-email" readOnly />
        <Input.Message tone="error" className="text-red-700">
          유효한 이메일 형식이 아닙니다.
        </Input.Message>
      </Input.Root>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[320px]">
      <Input.Root>
        <Input.Label>이메일</Input.Label>
        <Input.Field disabled value="readonly@company.com" readOnly />
        <Input.Message>비활성 상태입니다.</Input.Message>
      </Input.Root>
    </div>
  ),
};

export const TypingInteraction: Story = {
  render: () => {
    const [value, setValue] = useState('');

    return (
      <div className="w-[320px]">
        <Input.Root>
          <Input.Label>이메일</Input.Label>
          <Input.Field
            placeholder="type@refit.kr"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <Input.Message>{value.length > 0 ? '입력 중' : '값을 입력해 주세요.'}</Input.Message>
        </Input.Root>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('이메일');
    await userEvent.type(input, 'hello@refit.kr');
    await expect(input).toHaveValue('hello@refit.kr');
    await expect(canvas.getByText('입력 중')).toBeInTheDocument();
  },
};
