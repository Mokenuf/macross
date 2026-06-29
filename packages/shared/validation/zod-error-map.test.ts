import { describe, expect, it } from 'vitest'
import * as z from 'zod'

import { setPasswordSchema } from '../types/auth'
import { makeZodCustomError } from './zod-error-map'

const t = (key: string, params?: Record<string, unknown>) =>
  params ? `${key}:${JSON.stringify(params)}` : key

z.config({ customError: makeZodCustomError(t) })

function firstMessage(schema: z.ZodType, value: unknown) {
  const result = schema.safeParse(value)
  return result.success ? null : result.error.issues[0]?.message
}

describe('makeZodCustomError', () => {
  it('campo faltante → required', () => {
    expect(firstMessage(z.object({ name: z.string().min(1) }), {})).toBe('validation.required')
  })

  it('string vacío con min(1) → required', () => {
    expect(firstMessage(z.string().min(1), '')).toBe('validation.required')
  })

  it('min(n) con n>1 → minLength con el parámetro', () => {
    expect(firstMessage(z.string().min(8), 'abc')).toBe('validation.minLength:{"min":8}')
  })

  it('email inválido → email', () => {
    expect(firstMessage(z.email(), 'no-es-email')).toBe('validation.email')
  })

  it('refine con params.i18nKey → la clave traducida', () => {
    expect(firstMessage(setPasswordSchema, { password: 'abcdefgh', confirm: 'otra' })).toBe(
      'validation.passwordMismatch',
    )
  })

  it('código no override-ado → undefined (cae al locale nativo)', () => {
    const message = firstMessage(z.string().max(3), 'abcd')
    expect(message).not.toMatch(/^validation\./)
  })
})
