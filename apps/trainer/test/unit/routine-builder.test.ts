import { describe, expect, it } from 'vitest'

import type {
  BuilderDay,
  BuilderExercise,
  BuilderScheme,
} from '../../app/components/routines/types'
import {
  cloneDay,
  isDayComplete,
  isSchemeLocked,
  nextEmptyDayIndex,
} from '../../app/utils/routine-builder'

const SQUAT = { id: '11111111-1111-4111-8111-111111111111', nameEs: 'Sentadilla', nameEn: 'Squat' }
const SLOT = '33333333-3333-4333-8333-333333333331'
const DAY = '22222222-2222-4222-8222-222222222221'

function makeScheme(weekNumber: number, overrides: Partial<BuilderScheme> = {}): BuilderScheme {
  return {
    weekNumber,
    sets: 3,
    reps: '10',
    restSeconds: 120,
    notes: '',
    trainedSets: 0,
    ...overrides,
  }
}

function makeExercise(overrides: Partial<BuilderExercise> = {}): BuilderExercise {
  return {
    exercise: SQUAT,
    optional: false,
    notes: '',
    schemes: [makeScheme(1), makeScheme(2), makeScheme(3), makeScheme(4)],
    ...overrides,
  }
}

function makeDay(overrides: Partial<BuilderDay> = {}): BuilderDay {
  return { label: 'Empuje', exercises: [makeExercise()], ...overrides }
}

describe('isSchemeLocked', () => {
  it('bloquea las semanas anteriores a la semana en curso', () => {
    expect(isSchemeLocked(makeScheme(1), 3)).toBe(true)
    expect(isSchemeLocked(makeScheme(3), 3)).toBe(false)
  })

  // El picker de /plan deja al cliente registrar en cualquier semana, así que "entrenado" no
  // coincide con "anterior al cursor".
  it('bloquea una semana futura si el cliente ya registró series', () => {
    expect(isSchemeLocked(makeScheme(4, { trainedSets: 1 }), 3)).toBe(true)
  })
})

describe('isDayComplete', () => {
  it('acepta un día con todas las celdas editables cargadas', () => {
    expect(isDayComplete(makeDay(), 1)).toBe(true)
  })

  it('rechaza un día sin ejercicios', () => {
    expect(isDayComplete(makeDay({ exercises: [] }), 1)).toBe(false)
  })

  it('rechaza un ejercicio sin elegir', () => {
    expect(isDayComplete(makeDay({ exercises: [makeExercise({ exercise: null })] }), 1)).toBe(false)
  })

  it('rechaza una celda editable sin reps', () => {
    const exercise = makeExercise({ schemes: [makeScheme(1, { reps: '  ' })] })
    expect(isDayComplete(makeDay({ exercises: [exercise] }), 1)).toBe(false)
  })

  // Es el bug que trabó el guardado: la celda bloqueada no viaja al server, así que exigirle datos
  // deja el día incompletable para siempre.
  it('ignora las celdas bloqueadas', () => {
    const exercise = makeExercise({
      schemes: [makeScheme(1, { reps: '' }), makeScheme(2, { reps: '', trainedSets: 3 })],
    })

    expect(isDayComplete(makeDay({ exercises: [exercise] }), 2)).toBe(true)
  })
})

describe('cloneDay', () => {
  it('copia el label y los ejercicios sin arrastrar los ids de fila', () => {
    const source = makeDay({ id: DAY, exercises: [makeExercise({ id: SLOT })] })
    const clone = cloneDay(source, 1)

    expect(clone.id).toBeUndefined()
    expect(clone.label).toBe('Empuje')
    expect(clone.exercises).toHaveLength(1)
    expect(clone.exercises[0]?.id).toBeUndefined()
    expect(clone.exercises[0]?.exercise?.id).toBe(SQUAT.id)
  })

  it('no comparte referencias con el día original', () => {
    const source = makeDay()
    const clone = cloneDay(source, 1)

    clone.exercises[0]!.schemes[0]!.reps = '20'
    clone.exercises[0]!.exercise!.nameEs = 'Otro'

    expect(source.exercises[0]?.schemes[0]?.reps).toBe('10')
    expect(source.exercises[0]?.exercise?.nameEs).toBe('Sentadilla')
  })

  // El clon es un slot nuevo: el server lo inserta desde la semana en curso, así que las semanas ya
  // cerradas no le pertenecen.
  it('descarta las semanas anteriores a la semana en curso y resetea lo entrenado', () => {
    const source = makeDay({
      exercises: [
        makeExercise({
          schemes: [makeScheme(1, { trainedSets: 3 }), makeScheme(2), makeScheme(3), makeScheme(4)],
        }),
      ],
    })
    const clone = cloneDay(source, 3)

    expect(clone.exercises[0]?.schemes.map(s => s.weekNumber)).toEqual([3, 4])
    expect(clone.exercises[0]?.schemes.every(s => s.trainedSets === 0)).toBe(true)
  })
})

describe('nextEmptyDayIndex', () => {
  it('devuelve el próximo día vacío después del activo', () => {
    const days = [makeDay(), makeDay({ exercises: [] }), makeDay({ exercises: [] })]

    expect(nextEmptyDayIndex(days, 0)).toBe(1)
    expect(nextEmptyDayIndex(days, 1)).toBe(2)
  })

  // Nunca hacia atrás: duplicar el día 3 no puede caer en el día 1.
  it('no mira los días anteriores al activo', () => {
    const days = [makeDay({ exercises: [] }), makeDay()]

    expect(nextEmptyDayIndex(days, 1)).toBe(-1)
  })

  it('devuelve -1 cuando no queda ninguno vacío', () => {
    expect(nextEmptyDayIndex([makeDay(), makeDay()], 0)).toBe(-1)
  })
})
