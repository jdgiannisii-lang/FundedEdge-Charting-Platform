import type { Metadata } from 'next'
import PasswordResetForm from '@/components/auth/password-reset-form'
import { forgotPasswordAction, resetPasswordAction } from '@/lib/auth/actions'

export const metadata: Metadata = { title: 'Set new password — FundedEdge' }

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white">Set new password</h1>
        <p className="mt-2 text-sm text-slate-400">
          Choose a new password for your account.
        </p>
      </div>

      <PasswordResetForm
        mode="reset"
        forgotPasswordAction={forgotPasswordAction}
        resetPasswordAction={resetPasswordAction}
      />
    </div>
  )
}
