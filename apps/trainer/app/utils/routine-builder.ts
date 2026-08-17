import type { BlockType } from '@macross/shared'
import { BlockTypes } from '@macross/shared'

import type {
  BuilderBlock,
  BuilderDay,
  BuilderExercise,
  BuilderScheme,
} from '@/components/routines/types'

// Lo ya entrenado no se toca, y el server aplica la misma regla en el PATCH: si una celda bloqueada
// se ofreciera editable, el cambio se descartaría en silencio.
export function isSchemeLocked(scheme: BuilderScheme, startWeek: number) {
  return scheme.weekNumber < startWeek || scheme.trainedSets > 0
}

// Solo se exigen las celdas que el server va a escribir: una bloqueada no viaja, así que pedirle
// datos deja el guardado trabado sin forma de destrabarlo.
function isExerciseComplete(exercise: BuilderExercise, startWeek: number) {
  return (
    !!exercise.exercise &&
    exercise.schemes
      .filter(scheme => !isSchemeLocked(scheme, startWeek))
      .every(scheme => scheme.reps.trim().length > 0 && scheme.sets >= 1)
  )
}

export function isDayComplete(day: BuilderDay, startWeek: number) {
  return (
    day.blocks.length > 0 &&
    day.blocks.every(
      block =>
        block.exercises.length > 0 &&
        block.exercises.every(exercise => isExerciseComplete(exercise, startWeek)),
    )
  )
}

// Dos superficies mueven lo mismo (el drag y los ↑/↓): un solo lugar donde el movimiento se define.
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const item = items[from]
  if (item === undefined || from === to || to < 0 || to >= items.length) return items

  return items.toSpliced(from, 1).toSpliced(to, 0, item)
}

export function makeScheme(weekNumber: number, from?: Partial<BuilderScheme>): BuilderScheme {
  return {
    weekNumber,
    sets: from?.sets ?? 3,
    reps: from?.reps ?? '',
    restSeconds: from?.restSeconds ?? null,
    notes: from?.notes ?? '',
    trainedSets: from?.trainedSets ?? 0,
  }
}

// Un ejercicio agregado a una fase en curso arranca en la semana en curso: el server no inserta
// nada antes, así que esas semanas no existen para él y no se guardan vacías.
export function makeExercise(weeks: number, startWeek: number): BuilderExercise {
  const schemes = Array.from({ length: weeks - startWeek + 1 }, (_, i) => makeScheme(startWeek + i))
  return { exercise: null, optional: false, notes: '', schemes }
}

export function makeBlock(weeks: number, startWeek: number): BuilderBlock {
  return { type: BlockTypes.single, notes: '', exercises: [makeExercise(weeks, startWeek)] }
}

export function makeDay(): BuilderDay {
  return { label: '', blocks: [] }
}

// El clon es un slot nuevo: sin id (con el del original, el diff creería que las dos filas son la
// misma y una de las dos perdería su ejercicio) y sin prescripción para las semanas ya cerradas.
function cloneExercise(exercise: BuilderExercise, startWeek: number): BuilderExercise {
  return {
    exercise: exercise.exercise ? { ...exercise.exercise } : null,
    optional: exercise.optional,
    notes: exercise.notes,
    schemes: exercise.schemes
      .filter(scheme => scheme.weekNumber >= startWeek)
      .map(scheme =>
        makeScheme(scheme.weekNumber, {
          sets: scheme.sets,
          reps: scheme.reps,
          restSeconds: scheme.restSeconds,
          notes: scheme.notes,
        }),
      ),
  }
}

export function cloneDay(day: BuilderDay, startWeek: number): BuilderDay {
  return {
    label: day.label,
    blocks: day.blocks.map(block => ({
      type: block.type,
      notes: block.notes,
      exercises: block.exercises.map(exercise => cloneExercise(exercise, startWeek)),
    })),
  }
}

// Duplicar cae en el próximo día vacío en vez de empujar uno nuevo: el wizard ya creó N días con la
// cantidad elegida, así que apilar al final subiría los días por semana sin que nadie lo pida.
export function nextEmptyDayIndex(days: BuilderDay[], after: number) {
  return days.findIndex((day, i) => i > after && day.blocks.length === 0)
}

// Agrupar y desagrupar mueven los slots entre bloques conservando su id: el server los re-apunta en
// vez de retirarlos, así el cliente no pierde de vista las series que ya registró.
export function groupWithNext(blocks: BuilderBlock[], index: number): BuilderBlock[] {
  const block = blocks[index]
  const next = blocks[index + 1]
  if (!block || !next) return blocks

  const merged: BuilderBlock = {
    ...block,
    type: block.type === BlockTypes.single ? BlockTypes.superset : block.type,
    exercises: [...block.exercises, ...next.exercises],
  }

  return blocks.toSpliced(index, 2, merged)
}

// Un ejercicio sin elegir se descarta en vez de salir a su propio bloque: no lleva información y
// dejaría un bloque vacío que traba el guardado del día. Si no quedara ninguno elegido, sobrevive
// una fila en blanco para no hacer desaparecer el bloque.
export function ungroupBlock(blocks: BuilderBlock[], index: number): BuilderBlock[] {
  const block = blocks[index]
  if (!block) return blocks

  const filled = block.exercises.filter(exercise => exercise.exercise)
  const [first, ...rest] = filled.length ? filled : block.exercises.slice(0, 1)
  if (!first) return blocks
  if (block.type === BlockTypes.single && !rest.length) return blocks

  return blocks.toSpliced(
    index,
    1,
    { ...block, type: BlockTypes.single, exercises: [first] },
    ...rest.map(exercise => ({ type: BlockTypes.single, notes: '', exercises: [exercise] })),
  )
}

// El tipo y el contenido cambian juntos: un bloque de un solo ejercicio es `single`, así que elegir
// "superserie" también le abre la fila del segundo. Separarlos dejaría una "superserie de uno", que
// habría que rechazar al guardar sin nada en pantalla que lo explique.
export function setBlockType(
  blocks: BuilderBlock[],
  index: number,
  type: BlockType,
  exercise: BuilderExercise,
): BuilderBlock[] {
  const block = blocks[index]
  if (!block) return blocks
  if (type === BlockTypes.single) return ungroupBlock(blocks, index)

  const exercises = block.exercises.length > 1 ? block.exercises : [...block.exercises, exercise]

  return blocks.toSpliced(index, 1, { ...block, type, exercises })
}

export function addExerciseToBlock(
  blocks: BuilderBlock[],
  index: number,
  exercise: BuilderExercise,
): BuilderBlock[] {
  const block = blocks[index]
  if (!block) return blocks

  return blocks.toSpliced(index, 1, {
    ...block,
    type: block.type === BlockTypes.single ? BlockTypes.superset : block.type,
    exercises: [...block.exercises, exercise],
  })
}

export function removeExerciseAt(
  blocks: BuilderBlock[],
  index: number,
  exerciseIndex: number,
): BuilderBlock[] {
  const block = blocks[index]
  if (!block) return blocks

  const exercises = block.exercises.toSpliced(exerciseIndex, 1)
  if (!exercises.length) return blocks.toSpliced(index, 1)

  return blocks.toSpliced(index, 1, {
    ...block,
    type: exercises.length === 1 ? BlockTypes.single : block.type,
    exercises,
  })
}
