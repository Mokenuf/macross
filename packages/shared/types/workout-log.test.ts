import { describe, expect, it } from 'vitest'

import { createWorkoutLogSchema } from './workout-log'

const uuid = '123e4567-e89b-12d3-a456-426614174000'

const validCreate = {
  routineExerciseSchemeId: uuid,
  setNumber: 1,
}

describe('createWorkoutLogSchema', () => {
  it('parsea un payload válido', () => {
    expect(createWorkoutLogSchema.safeParse(validCreate).success).toBe(true)
  })

  it('requiere routineExerciseSchemeId y que sea uuid', () => {
    expect(createWorkoutLogSchema.safeParse({ setNumber: 1 }).success).toBe(false)
    expect(
      createWorkoutLogSchema.safeParse({ ...validCreate, routineExerciseSchemeId: 'nope' }).success,
    ).toBe(false)
  })

  it('coerce setNumber de string a number', () => {
    const result = createWorkoutLogSchema.safeParse({ ...validCreate, setNumber: '3' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.setNumber).toBe(3)
  })

  it('rechaza setNumber fuera de rango (1-20)', () => {
    expect(createWorkoutLogSchema.safeParse({ ...validCreate, setNumber: 0 }).success).toBe(false)
    expect(createWorkoutLogSchema.safeParse({ ...validCreate, setNumber: 21 }).success).toBe(false)
  })

  it('coerce weightKg de string a number', () => {
    const result = createWorkoutLogSchema.safeParse({ ...validCreate, weightKg: '42.5' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.weightKg).toBe(42.5)
  })

  it('rechaza weightKg negativo o fuera del techo de numeric(6,2)', () => {
    expect(createWorkoutLogSchema.safeParse({ ...validCreate, weightKg: -1 }).success).toBe(false)
    expect(createWorkoutLogSchema.safeParse({ ...validCreate, weightKg: 10000 }).success).toBe(
      false,
    )
  })

  it('coerce actualReps y rechaza negativos', () => {
    const result = createWorkoutLogSchema.safeParse({ ...validCreate, actualReps: '8' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.actualReps).toBe(8)
    expect(createWorkoutLogSchema.safeParse({ ...validCreate, actualReps: -1 }).success).toBe(false)
  })

  it('aplica completed default true', () => {
    const result = createWorkoutLogSchema.safeParse(validCreate)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.completed).toBe(true)
  })
})
