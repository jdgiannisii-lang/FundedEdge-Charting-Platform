import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import PasswordResetForm from './password-reset-form'

const meta: Meta<typeof PasswordResetForm> = {
  title: 'Auth/PasswordResetForm',
  component: PasswordResetForm,
  parameters: { layout: 'centered' },
  args: {
    mode: 'request',
    forgotPasswordAction: fn(),
    resetPasswordAction: fn(),
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

export const RequestMode: Story = {
  args: { mode: 'request' },
}

export const RequestSent: Story = {
  args: {
    mode: 'request',
    forgotPasswordAction: fn().mockResolvedValue({ data: { success: true } }),
  },
}

export const ResetMode: Story = {
  args: { mode: 'reset' },
}

export const ResetError: Story = {
  args: {
    mode: 'reset',
    resetPasswordAction: fn().mockResolvedValue({ serverError: 'This link has expired. Please request a new one.' }),
  },
}
