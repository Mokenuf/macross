<script setup lang="ts">
import type { RoutineExerciseScheme, WorkoutLog } from '@macross/shared'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const { localizedName } = useLocalizedName()
const { isUnsynced, logSet, retryUnsynced, unsyncedCount } = useLogSet()
const { add, isFinalCountdown, isRunning, progress, remaining, skip, start } = useRestTimer()
const reps = ref('')
const { routine, loading } = useGetActiveRoutine()
const selectedSet = ref(1)
const { t } = useI18n()
const weight = ref<number | undefined>()

const nanoId = computed(() => String(route.params.nanoId))
const slug = computed(() => String(route.params.slug))

const day = computed(() => routine.value?.days?.find(d => d.nanoId === nanoId.value) ?? null)
const dayExercises = computed(() => day.value?.blocks.flatMap(b => b.exercises) ?? [])
const position = computed(() => dayExercises.value.findIndex(e => e.exercise.slug === slug.value))
const slot = computed(() => dayExercises.value[position.value] ?? null)

const scheme = computed<RoutineExerciseScheme | null>(() =>
  slot.value ? currentScheme(slot.value) : null,
)

const { lastWorkout, loading: loadingLastWorkout } = useGetLastWorkout(() =>
  routine.value && slot.value && day.value && scheme.value
    ? {
        exerciseId: slot.value.exercise.id,
        routineId: routine.value.id,
        dayNumber: day.value.dayNumber,
        weekNumber: scheme.value.weekNumber,
      }
    : null,
)

const logs = computed<WorkoutLog[]>(() => scheme.value?.logs ?? [])
const totalSets = computed(() => scheme.value?.sets ?? 0)

const firstPendingSet = computed(() => {
  for (let n = 1; n <= totalSets.value; n++) {
    if (!logFor(n)?.completed) return n
  }
  return null
})

const selectedLog = computed(() => logFor(selectedSet.value))
const allSetsDone = computed(() => totalSets.value > 0 && firstPendingSet.value === null)

// La prescripción es texto libre ("6-8", "15 12 10", "al fallo") y el log es un entero.
const prescribedReps = computed(() => {
  const target = scheme.value?.reps.trim()
  return target && /^\d+$/.test(target) ? Number(target) : null
})

const dayTitle = computed(() =>
  day.value ? (day.value.label ?? t('plan.dayLabel', { number: day.value.dayNumber })) : '',
)

const eyebrow = computed(() => {
  if (!day.value) return ''
  return [
    t('plan.dayLabel', { number: day.value.dayNumber }),
    t('plan.exercise.positionLabel', { n: position.value + 1, total: dayExercises.value.length }),
  ].join(' · ')
})

const setSummary = computed(() => {
  if (!scheme.value) return ''
  const parts = [
    t('plan.exercise.setSummary', {
      current: selectedSet.value,
      total: scheme.value.sets,
      reps: scheme.value.reps,
    }),
  ]
  if (scheme.value.restSeconds !== null) {
    parts.push(t('plan.exercise.restSummary', { rest: formatRest(scheme.value.restSeconds) }))
  }
  return parts.join(' · ')
})

const lastTimeLabel = computed(() => {
  if (loadingLastWorkout.value) return '—'
  return lastWorkout.value ? `${lastWorkout.value.weightKg} kg` : t('plan.exercise.noRecord')
})

const exerciseName = computed(() => (slot.value ? localizedName(slot.value.exercise) : ''))

const nextExercise = computed(() => dayExercises.value[position.value + 1] ?? null)

// Terminado el último ejercicio se vuelve al día, que ya muestra todo tachado.
const nextExerciseTo = computed(() =>
  nextExercise.value
    ? `/plan/${nanoId.value}/${nextExercise.value.exercise.slug}`
    : `/plan/${nanoId.value}`,
)

const nextLabel = computed(() => {
  if (firstPendingSet.value !== null) {
    return t('plan.rest.nextSet', { exercise: exerciseName.value, set: firstPendingSet.value })
  }

  return nextExercise.value
    ? t('plan.rest.nextSet', { exercise: localizedName(nextExercise.value.exercise), set: 1 })
    : t('plan.rest.dayDone')
})

const youtubeEmbedUrl = computed(() => {
  const videoUrl = slot.value?.exercise.videoUrl
  if (!videoUrl) return null
  try {
    const url = new URL(videoUrl)
    const isYoutube = url.hostname.includes('youtube.com') || url.hostname === 'youtu.be'
    if (!isYoutube) return null
    const videoId = url.searchParams.get('v') || url.pathname.split('/').pop()
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  } catch {
    return null
  }
})

// Si el descanso venía de la última serie, el overlay ya prometió un destino y hay que cumplirlo.
watch(isRunning, (running, wasRunning) => {
  if (running || !wasRunning || firstPendingSet.value !== null) return
  void navigateTo(nextExerciseTo.value)
})

// immediate porque al montar la selección tiene que salir del ref inicial.
watch(
  firstPendingSet,
  next => {
    selectedSet.value = next ?? (totalSets.value || 1)
  },
  { immediate: true },
)

watch([selectedSet, scheme], seedInputs, { immediate: true })

// La vez pasada llega después del montaje: solo siembra si el peso sigue intacto.
watch(lastWorkout, last => {
  if (weight.value === undefined) weight.value = last?.weightKg ?? undefined
})

useHead({ title: () => exerciseName.value || t('plan.title') })

function logFor(setNumber: number): WorkoutLog | null {
  return logs.value.find(l => l.setNumber === setNumber) ?? null
}

// Serie en curso = la seleccionada, y gana sobre "hecha": es donde está parado el cliente.
function setChipClass(setNumber: number): string {
  if (selectedSet.value === setNumber) return 'bg-primary text-macross-gray-950 ring-primary'
  if (logFor(setNumber)?.completed) return 'bg-secondary/8 text-secondary ring-secondary/30'
  return 'bg-muted text-muted ring-accented'
}

// Mismo peso y mismas reps en todas las series salvo cambio explícito: el caso normal es un tap.
function seedInputs() {
  const own = logFor(selectedSet.value)
  const previous = logs.value.findLast(l => l.setNumber < selectedSet.value)

  weight.value = own?.weightKg ?? previous?.weightKg ?? lastWorkout.value?.weightKg ?? undefined
  reps.value = String(own?.actualReps ?? previous?.actualReps ?? prescribedReps.value ?? '')
}

function saveSet(completed: boolean) {
  if (!scheme.value) return

  const wasCompleted = selectedLog.value?.completed ?? false

  logSet({
    routineExerciseSchemeId: scheme.value.id,
    setNumber: selectedSet.value,
    weightKg: weight.value,
    actualReps: reps.value === '' ? undefined : Number(reps.value),
    completed,
  })

  // Solo la transición pendiente → completada arranca el descanso: corregir una serie vieja no.
  if (completed && !wasCompleted && scheme.value.restSeconds) start(scheme.value.restSeconds)
}

// Reka cae a `min` sin aplicar el paso cuando el campo está vacío, así que el primer + daría 0 kg.
function onWeightInput(value: number | undefined) {
  weight.value = weight.value === undefined && value === 0 ? WEIGHT_STEP : value
}

function formatRest(seconds: number | null): string {
  if (seconds === null) return ''
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`
}

const WEIGHT_STEP = 2.5
</script>

<template>
  <div class="space-y-4">
    <NuxtLink
      :to="`/plan/${nanoId}`"
      class="text-muted hover:text-default inline-flex items-center gap-1.5 text-sm transition-colors"
    >
      <UIcon name="i-lucide-chevron-left" class="size-4" />
      {{ dayTitle || t('plan.title') }}
    </NuxtLink>

    <div v-if="loading" class="space-y-4">
      <div class="bg-muted h-9 w-2/3 animate-pulse rounded-lg" />
      <div class="bg-muted aspect-video animate-pulse rounded-lg" />
      <div class="bg-muted h-24 animate-pulse rounded-md" />
    </div>

    <div v-else-if="!slot" class="bg-muted ring-accented rounded-md p-6 text-center ring-1">
      <p class="text-default font-semibold">{{ t('plan.exercise.notFound') }}</p>
    </div>

    <template v-else>
      <header class="flex items-start gap-3">
        <div class="min-w-0 flex-1 space-y-0.5">
          <p class="text-primary text-xs font-semibold tracking-widest uppercase">{{ eyebrow }}</p>
          <h1 class="font-logo text-4xl leading-none tracking-wide uppercase">
            {{ exerciseName }}
          </h1>
          <p v-if="scheme" class="text-muted pt-1 text-sm">{{ setSummary }}</p>
        </div>
        <UIcon
          v-if="allSetsDone"
          name="i-lucide-circle-check"
          class="text-secondary size-7 shrink-0"
          :aria-label="t('plan.exercise.allSetsDone')"
        />
      </header>

      <iframe
        v-if="youtubeEmbedUrl"
        :src="youtubeEmbedUrl"
        class="border-default aspect-video w-full rounded-lg border"
        frameborder="0"
        allow="
          accelerometer;
          autoplay;
          clipboard-write;
          encrypted-media;
          gyroscope;
          picture-in-picture;
        "
        allowfullscreen
      />
      <div
        v-else
        class="from-macross-gray-800 to-macross-gray-950 border-default flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border bg-linear-to-br"
      >
        <span
          class="ring-primary/60 text-primary bg-macross-gray-950/50 flex size-11 items-center justify-center rounded-full ring-1"
        >
          <UIcon name="i-lucide-play" class="size-5" />
        </span>
        <span class="text-macross-bronze-soft text-xs font-semibold tracking-widest uppercase">
          {{ t('plan.exercise.videoSoon') }}
        </span>
      </div>

      <div v-if="scheme" class="space-y-3">
        <div class="grid grid-cols-3 gap-3">
          <div class="col-span-2">
            <p class="text-dimmed mb-1 text-[10px] font-semibold tracking-widest uppercase">
              {{ t('plan.exercise.weight') }}
            </p>
            <UInputNumber
              :model-value="weight"
              size="xl"
              :min="0"
              :max="9999"
              :step="WEIGHT_STEP"
              :step-snapping="false"
              @update:model-value="onWeightInput"
              placeholder="—"
              class="w-full"
              :ui="{ base: 'font-logo text-3xl text-center' }"
            />
          </div>
          <div>
            <p class="text-dimmed mb-1 text-[10px] font-semibold tracking-widest uppercase">
              {{ t('plan.exercise.reps') }}
            </p>
            <UInput
              v-model="reps"
              size="xl"
              inputmode="numeric"
              :placeholder="scheme.reps"
              class="w-full"
              :ui="{ base: 'font-logo text-macross-bronze-soft text-3xl text-center' }"
            />
          </div>
        </div>

        <div class="text-dimmed flex items-center gap-1.5 text-xs">
          <UIcon name="i-lucide-rotate-ccw" class="size-3.5 shrink-0" />
          {{ t('plan.exercise.lastTime') }}:
          <span class="text-macross-primary-300 font-semibold">{{ lastTimeLabel }}</span>
        </div>

        <div class="flex gap-2">
          <button
            v-for="n in scheme.sets"
            :key="n"
            type="button"
            :class="[
              'relative flex-1 rounded-sm py-2 text-center ring-1 transition-colors',
              setChipClass(n),
            ]"
            @click="selectedSet = n"
          >
            <span
              v-if="isUnsynced(scheme.id, n)"
              class="bg-warning ring-background absolute -top-1 -right-1 size-2 rounded-full ring-2"
            />
            <span class="block text-sm font-semibold">{{ n }}</span>
            <span class="block text-[10px] leading-tight tabular-nums opacity-70">
              {{ logFor(n)?.weightKg ? `${logFor(n)?.weightKg} kg` : '—' }}
            </span>
          </button>
        </div>

        <button
          v-if="unsyncedCount > 0"
          type="button"
          class="text-warning hover:text-default flex w-full items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
          @click="retryUnsynced"
        >
          <UIcon name="i-lucide-refresh-cw" class="size-3.5 shrink-0" />
          {{
            unsyncedCount === 1
              ? t('plan.exercise.unsyncedOne', { count: unsyncedCount })
              : t('plan.exercise.unsyncedMany', { count: unsyncedCount })
          }}
          · {{ t('plan.exercise.retry') }}
        </button>

        <div class="flex gap-2">
          <UButton
            size="xl"
            color="primary"
            class="flex-1 justify-center"
            :label="
              selectedLog?.completed ? t('plan.exercise.updateSet') : t('plan.exercise.completeSet')
            "
            @click="saveSet(true)"
          />
          <UButton
            v-if="selectedLog?.completed"
            size="xl"
            color="neutral"
            variant="outline"
            icon="i-lucide-undo-2"
            :aria-label="t('plan.exercise.undoSet')"
            @click="saveSet(false)"
          />
        </div>
      </div>

      <div v-if="slot.notes" class="border-default border-t pt-4">
        <p class="text-dimmed mb-1 text-[10px] font-semibold tracking-widest uppercase">
          {{ t('plan.exercise.notes') }}
        </p>
        <p class="text-default text-sm whitespace-pre-line">{{ slot.notes }}</p>
      </div>
    </template>
  </div>

  <RestTimerOverlay
    v-if="isRunning"
    :is-final-countdown="isFinalCountdown"
    :next-label="nextLabel"
    :progress="progress"
    :remaining="remaining"
    @add="add(15)"
    @skip="skip"
  />
</template>
