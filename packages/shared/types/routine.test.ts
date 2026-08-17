import { describe, expect, it } from 'vitest'

import { blockTypeEnum } from './enums'
import {
  createRoutineBlockSchema,
  createRoutineExerciseSchema,
  createRoutineSchema,
  createRoutineSchemeSchema,
  routineQueryParamsSchema,
  routineStatusSchema,
} from './routine'

const uuid = '123e4567-e89b-12d3-a456-426614174000'

const scheme = { weekNumber: 1, sets: 4, reps: '12' }

const validCreate = {
  name: 'Fase 1',
  daysPerWeek: 2,
  days: [{ label: 'Día 1', blocks: [{ exercises: [{ exerciseId: uuid, schemes: [scheme] }] }] }],
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

  it('un día sin blocks default-ea a []', () => {
    const result = createRoutineSchema.safeParse({ ...validCreate, days: [{ label: 'Día 1' }] })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.days[0].blocks).toEqual([])
  })
})

describe('createRoutineBlockSchema', () => {
  const exercise = { exerciseId: uuid, schemes: [scheme] }

  it('aplica type default single', () => {
    const result = createRoutineBlockSchema.safeParse({ exercises: [exercise] })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.type).toBe('single')
  })

  it('acepta una superserie de dos ejercicios', () => {
    const result = createRoutineBlockSchema.safeParse({
      type: 'superset',
      notes: 'sin descanso entre los dos',
      exercises: [exercise, exercise],
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.exercises).toHaveLength(2)
  })

  it('rechaza un bloque sin ejercicios', () => {
    expect(createRoutineBlockSchema.safeParse({ exercises: [] }).success).toBe(false)
  })

  it('rechaza un type fuera del enum', () => {
    expect(
      createRoutineBlockSchema.safeParse({ type: 'giant-set', exercises: [exercise] }).success,
    ).toBe(false)
  })
})

describe('createRoutineExerciseSchema', () => {
  it('parsea una prescripción distinta por semana', () => {
    const result = createRoutineExerciseSchema.safeParse({
      exerciseId: uuid,
      schemes: [
        { weekNumber: 1, sets: 3, reps: '10' },
        { weekNumber: 4, sets: 4, reps: '8', restSeconds: 120, notes: 'bajar el peso' },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.schemes.map(s => s.weekNumber)).toEqual([1, 4])
      expect(result.data.schemes[1].notes).toBe('bajar el peso')
    }
  })

  it('requiere al menos una semana', () => {
    expect(createRoutineExerciseSchema.safeParse({ exerciseId: uuid, schemes: [] }).success).toBe(
      false,
    )
  })

  it('aplica optional default false', () => {
    const result = createRoutineExerciseSchema.safeParse({ exerciseId: uuid, schemes: [scheme] })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.optional).toBe(false)
  })
})

describe('createRoutineSchemeSchema', () => {
  it('coerce weekNumber y rechaza < 1', () => {
    const result = createRoutineSchemeSchema.safeParse({ ...scheme, weekNumber: '2' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.weekNumber).toBe(2)
    expect(createRoutineSchemeSchema.safeParse({ ...scheme, weekNumber: 0 }).success).toBe(false)
  })

  it('coerce sets y rechaza < 1', () => {
    expect(createRoutineSchemeSchema.safeParse({ ...scheme, sets: '4' }).success).toBe(true)
    expect(createRoutineSchemeSchema.safeParse({ ...scheme, sets: 0 }).success).toBe(false)
  })

  it('rechaza reps vacío', () => {
    expect(createRoutineSchemeSchema.safeParse({ ...scheme, reps: '' }).success).toBe(false)
  })

  it('coerce restSeconds de string a number', () => {
    const result = createRoutineSchemeSchema.safeParse({ ...scheme, restSeconds: '90' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.restSeconds).toBe(90)
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
