import type { Metadata } from 'next'
import Link from 'next/link'
import LoginForm from '@/components/auth/login-form'
import {
  signInAction,
  signInWithGoogleAction,
  signInWithMagicLinkAction,
} from '@/lib/auth/actions'

export const metadata: Metadata = { title: 'Sign in — FundedEdge' }

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams
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

      {error && (
        <p className="rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <LoginForm
        signInAction={signInAction}
        signInWithMagicLinkAction={signInWithMagicLinkAction}
        signInWithGoogleAction={signInWithGoogleAction}
      />

      <p className="text-center text-sm text-slate-400">
        <Link href="/forgot-password" className="hover:text-slate-200 hover:underline">
          Forgot your password?
        </Link>
      </p>
    </div>
  )
}
