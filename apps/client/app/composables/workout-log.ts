import type {
  ApiError,
  CreateWorkoutLog,
  LastWorkoutQueryParams,
  WorkoutLog,
} from '@macross/shared'
import type { FetchError } from 'ofetch'

type QueuedLog = CreateWorkoutLog & { attempts: number }

// Los params salen del árbol, que carga async: van como getter para que el fetch espere y se rehaga
// al navegar entre ejercicios (la page se reusa).
export function useGetLastWorkout(session: MaybeRefOrGetter<LastWorkoutQueryParams | null>) {
  const query = computed(() => toValue(session))

  const { data, pending } = useFetch<WorkoutLog | null>('/api/workout-logs/last', {
    key: () =>
      `last-workout-${query.value?.exerciseId}-${query.value?.dayNumber}-${query.value?.weekNumber}`,
    query: () => query.value ?? {},
    enabled: () => query.value !== null,
    default: () => null,
  })

  return { lastWorkout: data, loading: pending }
}

export function useLogSet() {
  const queue = useState<QueuedLog[]>('workout-log-queue', () => [])
  const { refresh, routine } = useGetActiveRoutine()
  const { t } = useI18n()
  const toast = useToast()

  // Un POST en vuelo no se muestra: si no, cada tap prendería el aviso por 200ms.
  const failed = computed(() => queue.value.filter(entry => entry.attempts > 0))
  const unsyncedCount = computed(() => failed.value.length)
  const unsyncedKeys = computed(() => new Set(failed.value.map(entry => setKey(entry))))

  function setKey(entry: { routineExerciseSchemeId: string; setNumber: number }) {
    return `${entry.routineExerciseSchemeId}:${entry.setNumber}`
  }

  function isUnsynced(routineExerciseSchemeId: string, setNumber: number) {
    return unsyncedKeys.value.has(setKey({ routineExerciseSchemeId, setNumber }))
  }

  function patchTree(log: WorkoutLog) {
    const schemes = routine.value?.days?.flatMap(day =>
      day.blocks.flatMap(block => block.exercises.flatMap(exercise => exercise.schemes)),
    )
    const scheme = schemes?.find(s => s.id === log.routineExerciseSchemeId)
    if (!scheme) return

    const logs = [...(scheme.logs ?? []).filter(l => l.setNumber !== log.setNumber), log]
    scheme.logs = logs.toSorted((a, b) => a.setNumber - b.setNumber)
  }

  function dequeue(entry: QueuedLog) {
    queue.value = queue.value.filter(queued => setKey(queued) !== setKey(entry))
  }

  async function send(entry: QueuedLog) {
    try {
      const log = await $fetch<WorkoutLog>('/api/workout-logs', { method: 'POST', body: entry })
      patchTree(log)
      dequeue(entry)
    } catch (e) {
      const error = e as FetchError<ApiError>
      const status = error.statusCode ?? 0

      // Un 4xx (RLS, payload inválido) no es transitorio: reintentar no lo va a arreglar.
      if (status >= 400 && status < 500) {
        dequeue(entry)
        await refresh()
        toast.add({
          title: t('plan.exercise.logError'),
          description: error.data?.statusMessage ?? undefined,
          color: 'error',
        })
        return
      }

      entry.attempts += 1
      const delay = RETRY_DELAYS[entry.attempts - 1]
      if (delay) setTimeout(() => send(entry), delay)
    }
  }

  function logSet(input: CreateWorkoutLog) {
    patchTree({
      id: crypto.randomUUID(),
      routineExerciseSchemeId: input.routineExerciseSchemeId,
      setNumber: input.setNumber,
      weightKg: input.weightKg ?? null,
      actualReps: input.actualReps ?? null,
      completed: input.completed,
      loggedAt: new Date().toISOString(),
    })

    const entry: QueuedLog = { ...input, attempts: 0 }
    // Último tap gana: una entrada por serie, así corregir el peso no hace crecer la cola.
    dequeue(entry)
    queue.value = [...queue.value, entry]
    void send(entry)
  }

  // Reintentar de más es inocuo: el endpoint es idempotente.
  function retryUnsynced() {
    for (const entry of queue.value) {
      entry.attempts = 0
      void send(entry)
    }
  }

  onMounted(() => {
    retryUnsynced()
    window.addEventListener('online', retryUnsynced)
  })

  onUnmounted(() => window.removeEventListener('online', retryUnsynced))

  return { isUnsynced, logSet, retryUnsynced, unsyncedCount }
}

const RETRY_DELAYS = [2000, 8000, 20_000]
