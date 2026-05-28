import type { Metadata } from 'next'
import Link from 'next/link'
import LoginForm from '@/components/auth/login-form'
import {
  signInAction,
  signInWithGoogleAction,
  signInWithMagicLinkAction,
} from '@/lib/auth/actions'

export const metadata: Metadata = { title: 'Sign in — FundedEdge' }

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white">Sign in</h1>
        <p className="mt-2 text-sm text-slate-400">
          {"Don't have an account? "}
          <Link href="/signup" className="text-blue-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      <LoginForm
        signInAction={signInAction}
        signInWithMagicLinkAction={signInWithMagicLinkAction}
        signInWithGoogleAction={signInWithGoogleAction}
      />

      <p className="text-center text-sm text-slate-500">
        <Link href="/forgot-password" className="hover:text-slate-300 hover:underline">
          Forgot your password?
        </Link>
      </p>
    </div>
  )
}
