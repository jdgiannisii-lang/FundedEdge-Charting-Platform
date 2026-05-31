import type { Meta, StoryObj } from '@storybook/react'
import Cockpit from './cockpit'

const meta: Meta<typeof Cockpit> = {
  title: 'Shell/Cockpit',
  component: Cockpit,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0b0d' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
