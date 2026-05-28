import { describe, expect, it } from 'vitest'
import {
  forgotPasswordSchema,
  magicLinkSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '../schemas'

describe('signUpSchema', () => {
  it('accepts valid email + matching passwords', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'securepassword',
      confirmPassword: 'securepassword',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = signUpSchema.safeParse({
      email: 'not-an-email',
      password: 'securepassword',
      confirmPassword: 'securepassword',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Invalid email address')
  })

  it('rejects password shorter than 8 characters', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('at least 8 characters')
  })

  it('rejects mismatched passwords', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'different123',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('confirmPassword')
    expect(result.error?.issues[0].message).toBe('Passwords do not match')
  })
})

describe('signInSchema', () => {
  it('accepts valid email + password', () => {
    const result = signInSchema.safeParse({
      email: 'user@example.com',
      password: 'anypassword',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty password', () => {
    const result = signInSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Password is required')
  })

  it('rejects invalid email', () => {
    const result = signInSchema.safeParse({ email: 'bad', password: 'pw' })
    expect(result.success).toBe(false)
  })
})

describe('magicLinkSchema', () => {
  it('accepts valid email', () => {
    expect(magicLinkSchema.safeParse({ email: 'a@b.com' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(magicLinkSchema.safeParse({ email: 'notvalid' }).success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts valid matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpassword1',
      confirmPassword: 'newpassword1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects short password', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('at least 8 characters')
  })

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'password123',
      confirmPassword: 'different123',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Passwords do not match')
  })
})
