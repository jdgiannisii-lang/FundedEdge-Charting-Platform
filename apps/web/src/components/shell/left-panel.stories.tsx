import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { useEffect } from 'react'
import { useUiStore } from '@/stores/ui'
import LeftPanel from './left-panel'

const meta: Meta<typeof LeftPanel> = {
  title: 'Shell/LeftPanel',
  component: LeftPanel,
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
    children: (
      <div className="p-4 text-sm text-[--color-text-secondary]">Prop dashboard area</div>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', width: 320 }}>
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
        useUiStore.setState({ leftCollapsed: false })
      }, [])
      return <Story />
    },
  ],
}

export const Collapsed: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        useUiStore.setState({ leftCollapsed: true })
      }, [])
      return <Story />
    },
  ],
}
