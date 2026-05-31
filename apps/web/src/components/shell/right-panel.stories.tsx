import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { useEffect } from 'react'
import { useUiStore } from '@/stores/ui'
import RightPanel from './right-panel'

const meta: Meta<typeof RightPanel> = {
  title: 'Shell/RightPanel',
  component: RightPanel,
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
  args: {
    onToggle: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', width: 360 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Expanded: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        useUiStore.setState({ rightCollapsed: false })
      }, [])
      return <Story />
    },
  ],
}

export const Collapsed: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        useUiStore.setState({ rightCollapsed: true })
      }, [])
      return <Story />
    },
  ],
}
