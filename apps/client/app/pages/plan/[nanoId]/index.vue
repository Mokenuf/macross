<script setup lang="ts">
import type { RoutineBlock } from '@macross/shared'

const route = useRoute()
const { t } = useI18n()

definePageMeta({
  middleware: 'auth',
})

const { routine, loading } = useGetActiveRoutine()
const { week } = usePlanCursor()

const nanoId = computed(() => String(route.params.nanoId))
const day = computed(() => routine.value?.days?.find(d => d.nanoId === nanoId.value) ?? null)
const heroTitle = computed(() =>
  day.value ? (day.value.label ?? t('plan.dayLabel', { number: day.value.dayNumber })) : '',
)
const blocks = computed(() => (day.value ? weekBlocks(day.value, week.value) : []))
const exercises = computed(() => blocks.value.flatMap(block => block.exercises))

// El ejercicio en curso es el próximo paso pendiente por ronda, no el primero de la lista.
const nextExercise = computed(() =>
  day.value
    ? (nextPendingStep(sessionSteps(day.value, week.value), week.value)?.exercise ?? null)
    : null,
)

const hasProgress = computed(() => exercises.value.some(e => completedSetCount(e, week.value) > 0))

useHead({ title: () => heroTitle.value || t('plan.title') })

function blockLetter(index: number): string {
  return String.fromCharCode(65 + index)
}

function roundsLabel(block: RoutineBlock): string {
  const rounds = blockSchemeForWeek(block, week.value)
  if (!rounds) return ''
  const parts = [t('plan.roundsShort', { count: rounds.sets })]
  if (rounds.restSeconds)
    parts.push(t('plan.restShort', { rest: formatSeconds(rounds.restSeconds) }))
  return parts.join(' · ')
}

function exercisesText(count: number): string {
  return count === 1 ? t('plan.exerciseOne', { count }) : t('plan.exerciseMany', { count })
}
</script>

<template>
  <div>
    <div class="bg-background sticky top-0 z-20 -mx-5 px-5 pt-1 pb-3">
      <NuxtLink
        to="/plan"
        class="text-muted hover:text-default inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <UIcon name="i-lucide-chevron-left" class="size-4" />
        {{ t('plan.title') }}
      </NuxtLink>
      <template v-if="day">
        <p class="text-primary pt-2 text-xs font-semibold tracking-widest uppercase">
          {{ t('plan.dayLabel', { number: day.dayNumber }) }} ·
          {{ t('plan.weekShort', { number: week }) }}
        </p>
        <h1 class="font-logo text-4xl leading-none tracking-wide uppercase">{{ heroTitle }}</h1>
        <p class="text-muted pt-1 text-sm">{{ exercisesText(exercises.length) }}</p>
      </template>
    </div>

    <div v-if="loading" class="space-y-3 pt-2">
      <div
        v-for="n in 4"
        :key="n"
        class="bg-muted ring-accented h-18 animate-pulse rounded-md ring-1"
      />
    </div>

    <div v-else-if="!day" class="bg-muted ring-accented mt-2 rounded-md p-6 text-center ring-1">
      <p class="text-default font-semibold">{{ t('plan.dayNotFound') }}</p>
    </div>

    <template v-else>
      <div class="space-y-3 pt-1 pb-2">
        <template v-for="(block, bi) in blocks" :key="block.id">
          <div
            v-if="block.type !== 'single'"
            class="ring-accented overflow-hidden rounded-md ring-1"
          >
            <div
              class="bg-primary/8 border-default flex items-center gap-2.5 border-b px-3.5 py-2.5"
            >
              <span class="font-logo text-primary text-lg leading-none">{{ blockLetter(bi) }}</span>
              <span class="text-dimmed text-[10.5px] font-semibold tracking-widest uppercase">
                {{ t(`plan.blockTypes.${block.type}`) }}
              </span>
              <span class="text-macross-primary-300 ml-auto text-xs font-semibold">
                {{ roundsLabel(block) }}
              </span>
            </div>
            <PlanExerciseRow
              v-for="exercise in block.exercises"
              :key="exercise.id"
              :block="block"
              :exercise="exercise"
              :to="`/plan/${nanoId}/${exercise.nanoId}`"
              :week="week"
              flat
            />
            <PlanNote
              v-if="block.notes"
              :label="t('plan.notes.block')"
              :text="block.notes"
              class="px-3.5 py-3"
            />
          </div>

          <template v-else>
            <PlanExerciseRow
              v-for="exercise in block.exercises"
              :key="exercise.id"
              :block="block"
              :exercise="exercise"
              :to="`/plan/${nanoId}/${exercise.nanoId}`"
              :week="week"
            />
            <PlanNote
              v-if="block.notes"
              :label="t('plan.notes.block')"
              :text="block.notes"
              class="px-3.5"
            />
          </template>
        </template>
      </div>

      <div
        v-if="exercises.length"
        class="bg-background/70 sticky bottom-0 z-20 -mx-5 px-5 py-8 backdrop-blur-md"
      >
        <UButton
          v-if="nextExercise"
          :to="`/plan/${nanoId}/${nextExercise.nanoId}`"
          :label="hasProgress ? t('plan.continueWorkout') : t('plan.startWorkout')"
          size="xl"
          block
          leading-icon="i-lucide-play"
        />
        <div
          v-else
          class="bg-secondary/8 ring-secondary/30 text-secondary flex items-center justify-center gap-2 rounded-md py-3.5 font-semibold ring-1"
        >
          <UIcon name="i-lucide-circle-check" class="size-5" />
          {{ t('plan.workoutDone') }}
        </div>
      </div>
    </template>
  </div>
</template>
