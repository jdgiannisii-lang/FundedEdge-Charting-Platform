import type { Metadata } from 'next'
import Link from 'next/link'
import SignupForm from '@/components/auth/signup-form'
import { signUpAction } from '@/lib/auth/actions'

export const metadata: Metadata = { title: 'Create account — FundedEdge' }

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        <p className="mt-2 text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <SignupForm signUpAction={signUpAction} />
    </div>
  )
}
