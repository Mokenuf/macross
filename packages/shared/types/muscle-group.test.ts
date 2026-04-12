import { describe, expect, it } from 'vitest'

import { createMuscleGroupSchema, muscleGroupQueryParamsSchema } from './muscle-group'

describe('createMuscleGroupSchema', () => {
  it('acepta un grupo muscular valido', () => {
    const result = createMuscleGroupSchema.safeParse({ name: 'Pecho' })
    expect(result.success).toBe(true)
  })

  it('rechaza si falta el name', () => {
    const result = createMuscleGroupSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rechaza si el name es string vacio', () => {
    const result = createMuscleGroupSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })
})

describe('muscleGroupQueryParamsSchema', () => {
  it('aplica sort=createdAt por default', () => {
    const result = muscleGroupQueryParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sort).toBe('createdAt')
    }
  })

  it('acepta los valores validos de sort', () => {
    expect(muscleGroupQueryParamsSchema.safeParse({ sort: 'name' }).success).toBe(true)
    expect(muscleGroupQueryParamsSchema.safeParse({ sort: 'createdAt' }).success).toBe(true)
  })

  it('rechaza sort fuera del enum', () => {
    const result = muscleGroupQueryParamsSchema.safeParse({ sort: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('hereda la coercion de page y limit del schema base', () => {
    const result = muscleGroupQueryParamsSchema.safeParse({ page: '2', limit: '50' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(50)
    }
  })
})
