import type { Meta, StoryObj } from '@storybook/react'
import { ThemeProvider } from '@fundededge/ui'
import ThemeToggle from './theme-toggle'

const meta: Meta<typeof ThemeToggle> = {
  title: 'Shell/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0b0d' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const SystemTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="system" attribute="class">
        <Story />
      </ThemeProvider>
    ),
  ],
}

export const LightTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light" attribute="class">
        <Story />
      </ThemeProvider>
    ),
  ],
}

export const DarkTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="dark" attribute="class">
        <Story />
      </ThemeProvider>
    ),
  ],
}
