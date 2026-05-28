import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import MagicLinkForm from './magic-link-form'

const meta: Meta<typeof MagicLinkForm> = {
  title: 'Auth/MagicLinkForm',
  component: MagicLinkForm,
  parameters: { layout: 'centered' },
  args: {
    signInWithMagicLinkAction: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Sent: Story = {
  args: {
    signInWithMagicLinkAction: fn().mockResolvedValue({ data: { success: true } }),
  },
}

export const RateLimited: Story = {
  args: {
    signInWithMagicLinkAction: fn().mockResolvedValue({
      serverError: 'Too many requests. Please wait a few minutes and try again.',
    }),
  },
}
