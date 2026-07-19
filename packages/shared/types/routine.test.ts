import { describe, expect, it } from 'vitest'

import { blockTypeEnum } from './enums'
import {
  createRoutineExerciseSchema,
  createRoutineSchema,
  routineQueryParamsSchema,
  routineStatusSchema,
} from './routine'

const uuid = '123e4567-e89b-12d3-a456-426614174000'

const validCreate = {
  name: 'Fase 1',
  daysPerWeek: 2,
  days: [{ label: 'Día 1', exercises: [{ exerciseId: uuid, sets: 4, reps: '12' }] }],
}

describe('createRoutineSchema', () => {
  it('parsea un payload válido', () => {
    expect(createRoutineSchema.safeParse(validCreate).success).toBe(true)
  })

  it('rechaza name vacío', () => {
    expect(createRoutineSchema.safeParse({ ...validCreate, name: '' }).success).toBe(false)
  })

  it('requiere daysPerWeek', () => {
    const { daysPerWeek: _daysPerWeek, ...withoutDays } = validCreate
    expect(createRoutineSchema.safeParse(withoutDays).success).toBe(false)
  })

  it('coerce daysPerWeek de string a number', () => {
    const result = createRoutineSchema.safeParse({ ...validCreate, daysPerWeek: '3' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.daysPerWeek).toBe(3)
  })

  it('rechaza daysPerWeek fuera de rango (1-7)', () => {
    expect(createRoutineSchema.safeParse({ ...validCreate, daysPerWeek: 0 }).success).toBe(false)
    expect(createRoutineSchema.safeParse({ ...validCreate, daysPerWeek: 8 }).success).toBe(false)
  })

  it('aplica weeks default 4 cuando se omite', () => {
    const result = createRoutineSchema.safeParse(validCreate)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.weeks).toBe(4)
  })

  it('coerce weeks y rechaza < 1', () => {
    expect(createRoutineSchema.safeParse({ ...validCreate, weeks: '6' }).success).toBe(true)
    expect(createRoutineSchema.safeParse({ ...validCreate, weeks: 0 }).success).toBe(false)
  })

  it('aplica isTemplate default false', () => {
    const result = createRoutineSchema.safeParse(validCreate)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.isTemplate).toBe(false)
  })

  it('preprocesa clientId: string vacío -> undefined', () => {
    const result = createRoutineSchema.safeParse({ ...validCreate, clientId: '' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.clientId).toBeUndefined()
  })

  it('rechaza clientId que no es uuid', () => {
    expect(createRoutineSchema.safeParse({ ...validCreate, clientId: 'nope' }).success).toBe(false)
  })

  it('requiere al menos un día', () => {
    expect(createRoutineSchema.safeParse({ ...validCreate, days: [] }).success).toBe(false)
  })

  it('un día sin exercises default-ea a []', () => {
    const result = createRoutineSchema.safeParse({ ...validCreate, days: [{ label: 'Día 1' }] })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.days[0].exercises).toEqual([])
  })
})

describe('createRoutineExerciseSchema', () => {
  it('coerce sets y rechaza < 1', () => {
    expect(
      createRoutineExerciseSchema.safeParse({ exerciseId: uuid, sets: '4', reps: '12' }).success,
    ).toBe(true)
    expect(
      createRoutineExerciseSchema.safeParse({ exerciseId: uuid, sets: 0, reps: '12' }).success,
    ).toBe(false)
  })

  it('rechaza reps vacío', () => {
    expect(
      createRoutineExerciseSchema.safeParse({ exerciseId: uuid, sets: 4, reps: '' }).success,
    ).toBe(false)
  })

  it('coerce restSeconds de string a number', () => {
    const result = createRoutineExerciseSchema.safeParse({
      exerciseId: uuid,
      sets: 4,
      reps: '12',
      restSeconds: '90',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.restSeconds).toBe(90)
  })

  it('aplica optional default false', () => {
    const result = createRoutineExerciseSchema.safeParse({ exerciseId: uuid, sets: 4, reps: '12' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.optional).toBe(false)
  })
})

describe('routineQueryParamsSchema', () => {
  it('aplica defaults (sort createdAt, status active)', () => {
    const result = routineQueryParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sort).toBe('createdAt')
      expect(result.data.status).toBe('active')
    }
  })

  it('rechaza status fuera del enum', () => {
    expect(routineQueryParamsSchema.safeParse({ status: 'archived' }).success).toBe(false)
  })

  it('rechaza sort fuera del enum', () => {
    expect(routineQueryParamsSchema.safeParse({ sort: 'weeks' }).success).toBe(false)
  })

  it('preprocesa clientId: string vacío -> undefined', () => {
    const result = routineQueryParamsSchema.safeParse({ clientId: '' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.clientId).toBeUndefined()
  })
})

describe('blockTypeEnum', () => {
  it('acepta los tipos válidos', () => {
    for (const t of ['single', 'superset', 'dropset', 'circuit']) {
      expect(blockTypeEnum.safeParse(t).success).toBe(true)
    }
  })

  it('rechaza un tipo fuera del enum', () => {
    expect(blockTypeEnum.safeParse('giant-set').success).toBe(false)
  })
})

describe('routineStatusSchema', () => {
  it('default active', () => {
    const result = routineStatusSchema.safeParse(undefined)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe('active')
  })

  it('acepta los estados válidos', () => {
    for (const s of ['all', 'active', 'inactive']) {
      expect(routineStatusSchema.safeParse(s).success).toBe(true)
    }
  })
})
