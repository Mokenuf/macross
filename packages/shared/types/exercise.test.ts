import { describe, expect, it } from 'vitest'

import { createExerciseSchema, exerciseQueryParamsSchema } from './exercise'

const UNIT_ID = 'c2aabb77-7e2b-4cd6-9b4b-4bb7bd160c33'
const required = { nameEs: 'Sentadilla', nameEn: 'Squat', unitId: UNIT_ID }

describe('createExerciseSchema', () => {
  it('acepta un ejercicio valido con todos los campos', () => {
    const result = createExerciseSchema.safeParse({
      ...required,
      descriptionEs: 'Descripcion',
      descriptionEn: 'Description',
      videoUrl: 'https://youtube.com/watch?v=abc123',
      muscleGroupIds: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
    })
    expect(result.success).toBe(true)
  })

  it('acepta un ejercicio solo con los campos requeridos', () => {
    expect(createExerciseSchema.safeParse(required).success).toBe(true)
  })

  it('aplica default de muscleGroupIds como array vacio', () => {
    const result = createExerciseSchema.safeParse(required)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.muscleGroupIds).toEqual([])
    }
  })

  it('rechaza si falta el nameEs', () => {
    const result = createExerciseSchema.safeParse({ nameEn: 'Squat', unitId: UNIT_ID })
    expect(result.success).toBe(false)
  })

  it('rechaza si falta el nameEn', () => {
    const result = createExerciseSchema.safeParse({ nameEs: 'Sentadilla', unitId: UNIT_ID })
    expect(result.success).toBe(false)
  })

  it('rechaza si algun name es string vacio', () => {
    expect(createExerciseSchema.safeParse({ ...required, nameEs: '' }).success).toBe(false)
    expect(createExerciseSchema.safeParse({ ...required, nameEn: '' }).success).toBe(false)
  })

  it('rechaza si falta la unidad (todo ejercicio tiene una)', () => {
    const result = createExerciseSchema.safeParse({ nameEs: 'Sentadilla', nameEn: 'Squat' })
    expect(result.success).toBe(false)
  })

  it('rechaza un unitId que no es uuid', () => {
    expect(createExerciseSchema.safeParse({ ...required, unitId: 'reps' }).success).toBe(false)
  })

  it('convierte videoUrl vacio a undefined (preprocess)', () => {
    const result = createExerciseSchema.safeParse({ ...required, videoUrl: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.videoUrl).toBeUndefined()
    }
  })

  it('rechaza videoUrl invalida', () => {
    const result = createExerciseSchema.safeParse({ ...required, videoUrl: 'nintendo.com' })
    expect(result.success).toBe(false)
  })

  it('rechaza muscleGroupIds con uuids invalidos', () => {
    const result = createExerciseSchema.safeParse({ ...required, muscleGroupIds: ['no-es-uuid'] })
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
