import type { UpdateRoutine } from '@macross/shared'
import { updateRoutineSchema } from '@macross/shared'
import { describe, expect, it } from 'vitest'

import type {
  OldBlock,
  OldDay,
  OldRoutineTree,
  OldScheme,
  OldSlot,
} from '../../server/utils/routine-diff'
import { diffRoutineTree, findStartWeek } from '../../server/utils/routine-diff'

const ROUTINE = '00000000-0000-4000-8000-000000000000'
const DAY_1 = '11111111-1111-4111-8111-111111111111'
const DAY_2 = '11111111-1111-4111-8111-111111111112'
const BLOCK_A = '22222222-2222-4222-8222-222222222221'
const BLOCK_B = '22222222-2222-4222-8222-222222222222'
const SLOT_A = '33333333-3333-4333-8333-333333333331'
const SLOT_B = '33333333-3333-4333-8333-333333333332'
const SCHEME = '44444444-4444-4444-8444-444444444440'
const EX_1 = '55555555-5555-4555-8555-555555555551'
const EX_2 = '55555555-5555-4555-8555-555555555552'

function makeScheme(weekNumber: number, sets: number, done: number): OldScheme {
  return {
    id: `${SCHEME.slice(0, -1)}${weekNumber}`,
    weekNumber,
    sets,
    reps: '10',
    restSeconds: 120,
    notes: null,
    logs: Array.from({ length: done }, () => ({ completed: true, deletedAt: null })),
  }
}

// donePerWeek[i] = series completadas en la semana i+1; una semana ausente = sin prescripción.
function makeSlot(
  id: string,
  exerciseId: string,
  donePerWeek: (number | null)[],
  optional = false,
): OldSlot {
  const schemes = donePerWeek.flatMap((done, i) =>
    done === null ? [] : [makeScheme(i + 1, 3, done)],
  )
  return { id, exerciseId, optional, notes: null, schemes }
}

function makeBlock(id: string, sortOrder: number, slot: OldSlot): OldBlock {
  return { id, type: 'single', sortOrder, notes: null, exercises: [slot] }
}

function makeSuperset(id: string, sortOrder: number, slots: OldSlot[]): OldBlock {
  return { id, type: 'superset', sortOrder, notes: null, exercises: slots }
}

function makeDay(id: string, dayNumber: number, blocks: OldBlock[]): OldDay {
  return { id, dayNumber, label: `Día ${dayNumber}`, blocks }
}

function makeTree(days: OldDay[]): OldRoutineTree {
  return { id: ROUTINE, days }
}

function makeBody(days: unknown[], weeks = 4): UpdateRoutine {
  return updateRoutineSchema.parse({
    name: 'Fase 1',
    daysPerWeek: days.length,
    weeks,
    days,
  })
}

function weekInput(weekNumber: number, overrides: Record<string, unknown> = {}) {
  return { weekNumber, sets: 3, reps: '10', restSeconds: 120, ...overrides }
}

function exerciseInput(overrides: Record<string, unknown> = {}) {
  return {
    exerciseId: EX_1,
    schemes: [weekInput(1), weekInput(2), weekInput(3), weekInput(4)],
    ...overrides,
  }
}

function blockInput(exercises: unknown[], overrides: Record<string, unknown> = {}) {
  return { exercises, ...overrides }
}

describe('findStartWeek', () => {
  it('arranca en 1 cuando no hay nada registrado', () => {
    const tree = makeTree([
      makeDay(DAY_1, 1, [makeBlock(BLOCK_A, 0, makeSlot(SLOT_A, EX_1, [0, 0, 0, 0]))]),
    ])

    expect(findStartWeek(tree, 4)).toBe(1)
  })

  it('devuelve la primera semana sin cerrar', () => {
    const tree = makeTree([
      makeDay(DAY_1, 1, [makeBlock(BLOCK_A, 0, makeSlot(SLOT_A, EX_1, [3, 3, 1, 0]))]),
    ])

    expect(findStartWeek(tree, 4)).toBe(3)
  })

  it('un opcional sin hacer no adelanta la semana', () => {
    const tree = makeTree([
      makeDay(DAY_1, 1, [
        makeBlock(BLOCK_A, 0, makeSlot(SLOT_A, EX_1, [3, 0, 0, 0])),
        makeBlock(BLOCK_B, 1, makeSlot(SLOT_B, EX_2, [0, 0, 0, 0], true)),
      ]),
    ])

    expect(findStartWeek(tree, 4)).toBe(2)
  })

  it('cuenta los ejercicios de una superserie como dos', () => {
    const tree = makeTree([
      makeDay(DAY_1, 1, [
        makeSuperset(BLOCK_A, 0, [
          makeSlot(SLOT_A, EX_1, [3, 0, 0, 0]),
          makeSlot(SLOT_B, EX_2, [0, 0, 0, 0]),
        ]),
      ]),
    ])

    expect(findStartWeek(tree, 4)).toBe(1)
  })

  // Es la propiedad que hace estable el cambio de ejercicio a mitad de fase: el slot nuevo no tiene
  // prescripción para las semanas ya cerradas, y eso no puede volver a abrirlas.
  it('un ejercicio sin prescripción para esa semana no la traba', () => {
    const tree = makeTree([
      makeDay(DAY_1, 1, [
        makeBlock(BLOCK_A, 0, makeSlot(SLOT_A, EX_1, [3, 3, null, null])),
        makeBlock(BLOCK_B, 1, makeSlot(SLOT_B, EX_2, [null, null, 0, 0])),
      ]),
    ])

    expect(findStartWeek(tree, 4)).toBe(3)
  })

  it('con la fase entera cerrada se queda en la última semana', () => {
    const tree = makeTree([
      makeDay(DAY_1, 1, [makeBlock(BLOCK_A, 0, makeSlot(SLOT_A, EX_1, [3, 3, 3, 3]))]),
    ])

    expect(findStartWeek(tree, 4)).toBe(4)
  })
})

describe('diffRoutineTree', () => {
  const tree = makeTree([
    makeDay(DAY_1, 1, [
      makeBlock(BLOCK_A, 0, makeSlot(SLOT_A, EX_1, [3, 3, 0, 0])),
      makeBlock(BLOCK_B, 1, makeSlot(SLOT_B, EX_2, [3, 3, 0, 0])),
    ]),
  ])

  const untouched = [
    {
      id: DAY_1,
      blocks: [
        blockInput([exerciseInput({ id: SLOT_A })], { id: BLOCK_A }),
        blockInput([exerciseInput({ id: SLOT_B, exerciseId: EX_2 })], { id: BLOCK_B }),
      ],
    },
  ]

  it('no retira ni recrea nada cuando el árbol no cambió', () => {
    const plan = diffRoutineTree(makeBody(untouched), tree, 3)

    expect(plan.retireDayIds).toEqual([])
    expect(plan.retireBlockIds).toEqual([])
    expect(plan.retireSlotIds).toEqual([])
    expect(plan.dayInserts).toEqual([])
    expect(plan.blockInserts).toEqual([])
    expect(plan.slotInserts).toEqual([])
    expect(plan.slotUpdates).toHaveLength(2)
  })

  it('solo reescribe la prescripción desde la semana en curso', () => {
    const plan = diffRoutineTree(makeBody(untouched), tree, 3)

    expect(plan.schemeUpdates.map(s => s.week_number)).toEqual([3, 4, 3, 4])
    expect(plan.schemeInserts).toEqual([])
  })

  it('aterriza la prescripción de cada semana en su propia scheme', () => {
    const untrained = makeTree([
      makeDay(DAY_1, 1, [makeBlock(BLOCK_A, 0, makeSlot(SLOT_A, EX_1, [0, 0, 0, 0]))]),
    ])
    const body = makeBody([
      {
        id: DAY_1,
        blocks: [
          blockInput(
            [
              exerciseInput({
                id: SLOT_A,
                schemes: [
                  weekInput(1, { sets: 3, reps: '12' }),
                  weekInput(2, { sets: 3, reps: '10' }),
                  weekInput(3, { sets: 4, reps: '8' }),
                  weekInput(4, { sets: 5, reps: '6', restSeconds: 180 }),
                ],
              }),
            ],
            { id: BLOCK_A },
          ),
        ],
      },
    ])
    const plan = diffRoutineTree(body, untrained, 1)

    expect(plan.schemeUpdates.map(s => [s.week_number, s.sets, s.reps])).toEqual([
      [1, 3, '12'],
      [2, 3, '10'],
      [3, 4, '8'],
      [4, 5, '6'],
    ])
    expect(plan.schemeUpdates.at(-1)?.rest_seconds).toBe(180)
  })

  // El bloqueo es por celda y no por semana: el picker de /plan deja al cliente registrar series en
  // cualquier semana, así que "ya entrenado" no coincide con "anterior al cursor".
  it('no reescribe una celda que el cliente ya entrenó', () => {
    const trained = makeTree([
      makeDay(DAY_1, 1, [makeBlock(BLOCK_A, 0, makeSlot(SLOT_A, EX_1, [3, 3, 1, 0]))]),
    ])
    const body = makeBody([
      { id: DAY_1, blocks: [blockInput([exerciseInput({ id: SLOT_A })], { id: BLOCK_A })] },
    ])
    const plan = diffRoutineTree(body, trained, 3)

    expect(plan.schemeUpdates.map(s => s.week_number)).toEqual([4])
    expect(plan.schemeInserts).toEqual([])
  })

  it('una serie desmarcada no cierra la celda', () => {
    const slot = makeSlot(SLOT_A, EX_1, [0, 0, 0, 0])
    slot.schemes[2]!.logs = [{ completed: false, deletedAt: null }]

    const body = makeBody([
      { id: DAY_1, blocks: [blockInput([exerciseInput({ id: SLOT_A })], { id: BLOCK_A })] },
    ])
    const plan = diffRoutineTree(
      body,
      makeTree([makeDay(DAY_1, 1, [makeBlock(BLOCK_A, 0, slot)])]),
      3,
    )

    expect(plan.schemeUpdates.map(s => s.week_number)).toEqual([3, 4])
  })

  // Los schemes sostienen los workout_logs y no se borran, así que una semana ausente en el body no
  // se puede desprescribir: queda como está.
  it('una semana que el body no trae no se toca', () => {
    const body = makeBody([
      {
        id: DAY_1,
        blocks: [
          blockInput([exerciseInput({ id: SLOT_A, schemes: [weekInput(3)] })], { id: BLOCK_A }),
        ],
      },
    ])
    const plan = diffRoutineTree(body, tree, 3)

    expect(plan.schemeUpdates.map(s => s.week_number)).toEqual([3])
    expect(plan.schemeInserts).toEqual([])
  })

  it('la nota de la semana la manda el body, no la scheme vieja', () => {
    const body = makeBody([
      {
        id: DAY_1,
        blocks: [
          blockInput(
            [
              exerciseInput({
                id: SLOT_A,
                schemes: [weekInput(3, { notes: 'Semana de descarga' })],
              }),
            ],
            { id: BLOCK_A },
          ),
        ],
      },
    ])
    const plan = diffRoutineTree(body, tree, 3)

    expect(plan.schemeUpdates[0]?.notes).toBe('Semana de descarga')
  })

  it('crea las schemes que falten dentro del rango de semanas', () => {
    const partial = makeTree([
      makeDay(DAY_1, 1, [makeBlock(BLOCK_A, 0, makeSlot(SLOT_A, EX_1, [3, 3, null, null]))]),
    ])
    const body = makeBody([
      { id: DAY_1, blocks: [blockInput([exerciseInput({ id: SLOT_A })], { id: BLOCK_A })] },
    ])
    const plan = diffRoutineTree(body, partial, 3)

    expect(plan.schemeUpdates).toEqual([])
    expect(plan.schemeInserts.map(s => s.week_number)).toEqual([3, 4])
    expect(plan.schemeInserts[0]).toMatchObject({ routine_exercise_id: SLOT_A })
  })

  // El slot viejo conserva sus schemes (y con ellas los logs); el nuevo arranca en la semana en curso.
  it('cambiar el ejercicio de un slot lo retira y crea uno nuevo desde la semana en curso', () => {
    const body = makeBody([
      {
        id: DAY_1,
        blocks: [
          blockInput([exerciseInput({ id: SLOT_A, exerciseId: EX_2 })], { id: BLOCK_A }),
          blockInput([exerciseInput({ id: SLOT_B, exerciseId: EX_2 })], { id: BLOCK_B }),
        ],
      },
    ])
    const plan = diffRoutineTree(body, tree, 3)

    expect(plan.retireSlotIds).toEqual([SLOT_A])
    expect(plan.retireBlockIds).toEqual([])
    expect(plan.retireDayIds).toEqual([])
    expect(plan.slotInserts).toHaveLength(1)
    expect(plan.slotInserts[0]).toMatchObject({
      exercise_id: EX_2,
      routine_block_id: BLOCK_A,
      sort_order: 0,
    })
    expect(plan.schemeInserts.map(s => s.week_number)).toEqual([3, 4])
  })

  it('agregar un ejercicio no toca los existentes', () => {
    const body = makeBody([
      {
        id: DAY_1,
        blocks: [
          blockInput([exerciseInput({ id: SLOT_A })], { id: BLOCK_A }),
          blockInput([exerciseInput({ id: SLOT_B, exerciseId: EX_2 })], { id: BLOCK_B }),
          blockInput([exerciseInput({ exerciseId: EX_2 })]),
        ],
      },
    ])
    const plan = diffRoutineTree(body, tree, 3)

    expect(plan.retireSlotIds).toEqual([])
    expect(plan.blockInserts).toHaveLength(1)
    expect(plan.blockInserts[0]).toMatchObject({ routine_day_id: DAY_1, sort_order: 2 })
    expect(plan.slotInserts[0]).toMatchObject({ routine_block_id: plan.blockInserts[0]!.id })
    expect(plan.schemeInserts.map(s => s.week_number)).toEqual([3, 4])
  })

  it('sacar un ejercicio retira su slot y su bloque, y renumera el resto', () => {
    const body = makeBody([
      {
        id: DAY_1,
        blocks: [blockInput([exerciseInput({ id: SLOT_B, exerciseId: EX_2 })], { id: BLOCK_B })],
      },
    ])
    const plan = diffRoutineTree(body, tree, 3)

    expect(plan.retireSlotIds).toEqual([SLOT_A])
    expect(plan.retireBlockIds).toEqual([BLOCK_A])
    expect(plan.blockUpdates).toEqual([
      { id: BLOCK_B, routine_day_id: DAY_1, type: 'single', sort_order: 0, notes: null },
    ])
  })

  // Agrupar es la edición que más importa que no destruya: si el slot se retirara, el cliente
  // perdería de vista todo lo que ya entrenó de ese ejercicio.
  it('agrupar dos ejercicios en una superserie preserva los dos slots', () => {
    const body = makeBody([
      {
        id: DAY_1,
        blocks: [
          blockInput(
            [exerciseInput({ id: SLOT_A }), exerciseInput({ id: SLOT_B, exerciseId: EX_2 })],
            { id: BLOCK_A, type: 'superset', notes: 'sin descanso entre los dos' },
          ),
        ],
      },
    ])
    const plan = diffRoutineTree(body, tree, 3)

    expect(plan.retireSlotIds).toEqual([])
    expect(plan.slotInserts).toEqual([])
    expect(plan.retireBlockIds).toEqual([BLOCK_B])
    expect(plan.blockUpdates).toEqual([
      {
        id: BLOCK_A,
        routine_day_id: DAY_1,
        type: 'superset',
        sort_order: 0,
        notes: 'sin descanso entre los dos',
      },
    ])
    expect(plan.slotUpdates.map(s => [s.id, s.routine_block_id, s.sort_order])).toEqual([
      [SLOT_A, BLOCK_A, 0],
      [SLOT_B, BLOCK_A, 1],
    ])
    expect(plan.schemeUpdates.map(s => s.week_number)).toEqual([3, 4, 3, 4])
  })

  it('desagrupar mueve el slot a un bloque nuevo sin retirarlo', () => {
    const grouped = makeTree([
      makeDay(DAY_1, 1, [
        makeSuperset(BLOCK_A, 0, [
          makeSlot(SLOT_A, EX_1, [3, 3, 0, 0]),
          makeSlot(SLOT_B, EX_2, [3, 3, 0, 0]),
        ]),
      ]),
    ])
    const body = makeBody([
      {
        id: DAY_1,
        blocks: [
          blockInput([exerciseInput({ id: SLOT_A })], { id: BLOCK_A }),
          blockInput([exerciseInput({ id: SLOT_B, exerciseId: EX_2 })]),
        ],
      },
    ])
    const plan = diffRoutineTree(body, grouped, 3)

    expect(plan.retireSlotIds).toEqual([])
    expect(plan.retireBlockIds).toEqual([])
    expect(plan.blockInserts).toHaveLength(1)
    expect(plan.blockUpdates[0]).toMatchObject({ id: BLOCK_A, type: 'single', sort_order: 0 })
    expect(plan.slotUpdates.map(s => [s.id, s.routine_block_id, s.sort_order])).toEqual([
      [SLOT_A, BLOCK_A, 0],
      [SLOT_B, plan.blockInserts[0]!.id, 0],
    ])
  })

  it('sacar un día lo retira con todo lo que cuelga', () => {
    const twoDays = makeTree([
      makeDay(DAY_1, 1, [makeBlock(BLOCK_A, 0, makeSlot(SLOT_A, EX_1, [0, 0, 0, 0]))]),
      makeDay(DAY_2, 2, [makeBlock(BLOCK_B, 0, makeSlot(SLOT_B, EX_2, [0, 0, 0, 0]))]),
    ])
    const body = makeBody([
      { id: DAY_1, blocks: [blockInput([exerciseInput({ id: SLOT_A })], { id: BLOCK_A })] },
    ])
    const plan = diffRoutineTree(body, twoDays, 1)

    expect(plan.retireDayIds).toEqual([DAY_2])
    expect(plan.retireBlockIds).toEqual([BLOCK_B])
    expect(plan.retireSlotIds).toEqual([SLOT_B])
  })

  it('un día nuevo se inserta con su posición y sin id previo', () => {
    const body = makeBody([
      ...untouched,
      { label: 'Día nuevo', blocks: [blockInput([exerciseInput()])] },
    ])
    const plan = diffRoutineTree(body, tree, 3)

    expect(plan.dayInserts).toHaveLength(1)
    expect(plan.dayInserts[0]).toMatchObject({
      routine_id: ROUTINE,
      day_number: 2,
      label: 'Día nuevo',
    })
    expect(plan.dayUpdates[0]).toMatchObject({ id: DAY_1, day_number: 1 })
  })

  // El índice único parcial (routine_day_id, sort_order) se chequea fila por fila: sin sacar a todos
  // los bloques vivos del rango final antes, un swap de posiciones colisiona a mitad del update.
  it('el corrimiento temporal saca a todos los bloques vivos del rango final', () => {
    const body = makeBody([
      {
        id: DAY_1,
        blocks: [
          blockInput([exerciseInput({ id: SLOT_B, exerciseId: EX_2 })], { id: BLOCK_B }),
          blockInput([exerciseInput({ id: SLOT_A })], { id: BLOCK_A }),
        ],
      },
    ])
    const plan = diffRoutineTree(body, tree, 3)

    const temps = plan.blockTempShift.map(b => b.sort_order)
    const finals = plan.blockUpdates.map(b => b.sort_order)

    expect(plan.blockTempShift.map(b => b.id)).toEqual([BLOCK_A, BLOCK_B])
    expect(new Set(temps).size).toBe(temps.length)
    expect(Math.min(...temps)).toBeGreaterThan(Math.max(...finals))
    expect(plan.blockUpdates).toEqual([
      { id: BLOCK_B, routine_day_id: DAY_1, type: 'single', sort_order: 0, notes: null },
      { id: BLOCK_A, routine_day_id: DAY_1, type: 'single', sort_order: 1, notes: null },
    ])
  })

  // Mismo índice, un nivel más abajo: unique(routine_block_id, sort_order). Recién se ejercita con
  // bloques de más de un ejercicio, donde reordenar o mover un slot pisa una posición ocupada.
  it('el corrimiento temporal saca a todos los slots vivos del rango final', () => {
    const grouped = makeTree([
      makeDay(DAY_1, 1, [
        makeSuperset(BLOCK_A, 0, [
          makeSlot(SLOT_A, EX_1, [3, 3, 0, 0]),
          makeSlot(SLOT_B, EX_2, [3, 3, 0, 0]),
        ]),
      ]),
    ])
    const body = makeBody([
      {
        id: DAY_1,
        blocks: [
          blockInput(
            [exerciseInput({ id: SLOT_B, exerciseId: EX_2 }), exerciseInput({ id: SLOT_A })],
            { id: BLOCK_A, type: 'superset' },
          ),
        ],
      },
    ])
    const plan = diffRoutineTree(body, grouped, 3)

    const temps = plan.slotTempShift.map(s => s.sort_order)
    const finals = plan.slotUpdates.map(s => s.sort_order)

    expect(plan.slotTempShift.map(s => s.id)).toEqual([SLOT_A, SLOT_B])
    expect(new Set(temps).size).toBe(temps.length)
    expect(Math.min(...temps)).toBeGreaterThan(Math.max(...finals))
    expect(plan.slotUpdates.map(s => [s.id, s.sort_order])).toEqual([
      [SLOT_B, 0],
      [SLOT_A, 1],
    ])
  })
})
