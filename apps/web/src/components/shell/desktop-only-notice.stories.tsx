import type { Meta, StoryObj } from '@storybook/react'
import DesktopOnlyNotice from './desktop-only-notice'

const meta: Meta<typeof DesktopOnlyNotice> = {
  title: 'Shell/DesktopOnlyNotice',
  component: DesktopOnlyNotice,
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
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
