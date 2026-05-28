import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import LoginForm from './login-form'

const meta: Meta<typeof LoginForm> = {
  title: 'Auth/LoginForm',
  component: LoginForm,
  parameters: { layout: 'centered' },
  args: {
    signInAction: fn(),
    signInWithMagicLinkAction: fn(),
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

export const PasswordError: Story = {
  args: {
    signInAction: fn().mockResolvedValue({ serverError: 'Incorrect email or password.' }),
  },
}

export const MagicLinkSent: Story = {
  args: {
    signInWithMagicLinkAction: fn().mockResolvedValue({ data: { success: true } }),
  },
}
