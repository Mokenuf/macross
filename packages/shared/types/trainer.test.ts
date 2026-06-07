import { describe, expect, it } from 'vitest'

import { createTrainerSchema, trainerQueryParamsSchema, updateTrainerSchema } from './trainer'

describe('createTrainerSchema', () => {
  it('acepta un trainer valido', () => {
    const result = createTrainerSchema.safeParse({
      fullName: 'Seba Censi',
      email: 'seba@macross.com',
      phone: '+5491112345678',
    })
    expect(result.success).toBe(true)
  })

  it('acepta sin phone (es optional)', () => {
    const result = createTrainerSchema.safeParse({
      fullName: 'Seba Censi',
      email: 'seba@macross.com',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza si falta el fullName', () => {
    const result = createTrainerSchema.safeParse({ email: 'seba@macross.com' })
    expect(result.success).toBe(false)
  })

  it('rechaza si fullName es string vacio', () => {
    const result = createTrainerSchema.safeParse({
      fullName: '',
      email: 'seba@macross.com',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza si falta el email', () => {
    const result = createTrainerSchema.safeParse({ fullName: 'Seba Censi' })
    expect(result.success).toBe(false)
  })

  it('rechaza email invalido', () => {
    const result = createTrainerSchema.safeParse({
      fullName: 'Seba Censi',
      email: 'no-es-un-email',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza email string vacio', () => {
    const result = createTrainerSchema.safeParse({
      fullName: 'Seba Censi',
      email: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateTrainerSchema', () => {
  it('acepta un update valido con avatarUrl', () => {
    const result = updateTrainerSchema.safeParse({
      fullName: 'Seba Censi',
      phone: '+5491112345678',
      avatarUrl: 'https://cdn.macross.com/avatar.png',
    })
    expect(result.success).toBe(true)
  })

  it('no incluye email (fue omitido)', () => {
    const result = updateTrainerSchema.safeParse({
      fullName: 'Seba Censi',
      email: 'seba@macross.com',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect('email' in result.data).toBe(false)
    }
  })

  it('convierte avatarUrl "" a undefined via preprocess', () => {
    const result = updateTrainerSchema.safeParse({
      fullName: 'Seba Censi',
      avatarUrl: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.avatarUrl).toBeUndefined()
    }
  })

  it('rechaza avatarUrl invalido', () => {
    const result = updateTrainerSchema.safeParse({
      fullName: 'Seba Censi',
      avatarUrl: 'no-es-una-url',
    })
    expect(result.success).toBe(false)
  })
})

describe('trainerQueryParamSchema', () => {
  it('aplica sort=createdAt por default', () => {
    const result = trainerQueryParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sort).toBe('createdAt')
    }
  })

  it('acepta los valores validos de sort', () => {
    expect(trainerQueryParamsSchema.safeParse({ sort: 'fullName' }).success).toBe(true)
    expect(trainerQueryParamsSchema.safeParse({ sort: 'createdAt' }).success).toBe(true)
  })

  it('rechaza sort fuera del enum', () => {
    const result = trainerQueryParamsSchema.safeParse({ sort: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('acepta role manager o trainer', () => {
    expect(trainerQueryParamsSchema.safeParse({ role: 'manager' }).success).toBe(true)
    expect(trainerQueryParamsSchema.safeParse({ role: 'trainer' }).success).toBe(true)
  })

  it('rechaza role fuera del enum', () => {
    const result = trainerQueryParamsSchema.safeParse({ role: 'admin' })
    expect(result.success).toBe(false)
  })

  it('permite omitir role (es optional)', () => {
    const result = trainerQueryParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.role).toBeUndefined()
    }
  })

  it('hereda la coercion de page y limit del schema base', () => {
    const result = trainerQueryParamsSchema.safeParse({ page: '2', limit: '50' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(50)
    }
  })
})
