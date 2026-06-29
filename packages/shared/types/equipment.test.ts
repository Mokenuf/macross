import { describe, expect, it } from 'vitest'

import { createEquipmentSchema, equipmentQueryParamsSchema } from './equipment'

describe('createEquipmentSchema', () => {
  it('acepta un equipamiento valido', () => {
    const result = createEquipmentSchema.safeParse({ name: 'Mancuerna' })
    expect(result.success).toBe(true)
  })

  it('rechaza si falta el name', () => {
    const result = createEquipmentSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rechaza si el name es string vacio', () => {
    const result = createEquipmentSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })
})

describe('equipmentQueryParamsSchema', () => {
  it('aplica sort=createdAt por default', () => {
    const result = equipmentQueryParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sort).toBe('createdAt')
    }
  })

  it('acepta los valores validos de sort', () => {
    expect(equipmentQueryParamsSchema.safeParse({ sort: 'name' }).success).toBe(true)
    expect(equipmentQueryParamsSchema.safeParse({ sort: 'createdAt' }).success).toBe(true)
  })

  it('rechaza sort fuera del enum', () => {
    const result = equipmentQueryParamsSchema.safeParse({ sort: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('hereda la coercion de page y limit del schema base', () => {
    const result = equipmentQueryParamsSchema.safeParse({ page: '2', limit: '50' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(50)
    }
  })
})
