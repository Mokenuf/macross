import { describe, expect, it } from 'vitest'

import type {
  BuilderBlock,
  BuilderDay,
  BuilderExercise,
  BuilderScheme,
} from '../../app/components/routines/types'
import {
  addExerciseToBlock,
  cloneDay,
  groupWithNext,
  isDayComplete,
  isSchemeLocked,
  makeExercise,
  nextEmptyDayIndex,
  removeExerciseAt,
  setBlockType,
  ungroupBlock,
} from '../../app/utils/routine-builder'

const SQUAT = { id: '11111111-1111-4111-8111-111111111111', nameEs: 'Sentadilla', nameEn: 'Squat' }
const SLOT_A = '33333333-3333-4333-8333-333333333331'
const SLOT_B = '33333333-3333-4333-8333-333333333332'
const BLOCK_A = '44444444-4444-4444-8444-444444444441'
const BLOCK_B = '44444444-4444-4444-8444-444444444442'
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

function exerciseOf(overrides: Partial<BuilderExercise> = {}): BuilderExercise {
  return {
    exercise: SQUAT,
    optional: false,
    notes: '',
    schemes: [makeScheme(1), makeScheme(2), makeScheme(3), makeScheme(4)],
    ...overrides,
  }
}

function blockOf(overrides: Partial<BuilderBlock> = {}): BuilderBlock {
  return { type: 'single', notes: '', exercises: [exerciseOf()], ...overrides }
}

function dayOf(overrides: Partial<BuilderDay> = {}): BuilderDay {
  return { label: 'Empuje', blocks: [blockOf()], ...overrides }
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
    expect(isDayComplete(dayOf(), 1)).toBe(true)
  })

  it('rechaza un día sin bloques', () => {
    expect(isDayComplete(dayOf({ blocks: [] }), 1)).toBe(false)
  })

  it('rechaza un bloque sin ejercicios', () => {
    expect(isDayComplete(dayOf({ blocks: [blockOf({ exercises: [] })] }), 1)).toBe(false)
  })

  it('rechaza un ejercicio sin elegir en cualquier bloque', () => {
    const day = dayOf({
      blocks: [blockOf(), blockOf({ exercises: [exerciseOf({ exercise: null })] })],
    })

    expect(isDayComplete(day, 1)).toBe(false)
  })

  it('mira los dos ejercicios de una superserie', () => {
    const grouped = blockOf({
      type: 'superset',
      exercises: [exerciseOf(), exerciseOf({ schemes: [makeScheme(1, { reps: '' })] })],
    })

    expect(isDayComplete(dayOf({ blocks: [grouped] }), 1)).toBe(false)
  })

  // Es el bug que trabó el guardado: la celda bloqueada no viaja al server, así que exigirle datos
  // deja el día incompletable para siempre.
  it('ignora las celdas bloqueadas', () => {
    const exercise = exerciseOf({
      schemes: [makeScheme(1, { reps: '' }), makeScheme(2, { reps: '', trainedSets: 3 })],
    })

    expect(isDayComplete(dayOf({ blocks: [blockOf({ exercises: [exercise] })] }), 2)).toBe(true)
  })
})

describe('makeExercise', () => {
  it('arranca en la semana en curso y no antes', () => {
    expect(makeExercise(4, 3).schemes.map(s => s.weekNumber)).toEqual([3, 4])
    expect(makeExercise(4, 1).schemes).toHaveLength(4)
  })
})

describe('cloneDay', () => {
  it('copia el contenido sin arrastrar los ids de fila', () => {
    const source = dayOf({
      id: DAY,
      blocks: [blockOf({ id: BLOCK_A, exercises: [exerciseOf({ id: SLOT_A })] })],
    })
    const clone = cloneDay(source, 1)

    expect(clone.id).toBeUndefined()
    expect(clone.label).toBe('Empuje')
    expect(clone.blocks[0]?.id).toBeUndefined()
    expect(clone.blocks[0]?.exercises[0]?.id).toBeUndefined()
    expect(clone.blocks[0]?.exercises[0]?.exercise?.id).toBe(SQUAT.id)
  })

  it('conserva el tipo y la nota del bloque', () => {
    const source = dayOf({
      blocks: [
        blockOf({ type: 'dropset', notes: 'al fallo', exercises: [exerciseOf(), exerciseOf()] }),
      ],
    })
    const clone = cloneDay(source, 1)

    expect(clone.blocks[0]?.type).toBe('dropset')
    expect(clone.blocks[0]?.notes).toBe('al fallo')
    expect(clone.blocks[0]?.exercises).toHaveLength(2)
  })

  it('no comparte referencias con el día original', () => {
    const source = dayOf()
    const clone = cloneDay(source, 1)

    clone.blocks[0]!.exercises[0]!.schemes[0]!.reps = '20'
    clone.blocks[0]!.exercises[0]!.exercise!.nameEs = 'Otro'

    expect(source.blocks[0]?.exercises[0]?.schemes[0]?.reps).toBe('10')
    expect(source.blocks[0]?.exercises[0]?.exercise?.nameEs).toBe('Sentadilla')
  })

  // El clon es un slot nuevo: el server lo inserta desde la semana en curso, así que las semanas ya
  // cerradas no le pertenecen.
  it('descarta las semanas anteriores a la semana en curso y resetea lo entrenado', () => {
    const source = dayOf({
      blocks: [
        blockOf({
          exercises: [
            exerciseOf({
              schemes: [
                makeScheme(1, { trainedSets: 3 }),
                makeScheme(2),
                makeScheme(3),
                makeScheme(4),
              ],
            }),
          ],
        }),
      ],
    })
    const clone = cloneDay(source, 3)
    const schemes = clone.blocks[0]?.exercises[0]?.schemes

    expect(schemes?.map(s => s.weekNumber)).toEqual([3, 4])
    expect(schemes?.every(s => s.trainedSets === 0)).toBe(true)
  })
})

describe('nextEmptyDayIndex', () => {
  it('devuelve el próximo día vacío después del activo', () => {
    const days = [dayOf(), dayOf({ blocks: [] }), dayOf({ blocks: [] })]

    expect(nextEmptyDayIndex(days, 0)).toBe(1)
    expect(nextEmptyDayIndex(days, 1)).toBe(2)
  })

  // Nunca hacia atrás: duplicar el día 3 no puede caer en el día 1.
  it('no mira los días anteriores al activo', () => {
    const days = [dayOf({ blocks: [] }), dayOf()]

    expect(nextEmptyDayIndex(days, 1)).toBe(-1)
  })

  it('devuelve -1 cuando no queda ninguno vacío', () => {
    expect(nextEmptyDayIndex([dayOf(), dayOf()], 0)).toBe(-1)
  })
})

describe('groupWithNext', () => {
  const blocks = [
    blockOf({ id: BLOCK_A, exercises: [exerciseOf({ id: SLOT_A })] }),
    blockOf({ id: BLOCK_B, exercises: [exerciseOf({ id: SLOT_B })] }),
  ]

  // Los ids son lo que hace que el PATCH re-apunte los slots en vez de retirarlos: sin ellos el
  // cliente perdería de vista lo que ya entrenó de esos ejercicios.
  it('junta los dos bloques conservando el id del primero y los de sus slots', () => {
    const result = groupWithNext(blocks, 0)

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe(BLOCK_A)
    expect(result[0]?.exercises.map(e => e.id)).toEqual([SLOT_A, SLOT_B])
  })

  it('promueve el bloque a superserie', () => {
    expect(groupWithNext(blocks, 0)[0]?.type).toBe('superset')
  })

  it('respeta un tipo ya elegido', () => {
    const dropset = [blockOf({ type: 'dropset', exercises: [exerciseOf()] }), blockOf()]

    expect(groupWithNext(dropset, 0)[0]?.type).toBe('dropset')
  })

  it('no hace nada en el último bloque', () => {
    expect(groupWithNext(blocks, 1)).toBe(blocks)
  })
})

describe('ungroupBlock', () => {
  const grouped = [
    blockOf({
      id: BLOCK_A,
      type: 'superset',
      notes: 'sin descanso',
      exercises: [exerciseOf({ id: SLOT_A }), exerciseOf({ id: SLOT_B })],
    }),
  ]

  it('saca cada ejercicio a su propio bloque single sin perder los ids de slot', () => {
    const result = ungroupBlock(grouped, 0)

    expect(result.map(b => b.type)).toEqual(['single', 'single'])
    expect(result.map(b => b.exercises.map(e => e.id))).toEqual([[SLOT_A], [SLOT_B]])
    expect(result[0]?.id).toBe(BLOCK_A)
    expect(result[1]?.id).toBeUndefined()
  })

  it('no hace nada en un bloque single de un solo ejercicio', () => {
    const single = [blockOf()]

    expect(ungroupBlock(single, 0)).toBe(single)
  })

  // Una fila sin ejercicio elegido no lleva información: sacarla a un bloque propio dejaría un
  // bloque vacío, y con él el día sin poder guardarse.
  it('descarta los ejercicios sin elegir en vez de sacarlos a su propio bloque', () => {
    const withEmpty = [
      blockOf({
        type: 'superset',
        exercises: [exerciseOf({ id: SLOT_A }), exerciseOf({ exercise: null })],
      }),
    ]
    const result = ungroupBlock(withEmpty, 0)

    expect(result).toHaveLength(1)
    expect(result[0]?.type).toBe('single')
    expect(result[0]?.exercises.map(e => e.id)).toEqual([SLOT_A])
  })

  it('deja una fila en blanco si no había ninguno elegido', () => {
    const allEmpty = [
      blockOf({
        type: 'superset',
        exercises: [exerciseOf({ exercise: null }), exerciseOf({ exercise: null })],
      }),
    ]
    const result = ungroupBlock(allEmpty, 0)

    expect(result).toHaveLength(1)
    expect(result[0]?.exercises).toHaveLength(1)
  })
})

describe('setBlockType', () => {
  // El tipo y el contenido cambian juntos: una superserie de un solo ejercicio es un estado que
  // habría que rechazar al guardar, sin nada en pantalla que lo explique.
  it('abre la fila del segundo ejercicio al pasar a superserie', () => {
    const result = setBlockType([blockOf({ id: BLOCK_A })], 0, 'superset', makeExercise(4, 1))

    expect(result[0]?.type).toBe('superset')
    expect(result[0]?.id).toBe(BLOCK_A)
    expect(result[0]?.exercises).toHaveLength(2)
    expect(result[0]?.exercises[1]?.exercise).toBeNull()
  })

  it('no agrega nada si el bloque ya está agrupado', () => {
    const grouped = [blockOf({ type: 'superset', exercises: [exerciseOf(), exerciseOf()] })]
    const result = setBlockType(grouped, 0, 'dropset', makeExercise(4, 1))

    expect(result[0]?.type).toBe('dropset')
    expect(result[0]?.exercises).toHaveLength(2)
  })

  it('volver a single desagrupa', () => {
    const grouped = [
      blockOf({
        type: 'superset',
        exercises: [exerciseOf({ id: SLOT_A }), exerciseOf({ id: SLOT_B })],
      }),
    ]
    const result = setBlockType(grouped, 0, 'single', makeExercise(4, 1))

    expect(result.map(b => b.exercises.map(e => e.id))).toEqual([[SLOT_A], [SLOT_B]])
  })
})

describe('addExerciseToBlock', () => {
  it('promueve el bloque a superserie al sumarle el segundo ejercicio', () => {
    const result = addExerciseToBlock([blockOf({ id: BLOCK_A })], 0, makeExercise(4, 1))

    expect(result[0]?.type).toBe('superset')
    expect(result[0]?.id).toBe(BLOCK_A)
    expect(result[0]?.exercises).toHaveLength(2)
  })

  it('no pisa el tipo cuando ya está agrupado', () => {
    const dropset = [blockOf({ type: 'dropset', exercises: [exerciseOf(), exerciseOf()] })]

    expect(addExerciseToBlock(dropset, 0, makeExercise(4, 1))[0]?.type).toBe('dropset')
  })
})

describe('removeExerciseAt', () => {
  const grouped = [
    blockOf({
      id: BLOCK_A,
      type: 'superset',
      exercises: [exerciseOf({ id: SLOT_A }), exerciseOf({ id: SLOT_B })],
    }),
  ]

  it('vuelve el bloque a single cuando queda un solo ejercicio', () => {
    const result = removeExerciseAt(grouped, 0, 1)

    expect(result[0]?.type).toBe('single')
    expect(result[0]?.exercises.map(e => e.id)).toEqual([SLOT_A])
  })

  it('saca el bloque entero cuando se va el último ejercicio', () => {
    expect(removeExerciseAt([blockOf()], 0, 0)).toEqual([])
  })
})
