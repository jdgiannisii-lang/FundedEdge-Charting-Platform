'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Label } from '@fundededge/ui'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import {
  type ForgotPasswordInput,
  type ResetPasswordInput,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/auth/schemas'

interface PasswordResetFormProps {
  mode: 'request' | 'reset'
  forgotPasswordAction: (input: ForgotPasswordInput) => Promise<unknown>
  resetPasswordAction: (input: ResetPasswordInput) => Promise<unknown>
}

export default function PasswordResetForm({
  mode,
  forgotPasswordAction,
  resetPasswordAction,
}: PasswordResetFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [requestSent, setRequestSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  const requestForm = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })
  const resetForm = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) })

  const onRequestSubmit = (data: ForgotPasswordInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = (await forgotPasswordAction(data)) as { serverError?: string } | undefined
      if (result?.serverError) setServerError(result.serverError)
      else setRequestSent(true)
    })
  }

  const onResetSubmit = (data: ResetPasswordInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = (await resetPasswordAction(data)) as { serverError?: string } | undefined
      if (result?.serverError) setServerError(result.serverError)
    })
  }

  if (mode === 'request') {
    if (requestSent) {
      return (
        <output className="block space-y-2 text-center" aria-live="polite">
          <p className="text-2xl">📨</p>
          <p className="font-medium text-slate-100">Check your email</p>
          <p className="text-sm text-slate-400">
            We sent a password reset link to{' '}
            <strong className="text-slate-200">{requestForm.getValues('email')}</strong>.
          </p>
        </output>
      )
    }

    return (
      <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} noValidate className="space-y-4">
        {serverError && <p className="text-sm text-red-400" role="alert">{serverError}</p>}
        <div className="space-y-1">
          <Label htmlFor="forgot-email" required>Email</Label>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={requestForm.formState.errors.email?.message}
            {...requestForm.register('email')}
          />
        </div>
        <Button type="submit" disabled={isPending} aria-busy={isPending} className="w-full">
          {isPending ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={resetForm.handleSubmit(onResetSubmit)} noValidate className="space-y-4">
      {serverError && <p className="text-sm text-red-400" role="alert">{serverError}</p>}
      <div className="space-y-1">
        <Label htmlFor="reset-password" required>New password</Label>
        <Input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={resetForm.formState.errors.password?.message}
          {...resetForm.register('password')}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="reset-confirm" required>Confirm new password</Label>
        <Input
          id="reset-confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={resetForm.formState.errors.confirmPassword?.message}
          {...resetForm.register('confirmPassword')}
        />
      </div>
      <Button type="submit" disabled={isPending} aria-busy={isPending} className="w-full">
        {isPending ? 'Updating…' : 'Set new password'}
      </Button>
    </form>
  )
}
