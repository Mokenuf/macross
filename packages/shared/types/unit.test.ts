import { describe, expect, it } from 'vitest'

import { createUnitSchema, unitQueryParamsSchema } from './unit'

const valid = { nameEs: 'Segundos', nameEn: 'Seconds', kind: 'time' }

describe('createUnitSchema', () => {
  it('acepta una unidad valida con nombre es/en y kind', () => {
    expect(createUnitSchema.safeParse(valid).success).toBe(true)
  })

  it('acepta los dos kinds', () => {
    expect(createUnitSchema.safeParse({ ...valid, kind: 'count' }).success).toBe(true)
    expect(createUnitSchema.safeParse({ ...valid, kind: 'time' }).success).toBe(true)
  })

  it('rechaza un kind fuera del enum', () => {
    expect(createUnitSchema.safeParse({ ...valid, kind: 'minutes' }).success).toBe(false)
  })

  it('rechaza si falta el kind (no tiene default)', () => {
    expect(createUnitSchema.safeParse({ nameEs: 'Pasos', nameEn: 'Steps' }).success).toBe(false)
  })

  it('rechaza si algun nombre falta o es string vacio', () => {
    expect(createUnitSchema.safeParse({ ...valid, nameEs: '' }).success).toBe(false)
    expect(createUnitSchema.safeParse({ ...valid, nameEn: '' }).success).toBe(false)
    expect(createUnitSchema.safeParse({ nameEs: 'Pasos', kind: 'count' }).success).toBe(false)
  })

  it('aplica isDefault=false por default', () => {
    const result = createUnitSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.isDefault).toBe(false)
  })

  it('acepta isDefault=true', () => {
    const result = createUnitSchema.safeParse({ ...valid, isDefault: true })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.isDefault).toBe(true)
  })
})

describe('unitQueryParamsSchema', () => {
  it('aplica sort=createdAt por default', () => {
    const result = unitQueryParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.sort).toBe('createdAt')
  })

  it('rechaza sort fuera del enum', () => {
    expect(unitQueryParamsSchema.safeParse({ sort: 'kind' }).success).toBe(false)
  })
})
