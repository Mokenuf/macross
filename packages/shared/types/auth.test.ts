import { describe, expect, it } from 'vitest'

import { loginSchema, requestPasswordResetSchema, setPasswordSchema } from './auth'

describe('loginSchema', () => {
  it('acepta un login valido', () => {
    const result = loginSchema.safeParse({ email: 'fran@macross.com', password: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('rechaza email invalido', () => {
    const result = loginSchema.safeParse({ email: 'no-es-un-email', password: 'secret123' })
    expect(result.success).toBe(false)
  })

  it('rechaza password de menos de 6 caracteres', () => {
    const result = loginSchema.safeParse({ email: 'fran@macross.com', password: '12345' })
    expect(result.success).toBe(false)
  })
})

describe('setPasswordSchema', () => {
  it('acepta cuando password y confirm coinciden', () => {
    const result = setPasswordSchema.safeParse({ password: 'secret123', confirm: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('rechaza cuando las contraseñas no coinciden (refine)', () => {
    const result = setPasswordSchema.safeParse({ password: 'secret123', confirm: 'otra1234' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('confirm')
    }
  })

  it('rechaza password de menos de 8 caracteres', () => {
    const result = setPasswordSchema.safeParse({ password: 'short', confirm: 'short' })
    expect(result.success).toBe(false)
  })

  it('rechaza si falta confirm', () => {
    const result = setPasswordSchema.safeParse({ password: 'secret123' })
    expect(result.success).toBe(false)
  })
})

describe('requestPasswordResetSchema', () => {
  it('acepta un email valido', () => {
    const result = requestPasswordResetSchema.safeParse({ email: 'fran@macross.com' })
    expect(result.success).toBe(true)
  })

  it('rechaza email invalido', () => {
    const result = requestPasswordResetSchema.safeParse({ email: 'no-es-un-email' })
    expect(result.success).toBe(false)
  })

  it('rechaza email string vacio', () => {
    const result = requestPasswordResetSchema.safeParse({ email: '' })
    expect(result.success).toBe(false)
  })

  it('rechaza si falta el email', () => {
    const result = requestPasswordResetSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
