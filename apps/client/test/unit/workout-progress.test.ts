import type {
  Routine,
  RoutineBlock,
  RoutineDay,
  RoutineExercise,
  RoutineExerciseScheme,
  WorkoutLog,
} from '@macross/shared'
import { describe, expect, it } from 'vitest'

import {
  completedSetCount,
  dayExercises,
  findPlanCursor,
  isDayDone,
  isExerciseDone,
  isWeekDone,
  nextPendingStep,
  pauseAfter,
  schemeForWeek,
  sessionSteps,
  weekBlocks,
} from '../../app/utils/workout-progress'

const UUID = '00000000-0000-4000-8000-000000000000'
const TIMESTAMP = '2026-08-16T10:00:00.000Z'

let nextId = 0
function uniqueId() {
  nextId += 1
  return `00000000-0000-4000-8000-${String(nextId).padStart(12, '0')}`
}

// Fábricas tipadas en vez de casts: si el schema de lectura gana un campo requerido, esto rompe acá
// y no en runtime. `done` es cuántas series de esa semana quedaron completadas (las primeras N).
function makeScheme(weekNumber: number, done: number): RoutineExerciseScheme {
  const logs: WorkoutLog[] = Array.from({ length: done }, (_, i) => ({
    id: UUID,
    routineExerciseSchemeId: UUID,
    setNumber: i + 1,
    weightKg: 20,
    actualReps: 10,
    completed: true,
    loggedAt: TIMESTAMP,
  }))

  return {
    id: UUID,
    routineExerciseId: UUID,
    weekNumber,
    reps: '10',
    notes: null,
    logs,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  }
}

function makeExercise(schemes: RoutineExerciseScheme[], optional = false): RoutineExercise {
  return {
    id: uniqueId(),
    routineBlockId: UUID,
    exerciseId: UUID,
    sortOrder: 0,
    optional,
    notes: null,
    exercise: {
      id: UUID,
      nameEs: 'Sentadilla',
      nameEn: 'Squat',
      videoUrl: null,
      slug: 'sentadilla',
      nanoId: 'abc123abc123',
      equipment: null,
      unit: { id: UUID, nameEs: 'Repeticiones', nameEn: 'Reps', kind: 'count' },
    },
    schemes,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    deletedAt: null,
  }
}

type Rounds = { sets?: number; restSeconds?: number | null; transitionSeconds?: number | null }

// Las rondas son del bloque: por default 3 por semana, las cuatro semanas.
function makeBlock(
  exercises: RoutineExercise[],
  rounds: Rounds = {},
  weeks = [1, 2, 3, 4],
): RoutineBlock {
  const id = uniqueId()
  return {
    id,
    routineDayId: UUID,
    type: exercises.length > 1 ? 'superset' : 'single',
    sortOrder: 0,
    notes: null,
    schemes: weeks.map(weekNumber => ({
      id: UUID,
      routineBlockId: id,
      weekNumber,
      sets: rounds.sets ?? 3,
      restSeconds: rounds.restSeconds ?? 90,
      transitionSeconds: rounds.transitionSeconds ?? null,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    })),
    exercises,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    deletedAt: null,
  }
}

function makeDay(dayNumber: number, blocks: RoutineBlock[]): RoutineDay {
  return {
    id: UUID,
    routineId: UUID,
    dayNumber,
    label: `Día ${dayNumber}`,
    nanoId: 'day123day123',
    blocks,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    deletedAt: null,
  }
}

// Un bloque single por ejercicio, que es como se ve casi todo día real.
function dayOf(dayNumber: number, exercises: RoutineExercise[]) {
  return makeDay(
    dayNumber,
    exercises.map(exercise => makeBlock([exercise])),
  )
}

function makeRoutine(days: RoutineDay[], weeks = 4): Routine {
  return {
    id: UUID,
    trainerId: UUID,
    clientId: UUID,
    name: 'Fase 1',
    daysPerWeek: days.length,
    weeks,
    notes: null,
    active: true,
    isTemplate: false,
    nanoId: 'rou123rou123',
    days,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    deletedAt: null,
  }
}

// El valor dice cuántas series quedaron hechas esa semana, y `null` = sin prescripción.
function exerciseWithWeeks(donePerWeek: (number | null)[], optional = false) {
  return makeExercise(
    donePerWeek.flatMap((done, i) => (done === null ? [] : [makeScheme(i + 1, done)])),
    optional,
  )
}

describe('weekBlocks', () => {
  it('deja afuera los ejercicios sin prescripción para esa semana', () => {
    const day = dayOf(1, [
      exerciseWithWeeks([3, 3, null, null]),
      exerciseWithWeeks([null, null, 0, 0]),
    ])

    expect(dayExercises(day, 1)).toHaveLength(1)
    expect(dayExercises(day, 3)).toHaveLength(1)
    expect(dayExercises(day, 1)[0]).not.toBe(dayExercises(day, 3)[0])
  })

  it('descarta el bloque que se queda sin ejercicios', () => {
    const day = dayOf(1, [exerciseWithWeeks([null, null, 0, 0])])

    expect(weekBlocks(day, 1)).toEqual([])
    expect(weekBlocks(day, 3)).toHaveLength(1)
  })

  it('descarta el bloque sin rondas para esa semana', () => {
    const day = makeDay(1, [makeBlock([exerciseWithWeeks([0, 0, 0, 0])], {}, [3, 4])])

    expect(weekBlocks(day, 1)).toEqual([])
    expect(weekBlocks(day, 3)).toHaveLength(1)
  })
})

describe('schemeForWeek', () => {
  it('devuelve null si la semana no tiene prescripción, sin caer a otra', () => {
    const exercise = exerciseWithWeeks([3, 3])

    expect(schemeForWeek(exercise, 1)?.weekNumber).toBe(1)
    expect(schemeForWeek(exercise, 3)).toBeNull()
  })
})

describe('completedSetCount', () => {
  it('cuenta solo las series completadas de esa semana', () => {
    const exercise = exerciseWithWeeks([3, 1])

    expect(completedSetCount(exercise, 1)).toBe(3)
    expect(completedSetCount(exercise, 2)).toBe(1)
  })

  it('ignora las series desmarcadas', () => {
    const scheme = makeScheme(1, 2)
    scheme.logs = scheme.logs?.map(log => ({ ...log, completed: false }))

    expect(completedSetCount(makeExercise([scheme]), 1)).toBe(0)
  })

  it('devuelve 0 si la semana no existe', () => {
    expect(completedSetCount(exerciseWithWeeks([3]), 9)).toBe(0)
  })
})

describe('isExerciseDone', () => {
  it('exige tantas series completadas como rondas tiene el bloque esa semana', () => {
    const exercise = exerciseWithWeeks([3, 2])
    const block = makeBlock([exercise])

    expect(isExerciseDone(block, exercise, 1)).toBe(true)
    expect(isExerciseDone(block, exercise, 2)).toBe(false)
  })

  it('las rondas las manda el bloque, no el ejercicio', () => {
    const exercise = exerciseWithWeeks([3])

    expect(isExerciseDone(makeBlock([exercise], { sets: 4 }), exercise, 1)).toBe(false)
  })

  it('no está hecho si la semana no tiene prescripción', () => {
    const exercise = exerciseWithWeeks([3])

    expect(isExerciseDone(makeBlock([exercise]), exercise, 2)).toBe(false)
  })
})

describe('isDayDone', () => {
  it('un opcional sin hacer no traba el día', () => {
    const day = dayOf(1, [exerciseWithWeeks([3]), exerciseWithWeeks([0], true)])

    expect(isDayDone(day, 1)).toBe(true)
  })

  it('un obligatorio sin hacer sí lo traba', () => {
    const day = dayOf(1, [exerciseWithWeeks([3]), exerciseWithWeeks([1])])

    expect(isDayDone(day, 1)).toBe(false)
  })

  it('si todos son opcionales, se exigen todos (el día no nace completado)', () => {
    const day = dayOf(1, [exerciseWithWeeks([3], true), exerciseWithWeeks([0], true)])

    expect(isDayDone(day, 1)).toBe(false)
  })

  it('un día sin ejercicios cuenta como hecho', () => {
    expect(isDayDone(makeDay(1, []), 1)).toBe(true)
  })

  it('un ejercicio sin prescripción para esa semana no la traba', () => {
    const day = dayOf(1, [
      exerciseWithWeeks([3, 3, null, null]),
      exerciseWithWeeks([null, null, 0, 0]),
    ])

    expect(isDayDone(day, 1)).toBe(true)
    expect(isDayDone(day, 3)).toBe(false)
  })
})

describe('isWeekDone', () => {
  it('pide que todos los días estén hechos', () => {
    const routine = makeRoutine([
      dayOf(1, [exerciseWithWeeks([3, 3])]),
      dayOf(2, [exerciseWithWeeks([3, 0])]),
    ])

    expect(isWeekDone(routine, 1)).toBe(true)
    expect(isWeekDone(routine, 2)).toBe(false)
  })

  it('una rutina nula o sin días no está hecha', () => {
    expect(isWeekDone(null, 1)).toBe(false)
    expect(isWeekDone(makeRoutine([]), 1)).toBe(false)
  })
})

describe('findPlanCursor', () => {
  it('para en la primera sesión sin completar, recorriendo por semana y después por día', () => {
    const routine = makeRoutine([
      dayOf(1, [exerciseWithWeeks([3, 3, 0, 0])]),
      dayOf(2, [exerciseWithWeeks([3, 1, 0, 0])]),
    ])

    expect(findPlanCursor(routine)).toMatchObject({ week: 2, day: { dayNumber: 2 } })
  })

  it('arranca en la semana 1 día 1 cuando no hay nada registrado', () => {
    const routine = makeRoutine([
      dayOf(1, [exerciseWithWeeks([0, 0, 0, 0])]),
      dayOf(2, [exerciseWithWeeks([0, 0, 0, 0])]),
    ])

    expect(findPlanCursor(routine)).toMatchObject({ week: 1, day: { dayNumber: 1 } })
  })

  it('devuelve null con la fase entera completada', () => {
    const routine = makeRoutine([dayOf(1, [exerciseWithWeeks([3, 3, 3, 3])])])

    expect(findPlanCursor(routine)).toBeNull()
  })

  it('no busca más allá del weeks de la fase', () => {
    const routine = makeRoutine([dayOf(1, [exerciseWithWeeks([3, 3])])], 2)

    expect(findPlanCursor(routine)).toBeNull()
  })

  // Es la propiedad que hace seguro cambiar un ejercicio a mitad de fase: el slot nuevo no tiene
  // prescripción para las semanas cerradas, así que no puede tirar el cursor para atrás.
  it('un ejercicio que arranca en una semana posterior no vuelve atrás el cursor', () => {
    const routine = makeRoutine([
      dayOf(1, [exerciseWithWeeks([3, 3, 0, 0]), exerciseWithWeeks([null, null, 0, 0])]),
    ])

    expect(findPlanCursor(routine)).toMatchObject({ week: 3 })
  })

  it('devuelve null si no hay rutina', () => {
    expect(findPlanCursor(null)).toBeNull()
    expect(findPlanCursor(makeRoutine([]))).toBeNull()
  })
})

describe('sessionSteps', () => {
  it('una superserie se recorre por ronda: A1 → B1 → A2 → B2', () => {
    const a = exerciseWithWeeks([0])
    const b = exerciseWithWeeks([0])
    const day = makeDay(1, [makeBlock([a, b], { sets: 2 })])

    expect(sessionSteps(day, 1).map(step => [step.exercise.id, step.set])).toEqual([
      [a.id, 1],
      [b.id, 1],
      [a.id, 2],
      [b.id, 2],
    ])
  })

  it('un bloque single recorre sus series y recién después pasa al bloque siguiente', () => {
    const a = exerciseWithWeeks([0])
    const b = exerciseWithWeeks([0])
    const day = makeDay(1, [makeBlock([a], { sets: 2 }), makeBlock([b], { sets: 1 })])

    expect(sessionSteps(day, 1).map(step => [step.exercise.id, step.set])).toEqual([
      [a.id, 1],
      [a.id, 2],
      [b.id, 1],
    ])
  })
})

describe('nextPendingStep', () => {
  const a = exerciseWithWeeks([1])
  const b = exerciseWithWeeks([0])
  const day = makeDay(1, [makeBlock([a, b], { sets: 2 })])
  const steps = sessionSteps(day, 1)

  it('después de A1 sigue B1, no A2', () => {
    expect(nextPendingStep(steps, 1, { slotId: a.id, set: 1 })).toMatchObject({
      exercise: { id: b.id },
      set: 1,
    })
  })

  it('sin referencia arranca en el primer paso pendiente', () => {
    expect(nextPendingStep(steps, 1)).toMatchObject({ exercise: { id: b.id }, set: 1 })
  })

  // Si el cliente salteó algo para atrás, no vuelve a caer ahí después de cada serie.
  it('busca hacia adelante y recién después vuelve al principio', () => {
    expect(nextPendingStep(steps, 1, { slotId: b.id, set: 2 })).toMatchObject({
      exercise: { id: b.id },
      set: 1,
    })
    expect(nextPendingStep(steps, 1, { slotId: a.id, set: 2 })).toMatchObject({
      exercise: { id: b.id },
      set: 2,
    })
  })

  it('con todo hecho devuelve null', () => {
    const done = makeDay(1, [makeBlock([exerciseWithWeeks([2])], { sets: 2 })])

    expect(nextPendingStep(sessionSteps(done, 1), 1)).toBeNull()
  })
})

describe('pauseAfter', () => {
  const a = exerciseWithWeeks([0])
  const b = exerciseWithWeeks([0])
  const superset = makeBlock([a, b], { sets: 2, restSeconds: 120, transitionSeconds: 15 })
  const steps = sessionSteps(makeDay(1, [superset]), 1)
  const [a1, b1, a2] = steps

  // Es el bug de uso real: completar Vuelos laterales abría el descanso en vez de mandar a frontales.
  it('entre ejercicios de la misma ronda va la transición, no el descanso', () => {
    expect(pauseAfter(a1!, b1!, 1)).toEqual({ kind: 'transition', seconds: 15 })
  })

  it('al cerrar la ronda va el descanso del bloque', () => {
    expect(pauseAfter(b1!, a2!, 1)).toEqual({ kind: 'rest', seconds: 120 })
  })

  it('sin transición configurada se pasa directo', () => {
    const plain = makeBlock([a, b], { sets: 2 })
    const [x1, y1] = sessionSteps(makeDay(1, [plain]), 1)

    expect(pauseAfter(x1!, y1!, 1)).toEqual({ kind: 'transition', seconds: null })
  })

  it('en un single, entre series va el descanso', () => {
    const single = makeBlock([a], { sets: 2, restSeconds: 90 })
    const [s1, s2] = sessionSteps(makeDay(1, [single]), 1)

    expect(pauseAfter(s1!, s2!, 1)).toEqual({ kind: 'rest', seconds: 90 })
  })

  it('después del último paso del día va el descanso', () => {
    expect(pauseAfter(steps.at(-1)!, null, 1)).toEqual({ kind: 'rest', seconds: 120 })
  })
})
