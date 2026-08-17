import type { CreateRoutine } from '@macross/shared'
import { createRoutineSchema } from '@macross/shared'
import { describe, expect, it } from 'vitest'

import { buildRoutineTree } from '../../server/utils/routine-tree'

const ROUTINE_ID = '99999999-9999-4999-8999-999999999999'
const SQUAT_ID = '11111111-1111-4111-8111-111111111111'
const BENCH_ID = '22222222-2222-4222-8222-222222222222'
const ROW_ID = '33333333-3333-4333-8333-333333333333'

// El desarme siempre recibe data ya parseada: el fixture pasa por el schema para que los
// defaults (optional, weeks, notes ausente) sean los mismos que llegan en producción.
function buildBody(input: unknown): CreateRoutine {
  return createRoutineSchema.parse(input)
}

const SQUAT = {
  exerciseId: SQUAT_ID,
  schemes: [
    { weekNumber: 1, sets: 3, reps: '10', restSeconds: 120 },
    { weekNumber: 2, sets: 3, reps: '10', restSeconds: 120 },
    { weekNumber: 3, sets: 4, reps: '8', restSeconds: 150 },
    { weekNumber: 4, sets: 4, reps: '6-8', restSeconds: 150, notes: 'Tope de carga' },
  ],
}

const BENCH = {
  exerciseId: BENCH_ID,
  notes: 'Bajar lento',
  optional: true,
  schemes: [
    { weekNumber: 1, sets: 3, reps: '8-10' },
    { weekNumber: 2, sets: 3, reps: '8-10' },
    { weekNumber: 3, sets: 3, reps: '8-10' },
    { weekNumber: 4, sets: 3, reps: '8-10' },
  ],
}

const ROW = {
  exerciseId: ROW_ID,
  schemes: [
    { weekNumber: 1, sets: 3, reps: '12' },
    { weekNumber: 2, sets: 3, reps: '12' },
  ],
}

const ONE_DAY_INPUT = {
  name: 'Fase 1',
  daysPerWeek: 1,
  weeks: 4,
  days: [{ label: 'Pierna', blocks: [{ exercises: [SQUAT] }, { exercises: [BENCH] }] }],
}

const TWO_DAYS_INPUT = {
  ...ONE_DAY_INPUT,
  daysPerWeek: 2,
  days: [...ONE_DAY_INPUT.days, { label: 'Espalda', blocks: [{ exercises: [ROW] }] }],
}

const SUPERSET_INPUT = {
  ...ONE_DAY_INPUT,
  days: [
    {
      label: 'Empuje',
      blocks: [
        { type: 'superset', notes: 'sin descanso entre los dos', exercises: [SQUAT, BENCH] },
        { exercises: [ROW] },
      ],
    },
  ],
}

function schemesOf(tree: ReturnType<typeof buildRoutineTree>, exerciseId: string) {
  const slot = tree.slotRows.find(s => s.exercise_id === exerciseId)
  return tree.schemeRows.filter(s => s.routine_exercise_id === slot?.id)
}

describe('buildRoutineTree', () => {
  it('arma una fila de bloque por bloque del día', () => {
    const { dayRows, blockRows, slotRows } = buildRoutineTree(buildBody(ONE_DAY_INPUT), ROUTINE_ID)

    expect(dayRows).toHaveLength(1)
    expect(blockRows).toHaveLength(2)
    expect(slotRows).toHaveLength(2)
    expect(blockRows.every(b => b.type === 'single')).toBe(true)
    expect(slotRows.every(s => s.sort_order === 0)).toBe(true)
  })

  it('agrupa los ejercicios de una superserie en un solo bloque', () => {
    const { blockRows, slotRows } = buildRoutineTree(buildBody(SUPERSET_INPUT), ROUTINE_ID)

    expect(blockRows.map(b => b.type)).toEqual(['superset', 'single'])
    expect(blockRows[0]?.notes).toBe('sin descanso entre los dos')

    const grouped = slotRows.filter(s => s.routine_block_id === blockRows[0]?.id)
    expect(grouped.map(s => s.exercise_id)).toEqual([SQUAT_ID, BENCH_ID])
    expect(grouped.map(s => s.sort_order)).toEqual([0, 1])
  })

  it('correlaciona cada fila con su padre', () => {
    const { dayRows, blockRows, slotRows, schemeRows } = buildRoutineTree(
      buildBody(TWO_DAYS_INPUT),
      ROUTINE_ID,
    )

    const dayIds = new Set(dayRows.map(d => d.id))
    const blockIds = new Set(blockRows.map(b => b.id))
    const slotIds = new Set(slotRows.map(s => s.id))

    expect(dayRows.every(d => d.routine_id === ROUTINE_ID)).toBe(true)
    expect(blockRows.every(b => dayIds.has(b.routine_day_id))).toBe(true)
    expect(slotRows.every(s => blockIds.has(s.routine_block_id))).toBe(true)
    expect(schemeRows.every(s => slotIds.has(s.routine_exercise_id))).toBe(true)
  })

  it('numera los días 1-based y reinicia el sort_order de bloques en cada día', () => {
    const { dayRows, blockRows } = buildRoutineTree(buildBody(TWO_DAYS_INPUT), ROUTINE_ID)

    expect(dayRows.map(d => d.day_number)).toEqual([1, 2])

    // unique(routine_day_id, sort_order) where deleted_at is null
    for (const day of dayRows) {
      const orders = blockRows.filter(b => b.routine_day_id === day.id).map(b => b.sort_order)
      expect(orders).toEqual(orders.map((_, i) => i))
    }
  })

  it('reinicia el sort_order de slots en cada bloque', () => {
    const { blockRows, slotRows } = buildRoutineTree(buildBody(SUPERSET_INPUT), ROUTINE_ID)

    // unique(routine_block_id, sort_order) where deleted_at is null
    for (const block of blockRows) {
      const orders = slotRows.filter(s => s.routine_block_id === block.id).map(s => s.sort_order)
      expect(orders).toEqual(orders.map((_, i) => i))
    }
  })

  it('escribe una scheme por semana con su propia prescripción', () => {
    const tree = buildRoutineTree(buildBody(ONE_DAY_INPUT), ROUTINE_ID)
    const squat = schemesOf(tree, SQUAT_ID)

    expect(tree.schemeRows).toHaveLength(8)
    expect(squat.map(s => s.week_number)).toEqual([1, 2, 3, 4])
    expect(squat.map(s => s.sets)).toEqual([3, 3, 4, 4])
    expect(squat.map(s => s.reps)).toEqual(['10', '10', '8', '6-8'])
    expect(squat.map(s => s.rest_seconds)).toEqual([120, 120, 150, 150])
  })

  it('una semana sin prescripción no genera fila', () => {
    const tree = buildRoutineTree(buildBody(TWO_DAYS_INPUT), ROUTINE_ID)

    expect(schemesOf(tree, ROW_ID).map(s => s.week_number)).toEqual([1, 2])
  })

  it('descarta las semanas fuera del rango de weeks', () => {
    const tree = buildRoutineTree(buildBody({ ...ONE_DAY_INPUT, weeks: 2 }), ROUTINE_ID)

    expect(tree.schemeRows).toHaveLength(4)
    expect(new Set(tree.schemeRows.map(s => s.week_number))).toEqual(new Set([1, 2]))
  })

  it('descarta una semana repetida en vez de romper el índice único', () => {
    const tree = buildRoutineTree(
      buildBody({
        ...ONE_DAY_INPUT,
        weeks: 1,
        days: [
          {
            blocks: [
              {
                exercises: [
                  {
                    exerciseId: SQUAT_ID,
                    schemes: [
                      { weekNumber: 1, sets: 3, reps: '10' },
                      { weekNumber: 1, sets: 5, reps: '5' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
      ROUTINE_ID,
    )

    expect(tree.schemeRows).toHaveLength(1)
    expect(tree.schemeRows[0]?.sets).toBe(3)
  })

  it('separa la nota estable del slot de la nota de la semana', () => {
    const tree = buildRoutineTree(buildBody(ONE_DAY_INPUT), ROUTINE_ID)
    const bench = tree.slotRows.find(s => s.exercise_id === BENCH_ID)

    expect(bench?.notes).toBe('Bajar lento')
    expect(bench?.optional).toBe(true)
    expect(schemesOf(tree, BENCH_ID).every(s => s.notes === null)).toBe(true)
    expect(schemesOf(tree, SQUAT_ID).map(s => s.notes)).toEqual([null, null, null, 'Tope de carga'])
  })

  it('convierte los campos ausentes a null (Supabase no acepta undefined)', () => {
    const tree = buildRoutineTree(buildBody(ONE_DAY_INPUT), ROUTINE_ID)
    const squat = tree.slotRows.find(s => s.exercise_id === SQUAT_ID)

    expect(squat?.notes).toBeNull()
    expect(tree.blockRows.every(b => b.notes === null)).toBe(true)
    expect(schemesOf(tree, BENCH_ID).every(s => s.rest_seconds === null)).toBe(true)
  })

  it('un día sin bloques genera solo la fila del día', () => {
    const { dayRows, blockRows, slotRows, schemeRows } = buildRoutineTree(
      buildBody({ ...ONE_DAY_INPUT, days: [{}] }),
      ROUTINE_ID,
    )

    expect(dayRows).toHaveLength(1)
    expect(dayRows[0]?.label).toBeNull()
    expect(blockRows).toEqual([])
    expect(slotRows).toEqual([])
    expect(schemeRows).toEqual([])
  })
})
