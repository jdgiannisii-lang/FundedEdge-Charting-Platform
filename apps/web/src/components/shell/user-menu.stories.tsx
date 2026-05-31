import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { ThemeProvider } from '@fundededge/ui'
import UserMenu from './user-menu'

const meta: Meta<typeof UserMenu> = {
  title: 'Shell/UserMenu',
  component: UserMenu,
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
  args: {
    signOutAction: fn(),
  },
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="dark" attribute="class">
        <Story />
      </ThemeProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
