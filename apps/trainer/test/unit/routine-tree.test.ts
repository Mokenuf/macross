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

const ONE_DAY_INPUT = {
  name: 'Fase 1',
  daysPerWeek: 1,
  weeks: 4,
  days: [
    {
      label: 'Pierna',
      exercises: [
        { exerciseId: SQUAT_ID, sets: 4, reps: '10', restSeconds: 120 },
        { exerciseId: BENCH_ID, sets: 3, reps: '8-10', notes: 'Bajar lento', optional: true },
      ],
    },
  ],
}

const TWO_DAYS_INPUT = {
  ...ONE_DAY_INPUT,
  daysPerWeek: 2,
  days: [
    ...ONE_DAY_INPUT.days,
    { label: 'Espalda', exercises: [{ exerciseId: ROW_ID, sets: 3, reps: '12' }] },
  ],
}

describe('buildRoutineTree', () => {
  it('arma un bloque single con un único slot por cada ejercicio del día', () => {
    const { dayRows, blockRows, slotRows } = buildRoutineTree(buildBody(ONE_DAY_INPUT), ROUTINE_ID)

    expect(dayRows).toHaveLength(1)
    expect(blockRows).toHaveLength(2)
    expect(slotRows).toHaveLength(2)
    expect(blockRows.every(b => b.type === 'single')).toBe(true)
    expect(slotRows.every(s => s.sort_order === 0)).toBe(true)
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

  it('replica la prescripción en una scheme idéntica por semana', () => {
    const { slotRows, schemeRows } = buildRoutineTree(buildBody(ONE_DAY_INPUT), ROUTINE_ID)

    expect(schemeRows).toHaveLength(8)

    const squat = slotRows.find(s => s.exercise_id === SQUAT_ID)
    const squatSchemes = schemeRows.filter(s => s.routine_exercise_id === squat?.id)

    expect(squatSchemes.map(s => s.week_number)).toEqual([1, 2, 3, 4])
    expect(squatSchemes.every(s => s.sets === 4 && s.reps === '10' && s.rest_seconds === 120)).toBe(
      true,
    )
  })

  it('respeta el weeks del body en vez de asumir 4', () => {
    const { schemeRows } = buildRoutineTree(buildBody({ ...ONE_DAY_INPUT, weeks: 2 }), ROUTINE_ID)

    expect(schemeRows).toHaveLength(4)
    expect(new Set(schemeRows.map(s => s.week_number))).toEqual(new Set([1, 2]))
  })

  it('manda la nota del ejercicio al slot y deja las schemes sin nota', () => {
    const { slotRows, schemeRows } = buildRoutineTree(buildBody(ONE_DAY_INPUT), ROUTINE_ID)

    const bench = slotRows.find(s => s.exercise_id === BENCH_ID)

    expect(bench?.notes).toBe('Bajar lento')
    expect(bench?.optional).toBe(true)
    expect(schemeRows.every(s => s.notes === null)).toBe(true)
  })

  it('convierte los campos ausentes a null (Supabase no acepta undefined)', () => {
    const { slotRows, schemeRows } = buildRoutineTree(buildBody(ONE_DAY_INPUT), ROUTINE_ID)

    const squat = slotRows.find(s => s.exercise_id === SQUAT_ID)
    const bench = slotRows.find(s => s.exercise_id === BENCH_ID)
    const benchSchemes = schemeRows.filter(s => s.routine_exercise_id === bench?.id)

    expect(squat?.notes).toBeNull()
    expect(benchSchemes.every(s => s.rest_seconds === null)).toBe(true)
  })

  it('un día sin ejercicios genera solo la fila del día', () => {
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
