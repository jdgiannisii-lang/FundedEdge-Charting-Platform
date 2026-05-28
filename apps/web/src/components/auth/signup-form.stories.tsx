import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import SignupForm from './signup-form'

const meta: Meta<typeof SignupForm> = {
  title: 'Auth/SignupForm',
  component: SignupForm,
  parameters: { layout: 'centered' },
  args: {
    signUpAction: fn(),
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

export const EmailTaken: Story = {
  args: {
    signUpAction: fn().mockResolvedValue({ serverError: 'An account with this email already exists.' }),
  },
}

export const SuccessState: Story = {
  args: {
    signUpAction: fn().mockResolvedValue({ data: { success: true } }),
  },
}
