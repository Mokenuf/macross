import { describe, expect, it } from 'vitest'

import { blockTypeEnum } from './enums'
import {
  createRoutineBlockSchema,
  createRoutineBlockSchemeSchema,
  createRoutineExerciseSchema,
  createRoutineSchema,
  createRoutineSchemeSchema,
  routineQueryParamsSchema,
  routineStatusSchema,
} from './routine'

const uuid = '123e4567-e89b-12d3-a456-426614174000'

const scheme = { weekNumber: 1, reps: '12' }
const blockScheme = { weekNumber: 1, sets: 4 }

const validCreate = {
  name: 'Fase 1',
  daysPerWeek: 2,
  days: [
    {
      label: 'Día 1',
      blocks: [{ schemes: [blockScheme], exercises: [{ exerciseId: uuid, schemes: [scheme] }] }],
    },
  ],
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
  const schemes = [blockScheme]

  it('aplica type default single', () => {
    const result = createRoutineBlockSchema.safeParse({ schemes, exercises: [exercise] })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.type).toBe('single')
  })

  it('acepta una superserie de dos ejercicios', () => {
    const result = createRoutineBlockSchema.safeParse({
      type: 'superset',
      notes: 'sin descanso entre los dos',
      schemes,
      exercises: [exercise, exercise],
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.exercises).toHaveLength(2)
  })

  it('rechaza un bloque sin ejercicios', () => {
    expect(createRoutineBlockSchema.safeParse({ schemes, exercises: [] }).success).toBe(false)
  })

  it('rechaza un bloque sin rondas prescriptas (las series son del bloque)', () => {
    expect(createRoutineBlockSchema.safeParse({ schemes: [], exercises: [exercise] }).success).toBe(
      false,
    )
  })

  it('rechaza un type fuera del enum', () => {
    expect(
      createRoutineBlockSchema.safeParse({ type: 'giant-set', schemes, exercises: [exercise] })
        .success,
    ).toBe(false)
  })
})

describe('createRoutineExerciseSchema', () => {
  it('parsea una prescripción distinta por semana', () => {
    const result = createRoutineExerciseSchema.safeParse({
      exerciseId: uuid,
      schemes: [
        { weekNumber: 1, reps: '10' },
        { weekNumber: 4, reps: '8', notes: 'bajar el peso' },
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

  it('rechaza reps vacío', () => {
    expect(createRoutineSchemeSchema.safeParse({ ...scheme, reps: '' }).success).toBe(false)
  })

  it('descarta sets y descanso: son del bloque', () => {
    const result = createRoutineSchemeSchema.safeParse({ ...scheme, sets: 4, restSeconds: 90 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect('sets' in result.data).toBe(false)
      expect('restSeconds' in result.data).toBe(false)
    }
  })
})

describe('createRoutineBlockSchemeSchema', () => {
  it('coerce sets y rechaza < 1', () => {
    expect(createRoutineBlockSchemeSchema.safeParse({ ...blockScheme, sets: '4' }).success).toBe(
      true,
    )
    expect(createRoutineBlockSchemeSchema.safeParse({ ...blockScheme, sets: 0 }).success).toBe(
      false,
    )
  })

  it('coerce restSeconds y transitionSeconds de string a number', () => {
    const result = createRoutineBlockSchemeSchema.safeParse({
      ...blockScheme,
      restSeconds: '90',
      transitionSeconds: '15',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.restSeconds).toBe(90)
      expect(result.data.transitionSeconds).toBe(15)
    }
  })

  it('sin transición es válido (pasar directo es el default)', () => {
    const result = createRoutineBlockSchemeSchema.safeParse(blockScheme)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.transitionSeconds).toBeUndefined()
  })

  it('rechaza descansos negativos', () => {
    expect(
      createRoutineBlockSchemeSchema.safeParse({ ...blockScheme, restSeconds: -1 }).success,
    ).toBe(false)
    expect(
      createRoutineBlockSchemeSchema.safeParse({ ...blockScheme, transitionSeconds: -1 }).success,
    ).toBe(false)
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
