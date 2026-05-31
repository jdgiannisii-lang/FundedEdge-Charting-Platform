import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Verify your email — FundedEdge' }

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <p className="text-4xl" aria-hidden="true">
        📬
      </p>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Check your email</h1>
        <p className="text-sm text-slate-400">
          We sent you a verification link. Click it to activate your account.
        </p>
        <p className="text-xs text-slate-400">
          {"Didn't get an email? Check your spam folder or "}
          <Link href="/signup" className="text-blue-400 hover:underline">
            try again
          </Link>
          .
        </p>
      </div>
      <Link href="/login" className="inline-block text-sm text-slate-400 hover:text-slate-200 hover:underline">
        Back to sign in
      </Link>
    </div>
  )
}
