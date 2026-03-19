import type { Preview } from '@storybook/nextjs-vite';
import '../src/app/globals.css';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    a11y: {
      test: 'error',
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    layout: 'centered',
    backgrounds: {
      default: 'app-bg',
      values: [
        { name: 'app-bg', value: '#000000' },
        { name: 'surface', value: '#f7f7f7' },
      ],
    },
  },
};

export default preview;
