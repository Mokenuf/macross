import type { Routine, RoutineExerciseScheme, WorkoutLog } from '@macross/shared'
import { describe, expect, it } from 'vitest'

import { toRoutineResponse } from '../../server/utils/routine-transform'

const UUID = '00000000-0000-4000-8000-000000000000'

function makeLog(completed: boolean): WorkoutLog {
  return {
    id: UUID,
    routineExerciseSchemeId: UUID,
    setNumber: 1,
    weightKg: 20,
    actualReps: 10,
    completed,
    loggedAt: '2026-08-17T10:00:00Z',
  }
}

function makeScheme(logs?: WorkoutLog[]): RoutineExerciseScheme {
  return {
    id: UUID,
    routineExerciseId: UUID,
    weekNumber: 1,
    sets: 3,
    reps: '10',
    restSeconds: 120,
    notes: null,
    logs,
    createdAt: '2026-08-17T10:00:00Z',
    updatedAt: '2026-08-17T10:00:00Z',
  }
}

function makeRoutine(schemes: RoutineExerciseScheme[]): Routine {
  return {
    id: UUID,
    trainerId: UUID,
    clientId: UUID,
    name: 'Fase 1',
    daysPerWeek: 1,
    weeks: 4,
    notes: null,
    active: true,
    isTemplate: false,
    nanoId: 'abc123',
    createdAt: '2026-08-17T10:00:00Z',
    updatedAt: '2026-08-17T10:00:00Z',
    deletedAt: null,
    days: [
      {
        id: UUID,
        routineId: UUID,
        dayNumber: 1,
        label: 'Empuje',
        nanoId: 'day123',
        createdAt: '2026-08-17T10:00:00Z',
        updatedAt: '2026-08-17T10:00:00Z',
        deletedAt: null,
        blocks: [
          {
            id: UUID,
            routineDayId: UUID,
            type: 'single',
            sortOrder: 0,
            notes: null,
            createdAt: '2026-08-17T10:00:00Z',
            updatedAt: '2026-08-17T10:00:00Z',
            deletedAt: null,
            exercises: [
              {
                id: UUID,
                routineBlockId: UUID,
                exerciseId: UUID,
                sortOrder: 0,
                optional: false,
                notes: null,
                exercise: {
                  id: UUID,
                  nameEs: 'Sentadilla',
                  nameEn: 'Squat',
                  videoUrl: null,
                  slug: 'sentadilla',
                  nanoId: 'ex123',
                  equipment: null,
                },
                schemes,
                createdAt: '2026-08-17T10:00:00Z',
                updatedAt: '2026-08-17T10:00:00Z',
                deletedAt: null,
              },
            ],
          },
        ],
      },
    ],
  }
}

function firstScheme(routine: Routine) {
  return routine.days?.[0]?.blocks[0]?.exercises[0]?.schemes[0]
}

describe('toRoutineResponse', () => {
  it('cambia los logs por el conteo de series hechas', () => {
    const routine = toRoutineResponse(
      makeRoutine([makeScheme([makeLog(true), makeLog(true), makeLog(false)])]),
    )

    expect(firstScheme(routine)?.trainedSets).toBe(2)
    expect(firstScheme(routine)?.logs).toBeUndefined()
  })

  it('deja el conteo en 0 cuando el scheme no tiene logs', () => {
    expect(firstScheme(toRoutineResponse(makeRoutine([makeScheme()])))?.trainedSets).toBe(0)
  })

  it('no falla con una rutina sin árbol (el listado no lo embebe)', () => {
    const routine = makeRoutine([makeScheme()])
    delete routine.days

    expect(() => toRoutineResponse(routine)).not.toThrow()
  })
})
