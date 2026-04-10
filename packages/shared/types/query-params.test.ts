import { describe, expect, it } from 'vitest'

import { queryParamsSchema } from './query-params'

describe('queryParamsSchema', () => {
  it('aplica defaults cuando no se pasa nada', () => {
    const result = queryParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
      expect(result.data.order).toBe('desc')
      expect(result.data.search).toBeUndefined()
    }
  })

  it('coerciona strings a numeros en page y limit', () => {
    const result = queryParamsSchema.safeParse({ page: '3', limit: '50' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.limit).toBe(50)
    }
  })

  it('rechaza page menor a 1', () => {
    const result = queryParamsSchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
  })

  it('rechaza page negativa', () => {
    const result = queryParamsSchema.safeParse({ page: -5 })
    expect(result.success).toBe(false)
  })

  it('rechaza limit menor a 1', () => {
    const result = queryParamsSchema.safeParse({ limit: 0 })
    expect(result.success).toBe(false)
  })

  it('rechaza limit mayor a 100', () => {
    const result = queryParamsSchema.safeParse({ limit: 101 })
    expect(result.success).toBe(false)
  })

  it('acepta order asc y desc', () => {
    expect(queryParamsSchema.safeParse({ order: 'asc' }).success).toBe(true)
    expect(queryParamsSchema.safeParse({ order: 'desc' }).success).toBe(true)
  })

  it('rechaza order fuera del enum', () => {
    const result = queryParamsSchema.safeParse({ order: 'random' })
    expect(result.success).toBe(false)
  })

  it('acepta search como string', () => {
    const result = queryParamsSchema.safeParse({ search: 'sentadilla' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.search).toBe('sentadilla')
    }
  })
})
