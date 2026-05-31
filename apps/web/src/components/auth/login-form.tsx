'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Label } from '@fundededge/ui'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { type MagicLinkInput, type SignInInput, magicLinkSchema, signInSchema } from '@/lib/auth/schemas'

type Tab = 'password' | 'magic-link'

interface LoginFormProps {
  signInAction: (input: SignInInput) => Promise<unknown>
  signInWithMagicLinkAction: (input: MagicLinkInput) => Promise<unknown>
  signInWithGoogleAction: () => Promise<unknown>
}

export default function LoginForm({
  signInAction,
  signInWithMagicLinkAction,
  signInWithGoogleAction,
}: LoginFormProps) {
  const [tab, setTab] = useState<Tab>('password')
  const [serverError, setServerError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  const passwordForm = useForm<SignInInput>({ resolver: zodResolver(signInSchema) })
  const magicLinkForm = useForm<MagicLinkInput>({ resolver: zodResolver(magicLinkSchema) })

  const onPasswordSubmit = (data: SignInInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = (await signInAction(data)) as { serverError?: string } | undefined
      if (result?.serverError) setServerError(result.serverError)
    })
  }

  const onMagicLinkSubmit = (data: MagicLinkInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = (await signInWithMagicLinkAction(data)) as { serverError?: string } | undefined
      if (result?.serverError) setServerError(result.serverError)
      else setMagicLinkSent(true)
    })
  }

  const onGoogleClick = () => {
    setServerError(null)
    startTransition(async () => {
      const result = (await signInWithGoogleAction()) as { serverError?: string } | undefined
      if (result?.serverError) setServerError(result.serverError)
    })
  }

  return (
    <div className="w-full space-y-5">
      {/* Tab switcher */}
      <div className="flex rounded-lg border border-slate-700 p-1" role="tablist" aria-label="Sign-in method">
        {(['password', 'magic-link'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            aria-controls={`tabpanel-${t}`}
            onClick={() => { setTab(t); setServerError(null) }}
            className={[
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              tab === t ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200',
            ].join(' ')}
          >
            {t === 'password' ? 'Password' : 'Magic link'}
          </button>
        ))}
      </div>

      {serverError && <p className="text-sm text-red-400" role="alert">{serverError}</p>}

      {/* Password panel */}
      <div id="tabpanel-password" role="tabpanel" hidden={tab !== 'password'}>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} noValidate className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="signin-email" required>Email</Label>
            <Input
              id="signin-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={passwordForm.formState.errors.email?.message}
              {...passwordForm.register('email')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="signin-password" required>Password</Label>
            <Input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={passwordForm.formState.errors.password?.message}
              {...passwordForm.register('password')}
            />
          </div>
          <Button type="submit" disabled={isPending} aria-busy={isPending} className="w-full">
            {isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700" /></div>
          <div className="relative flex justify-center text-xs text-slate-400"><span className="bg-slate-900 px-2">or</span></div>
        </div>
        <Button type="button" variant="outline" onClick={onGoogleClick} disabled={isPending} className="w-full" aria-label="Continue with Google">
          <GoogleIcon />
          Continue with Google
        </Button>
      </div>

      {/* Magic link panel */}
      <div id="tabpanel-magic-link" role="tabpanel" hidden={tab !== 'magic-link'}>
        {magicLinkSent ? (
          <output className="block text-center text-sm text-slate-300" aria-live="polite">
            Check your inbox — we sent a sign-in link to{' '}
            <strong>{magicLinkForm.getValues('email')}</strong>.
          </output>
        ) : (
          <form onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)} noValidate className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="magic-email" required>Email</Label>
              <Input
                id="magic-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={magicLinkForm.formState.errors.email?.message}
                {...magicLinkForm.register('email')}
              />
            </div>
            <Button type="submit" disabled={isPending} aria-busy={isPending} className="w-full">
              {isPending ? 'Sending…' : 'Send magic link'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
