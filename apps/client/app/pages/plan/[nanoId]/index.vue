<script setup lang="ts">
import type { RoutineBlock } from '@macross/shared'

const route = useRoute()
const { t } = useI18n()

definePageMeta({
  middleware: 'auth',
})

const { routine, loading } = useGetActiveRoutine()

const nanoId = computed(() => String(route.params.nanoId))
const day = computed(() => routine.value?.days?.find(d => d.nanoId === nanoId.value) ?? null)
const heroTitle = computed(() =>
  day.value ? (day.value.label ?? t('plan.dayLabel', { number: day.value.dayNumber })) : '',
)
const exercises = computed(() => day.value?.blocks.flatMap(b => b.exercises) ?? [])

// El ejercicio en curso es el primero con series pendientes, no el primero de la lista.
const nextExercise = computed(() => exercises.value.find(e => !isExerciseDone(e)) ?? null)

const hasProgress = computed(() => exercises.value.some(e => completedSetCount(e) > 0))

useHead({ title: () => heroTitle.value || t('plan.title') })

function blockLetter(index: number): string {
  return String.fromCharCode(65 + index)
}

function exercisesText(blocks: RoutineBlock[]): string {
  const count = blocks.reduce((sum, block) => sum + block.exercises.length, 0)
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
          {{ t('plan.dayLabel', { number: day.dayNumber }) }}
        </p>
        <h1 class="font-logo text-4xl leading-none tracking-wide uppercase">{{ heroTitle }}</h1>
        <p class="text-muted pt-1 text-sm">{{ exercisesText(day.blocks) }}</p>
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
        <template v-for="(block, bi) in day.blocks" :key="block.id">
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
            </div>
            <PlanExerciseRow
              v-for="exercise in block.exercises"
              :key="exercise.id"
              :exercise="exercise"
              :to="`/plan/${nanoId}/${exercise.exercise.slug}`"
              flat
            />
          </div>

          <PlanExerciseRow
            v-for="exercise in block.exercises"
            v-else
            :key="exercise.id"
            :exercise="exercise"
            :to="`/plan/${nanoId}/${exercise.exercise.slug}`"
          />
        </template>
      </div>

      <div
        v-if="exercises.length"
        class="bg-background/70 sticky bottom-0 z-20 -mx-5 px-5 py-8 backdrop-blur-md"
      >
        <UButton
          v-if="nextExercise"
          :to="`/plan/${nanoId}/${nextExercise.exercise.slug}`"
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
