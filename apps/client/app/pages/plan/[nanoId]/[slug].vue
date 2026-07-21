<script setup lang="ts">
import type { RoutineExerciseScheme } from '@macross/shared'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const { localizedName } = useLocalizedName()
const { routine, loading } = useGetActiveRoutine()
const { t } = useI18n()

const nanoId = computed(() => String(route.params.nanoId))
const slug = computed(() => String(route.params.slug))

const day = computed(() => routine.value?.days?.find(d => d.nanoId === nanoId.value) ?? null)
const dayExercises = computed(() => day.value?.blocks.flatMap(b => b.exercises) ?? [])
const position = computed(() => dayExercises.value.findIndex(e => e.exercise.slug === slug.value))
const slot = computed(() => dayExercises.value[position.value] ?? null)

// Semana fija en 1 en Fase 3 (sin logs, no interactiva). Ver ticket 3.
const scheme = computed<RoutineExerciseScheme | null>(
  () => slot.value?.schemes.find(s => s.weekNumber === 1) ?? slot.value?.schemes[0] ?? null,
)

const dayTitle = computed(() =>
  day.value ? (day.value.label ?? t('plan.dayLabel', { number: day.value.dayNumber })) : '',
)

const eyebrow = computed(() => {
  if (!day.value) return ''
  const parts = [t('plan.dayLabel', { number: day.value.dayNumber })]
  if (day.value.label) parts.push(day.value.label)
  parts.push(
    t('plan.exercise.positionLabel', { n: position.value + 1, total: dayExercises.value.length }),
  )
  return parts.join(' · ')
})

const exerciseName = computed(() => (slot.value ? localizedName(slot.value.exercise) : ''))

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

useHead({ title: () => exerciseName.value || t('plan.title') })

function formatRest(seconds: number | null): string {
  if (seconds === null) return ''
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`
}
</script>

<template>
  <div class="space-y-5">
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
      <header class="space-y-0.5">
        <p class="text-primary text-xs font-semibold tracking-widest uppercase">{{ eyebrow }}</p>
        <h1 class="font-logo text-4xl leading-none tracking-wide uppercase">{{ exerciseName }}</h1>
        <p v-if="scheme" class="text-muted pt-1 text-sm">
          {{ t('plan.exercise.setSummary', { current: 1, total: scheme.sets, reps: scheme.reps }) }}
        </p>
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

      <!-- Estático / Fase 5: peso, "la vez pasada", chips de serie y "Completar serie" son
           escritura del cliente (workout_logs). Se muestran no accionables para previsualizar. -->
      <div v-if="scheme" class="space-y-4">
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="text-dimmed mb-1 text-[10px] font-semibold tracking-widest uppercase">
              {{ t('plan.exercise.weight') }}
            </p>
            <p class="font-logo text-5xl leading-none">
              <span class="text-dimmed">—</span><small class="text-muted ml-1 text-xl">kg</small>
            </p>
          </div>
          <div class="text-right">
            <p class="text-dimmed mb-1 text-[10px] font-semibold tracking-widest uppercase">
              {{ t('plan.exercise.reps') }}
            </p>
            <p class="font-logo text-macross-bronze-soft text-5xl leading-none">
              {{ scheme.reps }}
            </p>
          </div>
        </div>

        <div class="text-dimmed flex items-center gap-1.5 text-xs">
          <UIcon name="i-lucide-rotate-ccw" class="size-3.5 shrink-0" />
          {{ t('plan.exercise.lastTime') }}:
          <span class="text-muted font-semibold">{{ t('plan.exercise.noRecord') }}</span>
        </div>

        <div class="flex gap-2">
          <div
            v-for="n in scheme.sets"
            :key="n"
            class="bg-macross-gray-950 ring-accented text-muted flex-1 rounded-sm py-2.5 text-center text-sm font-semibold ring-1"
          >
            {{ n }}
          </div>
        </div>

        <UButton size="xl" color="primary" block>{{ t('plan.exercise.completeSet') }}</UButton>
      </div>

      <div
        v-if="(scheme && scheme.restSeconds !== null) || slot.notes"
        class="border-default space-y-3 border-t pt-4"
      >
        <div v-if="scheme && scheme.restSeconds !== null" class="flex items-center gap-2 text-sm">
          <UIcon name="i-lucide-timer" class="text-dimmed size-4 shrink-0" />
          <span class="text-muted">{{ t('plan.exercise.rest') }}</span>
          <span class="text-default ml-auto font-semibold tabular-nums">
            {{ formatRest(scheme.restSeconds) }}
          </span>
        </div>
        <div v-if="slot.notes">
          <p class="text-dimmed mb-1 text-[10px] font-semibold tracking-widest uppercase">
            {{ t('plan.exercise.notes') }}
          </p>
          <p class="text-default text-sm whitespace-pre-line">{{ slot.notes }}</p>
        </div>
      </div>
    </template>
  </div>
</template>
