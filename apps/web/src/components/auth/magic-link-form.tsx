'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Label } from '@fundededge/ui'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { type MagicLinkInput, magicLinkSchema } from '@/lib/auth/schemas'

interface MagicLinkFormProps {
  signInWithMagicLinkAction: (input: MagicLinkInput) => Promise<unknown>
}

export default function MagicLinkForm({ signInWithMagicLinkAction }: MagicLinkFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<MagicLinkInput>({ resolver: zodResolver(magicLinkSchema) })

  const onSubmit = (data: MagicLinkInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = (await signInWithMagicLinkAction(data)) as { serverError?: string } | undefined
      if (result?.serverError) setServerError(result.serverError)
      else setSent(true)
    })
  }

  if (sent) {
    return (
      <output className="block space-y-2 text-center" aria-live="polite">
        <p className="text-2xl">✉️</p>
        <p className="font-medium text-slate-100">Check your inbox</p>
        <p className="text-sm text-slate-400">
          We sent a sign-in link to{' '}
          <strong className="text-slate-200">{form.getValues('email')}</strong>.
        </p>
      </output>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && <p className="text-sm text-red-400" role="alert">{serverError}</p>}

      <div className="space-y-1">
        <Label htmlFor="magic-link-email" required>Email</Label>
        <Input
          id="magic-link-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />
      </div>

      <Button type="submit" disabled={isPending} aria-busy={isPending} className="w-full">
        {isPending ? 'Sending…' : 'Send magic link'}
      </Button>
    </form>
  )
}
