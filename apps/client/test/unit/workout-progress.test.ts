import type {
  Routine,
  RoutineDay,
  RoutineExercise,
  RoutineExerciseScheme,
  WorkoutLog,
} from '@macross/shared'
import { describe, expect, it } from 'vitest'

import {
  completedSetCount,
  findPlanCursor,
  isDayDone,
  isExerciseDone,
  isWeekDone,
  schemeForWeek,
} from '../../app/utils/workout-progress'

const UUID = '00000000-0000-4000-8000-000000000000'
const TIMESTAMP = '2026-08-16T10:00:00.000Z'

// Fábricas tipadas en vez de casts: si el schema de lectura gana un campo requerido, esto rompe acá
// y no en runtime. `done` es cuántas series de esa semana quedaron completadas.
function makeScheme(weekNumber: number, sets: number, done: number): RoutineExerciseScheme {
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
    sets,
    reps: '10',
    restSeconds: 120,
    notes: null,
    logs,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  }
}

function makeExercise(schemes: RoutineExerciseScheme[], optional = false): RoutineExercise {
  return {
    id: UUID,
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
    },
    schemes,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    deletedAt: null,
  }
}

function makeDay(dayNumber: number, exercises: RoutineExercise[]): RoutineDay {
  return {
    id: UUID,
    routineId: UUID,
    dayNumber,
    label: `Día ${dayNumber}`,
    nanoId: 'day123day123',
    blocks: [
      {
        id: UUID,
        routineDayId: UUID,
        type: 'single',
        sortOrder: 0,
        notes: null,
        exercises,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
        deletedAt: null,
      },
    ],
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    deletedAt: null,
  }
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

// Cuatro semanas prescriptas de 3 series; `donePerWeek` dice cuántas quedaron hechas en cada una.
function exerciseWithWeeks(donePerWeek: number[], optional = false) {
  return makeExercise(
    donePerWeek.map((done, i) => makeScheme(i + 1, 3, done)),
    optional,
  )
}

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
    const scheme = makeScheme(1, 3, 2)
    scheme.logs = scheme.logs?.map(log => ({ ...log, completed: false }))

    expect(completedSetCount(makeExercise([scheme]), 1)).toBe(0)
  })

  it('devuelve 0 si la semana no existe', () => {
    expect(completedSetCount(exerciseWithWeeks([3]), 9)).toBe(0)
  })
})

describe('isExerciseDone', () => {
  it('exige tantas series completadas como prescribe la semana', () => {
    const exercise = exerciseWithWeeks([3, 2])

    expect(isExerciseDone(exercise, 1)).toBe(true)
    expect(isExerciseDone(exercise, 2)).toBe(false)
  })

  it('no está hecho si la semana no tiene prescripción', () => {
    expect(isExerciseDone(exerciseWithWeeks([3]), 2)).toBe(false)
  })
})

describe('isDayDone', () => {
  it('un opcional sin hacer no traba el día', () => {
    const day = makeDay(1, [exerciseWithWeeks([3]), exerciseWithWeeks([0], true)])

    expect(isDayDone(day, 1)).toBe(true)
  })

  it('un obligatorio sin hacer sí lo traba', () => {
    const day = makeDay(1, [exerciseWithWeeks([3]), exerciseWithWeeks([1])])

    expect(isDayDone(day, 1)).toBe(false)
  })

  it('si todos son opcionales, se exigen todos (el día no nace completado)', () => {
    const day = makeDay(1, [exerciseWithWeeks([3], true), exerciseWithWeeks([0], true)])

    expect(isDayDone(day, 1)).toBe(false)
  })

  it('un día sin ejercicios cuenta como hecho', () => {
    expect(isDayDone(makeDay(1, []), 1)).toBe(true)
  })
})

describe('isWeekDone', () => {
  it('pide que todos los días estén hechos', () => {
    const routine = makeRoutine([
      makeDay(1, [exerciseWithWeeks([3, 3])]),
      makeDay(2, [exerciseWithWeeks([3, 0])]),
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
      makeDay(1, [exerciseWithWeeks([3, 3, 0, 0])]),
      makeDay(2, [exerciseWithWeeks([3, 1, 0, 0])]),
    ])

    expect(findPlanCursor(routine)).toMatchObject({ week: 2, day: { dayNumber: 2 } })
  })

  it('arranca en la semana 1 día 1 cuando no hay nada registrado', () => {
    const routine = makeRoutine([
      makeDay(1, [exerciseWithWeeks([0, 0, 0, 0])]),
      makeDay(2, [exerciseWithWeeks([0, 0, 0, 0])]),
    ])

    expect(findPlanCursor(routine)).toMatchObject({ week: 1, day: { dayNumber: 1 } })
  })

  it('devuelve null con la fase entera completada', () => {
    const routine = makeRoutine([makeDay(1, [exerciseWithWeeks([3, 3, 3, 3])])])

    expect(findPlanCursor(routine)).toBeNull()
  })

  it('no busca más allá del weeks de la fase', () => {
    const routine = makeRoutine([makeDay(1, [exerciseWithWeeks([3, 3])])], 2)

    expect(findPlanCursor(routine)).toBeNull()
  })

  it('devuelve null si no hay rutina', () => {
    expect(findPlanCursor(null)).toBeNull()
    expect(findPlanCursor(makeRoutine([]))).toBeNull()
  })
})
