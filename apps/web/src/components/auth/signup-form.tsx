'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Label } from '@fundededge/ui'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { type SignUpInput, signUpSchema } from '@/lib/auth/schemas'

interface SignupFormProps {
  signUpAction: (input: SignUpInput) => Promise<unknown>
}

export default function SignupForm({ signUpAction }: SignupFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) })

  const onSubmit = (data: SignUpInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = (await signUpAction(data)) as { serverError?: string } | undefined
      if (result?.serverError) setServerError(result.serverError)
      else setSubmitted(true)
    })
  }

  if (submitted) {
    return (
      <output className="block space-y-2 text-center" aria-live="polite">
        <p className="text-2xl">📬</p>
        <p className="font-medium text-slate-100">Check your email</p>
        <p className="text-sm text-slate-400">
          We sent a verification link to{' '}
          <strong className="text-slate-200">{form.getValues('email')}</strong>.
          Click it to activate your account.
        </p>
      </output>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && <p className="text-sm text-red-400" role="alert">{serverError}</p>}

      <div className="space-y-1">
        <Label htmlFor="signup-email" required>Email</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="signup-password" required>Password</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="signup-confirm" required>Confirm password</Label>
        <Input
          id="signup-confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={form.formState.errors.confirmPassword?.message}
          {...form.register('confirmPassword')}
        />
      </div>

      <Button type="submit" disabled={isPending} aria-busy={isPending} className="w-full">
        {isPending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}
