import { describe, it, expect } from 'vitest'

import { createExerciseSchema } from './exercise'

describe('createExerciseSchema', () => {
  it('acepta un ejercicio valido con todos los campos', () => {
    const result = createExerciseSchema.safeParse({
      name: 'Sentadilla',
      description: 'Description',
      videoUrl: 'https://youtube.com/watch?v=abc123',
      muscleGroup: 'Pierna',
    })
    expect(result.success).toBe(true)
  })

  it('acepta un ejercicio solo con el name', () => {
    const result = createExerciseSchema.safeParse({ name: 'Sentadilla' })
    expect(result.success).toBe(true)
  })

  it('rechaza si falta el name', () => {
    const result = createExerciseSchema.safeParse({ description: 'foo' })
    expect(result.success).toBe(false)
  })

  it('rechaza si el name es string vacio', () => {
    const result = createExerciseSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('convierte videoUrl vacio a undefined (preprocess)', () => {
    const result = createExerciseSchema.safeParse({ name: 'Sentadilla', videoUrl: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.videoUrl).toBeUndefined()
    }
  })

  it('rechaza videoUrl invalida', () => {
    const result = createExerciseSchema.safeParse({
      name: 'Sentadilla',
      videoUrl: 'nintendo.com',
    })
    expect(result.success).toBe(false)
  })
})
