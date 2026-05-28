import type { Metadata } from 'next'
import Link from 'next/link'
import PasswordResetForm from '@/components/auth/password-reset-form'
import { forgotPasswordAction, resetPasswordAction } from '@/lib/auth/actions'

export const metadata: Metadata = { title: 'Reset password — FundedEdge' }

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white">Reset password</h1>
        <p className="mt-2 text-sm text-slate-400">
          {"Remember it? "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <PasswordResetForm
        mode="request"
        forgotPasswordAction={forgotPasswordAction}
        resetPasswordAction={resetPasswordAction}
      />
    </div>
  )
}
