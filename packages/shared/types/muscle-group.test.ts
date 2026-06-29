import { describe, expect, it } from 'vitest'

import { createMuscleGroupSchema, muscleGroupQueryParamsSchema } from './muscle-group'

describe('createMuscleGroupSchema', () => {
  it('acepta un grupo muscular valido con nombre es y en', () => {
    const result = createMuscleGroupSchema.safeParse({ nameEs: 'Pecho', nameEn: 'Chest' })
    expect(result.success).toBe(true)
  })

  it('rechaza si falta el nameEs', () => {
    const result = createMuscleGroupSchema.safeParse({ nameEn: 'Chest' })
    expect(result.success).toBe(false)
  })

  it('rechaza si falta el nameEn', () => {
    const result = createMuscleGroupSchema.safeParse({ nameEs: 'Pecho' })
    expect(result.success).toBe(false)
  })

  it('rechaza si algun nombre es string vacio', () => {
    expect(createMuscleGroupSchema.safeParse({ nameEs: '', nameEn: 'Chest' }).success).toBe(false)
    expect(createMuscleGroupSchema.safeParse({ nameEs: 'Pecho', nameEn: '' }).success).toBe(false)
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
