import { describe, expect, it } from 'vitest'

import { createExerciseSchema, exerciseQueryParamsSchema } from './exercise'

describe('createExerciseSchema', () => {
  it('acepta un ejercicio valido con todos los campos', () => {
    const result = createExerciseSchema.safeParse({
      nameEs: 'Sentadilla',
      nameEn: 'Squat',
      descriptionEs: 'Descripcion',
      descriptionEn: 'Description',
      videoUrl: 'https://youtube.com/watch?v=abc123',
      muscleGroupIds: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
    })
    expect(result.success).toBe(true)
  })

  it('acepta un ejercicio solo con los names requeridos', () => {
    const result = createExerciseSchema.safeParse({ nameEs: 'Sentadilla', nameEn: 'Squat' })
    expect(result.success).toBe(true)
  })

  it('aplica default de muscleGroupIds como array vacio', () => {
    const result = createExerciseSchema.safeParse({ nameEs: 'Sentadilla', nameEn: 'Squat' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.muscleGroupIds).toEqual([])
    }
  })

  it('rechaza si falta el nameEs', () => {
    const result = createExerciseSchema.safeParse({ nameEn: 'Squat' })
    expect(result.success).toBe(false)
  })

  it('rechaza si falta el nameEn', () => {
    const result = createExerciseSchema.safeParse({ nameEs: 'Sentadilla' })
    expect(result.success).toBe(false)
  })

  it('rechaza si algun name es string vacio', () => {
    expect(createExerciseSchema.safeParse({ nameEs: '', nameEn: 'Squat' }).success).toBe(false)
    expect(createExerciseSchema.safeParse({ nameEs: 'Sentadilla', nameEn: '' }).success).toBe(false)
  })

  it('convierte videoUrl vacio a undefined (preprocess)', () => {
    const result = createExerciseSchema.safeParse({
      nameEs: 'Sentadilla',
      nameEn: 'Squat',
      videoUrl: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.videoUrl).toBeUndefined()
    }
  })

  it('rechaza videoUrl invalida', () => {
    const result = createExerciseSchema.safeParse({
      nameEs: 'Sentadilla',
      nameEn: 'Squat',
      videoUrl: 'nintendo.com',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza muscleGroupIds con uuids invalidos', () => {
    const result = createExerciseSchema.safeParse({
      nameEs: 'Sentadilla',
      nameEn: 'Squat',
      muscleGroupIds: ['no-es-uuid'],
    })
    expect(result.success).toBe(false)
  })
})

describe('exerciseQueryParamsSchema', () => {
  it('aplica sort=createdAt por default', () => {
    const result = exerciseQueryParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sort).toBe('createdAt')
    }
  })

  it('acepta los valores validos de sort', () => {
    expect(exerciseQueryParamsSchema.safeParse({ sort: 'name' }).success).toBe(true)
    expect(exerciseQueryParamsSchema.safeParse({ sort: 'createdAt' }).success).toBe(true)
  })

  it('rechaza sort fuera del enum', () => {
    const result = exerciseQueryParamsSchema.safeParse({ sort: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('hereda la coercion de page y limit del schema base', () => {
    const result = exerciseQueryParamsSchema.safeParse({ page: '2', limit: '50' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(50)
    }
  })

  it('aplica array vacio por default a equipmentIds y muscleGroupIds', () => {
    const result = exerciseQueryParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.equipmentIds).toEqual([])
      expect(result.data.muscleGroupIds).toEqual([])
    }
  })

  it('convierte string vacio a array vacio (preprocess)', () => {
    const result = exerciseQueryParamsSchema.safeParse({ equipmentIds: '', muscleGroupIds: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.equipmentIds).toEqual([])
      expect(result.data.muscleGroupIds).toEqual([])
    }
  })

  it('envuelve un uuid suelto en array (preprocess)', () => {
    const result = exerciseQueryParamsSchema.safeParse({
      muscleGroupIds: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.muscleGroupIds).toEqual(['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'])
    }
  })

  it('acepta un array de uuids', () => {
    const result = exerciseQueryParamsSchema.safeParse({
      equipmentIds: [
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'b1ffdc88-8d1a-4af7-aa5c-5aa8ac270b22',
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rechaza un array con uuid invalido', () => {
    const result = exerciseQueryParamsSchema.safeParse({ equipmentIds: ['no-es-uuid'] })
    expect(result.success).toBe(false)
  })
})
