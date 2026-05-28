import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import GoogleButton from './google-button'

const meta: Meta<typeof GoogleButton> = {
  title: 'Auth/GoogleButton',
  component: GoogleButton,
  parameters: { layout: 'centered' },
  args: {
    signInWithGoogleAction: fn(),
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

export const OAuthError: Story = {
  args: {
    signInWithGoogleAction: fn().mockResolvedValue({ serverError: 'An unexpected error occurred.' }),
  },
}
