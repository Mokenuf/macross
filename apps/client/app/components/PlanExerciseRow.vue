<script setup lang="ts">
import type { RoutineExercise } from '@macross/shared'

interface PlanExerciseRowProps {
  exercise: RoutineExercise
  to: string
  flat?: boolean
}

const { exercise, flat = false } = defineProps<PlanExerciseRowProps>()

const { localizedName } = useLocalizedName()
const { t } = useI18n()

const scheme = computed(() => currentScheme(exercise))
const completedSets = computed(() => completedSetCount(exercise))
const isDone = computed(() => isExerciseDone(exercise))

const prescription = computed(() =>
  scheme.value ? `${scheme.value.sets} × ${scheme.value.reps}` : '—',
)

const rest = computed(() => {
  const seconds = scheme.value?.restSeconds
  if (!seconds) return null
  return seconds < 60
    ? t('plan.restShort', { rest: `${seconds} s` })
    : t('plan.restShort', { rest: `${Math.round(seconds / 60)} min` })
})
</script>

<template>
  <NuxtLink
    :to="to"
    :class="[
      'flex items-center gap-3 transition-colors',
      flat
        ? 'border-default hover:bg-elevated/50 border-b px-3.5 py-3 last:border-b-0'
        : 'bg-muted ring-accented hover:ring-primary rounded-md p-3 ring-1',
      isDone ? 'opacity-70' : '',
    ]"
  >
    <span
      :class="[
        'ring-accented grid size-11 shrink-0 place-items-center rounded-sm ring-1',
        isDone
          ? 'bg-secondary/12 text-secondary'
          : 'from-macross-gray-800 to-macross-gray-950 text-primary bg-linear-to-br',
      ]"
    >
      <UIcon :name="isDone ? 'i-lucide-check' : 'i-lucide-dumbbell'" class="size-4.5" />
    </span>

    <div class="min-w-0 flex-1">
      <p class="flex items-center gap-2">
        <span
          :class="['truncate font-semibold', isDone ? 'text-muted line-through' : 'text-default']"
        >
          {{ localizedName(exercise.exercise) }}
        </span>
        <UBadge v-if="exercise.optional" :label="t('plan.optional')" size="sm" class="shrink-0" />
      </p>
      <p :class="['text-sm', isDone ? 'text-secondary' : 'text-muted']">
        <template v-if="isDone">{{ t('plan.exercise.completed') }} · {{ prescription }}</template>
        <template v-else>
          {{ prescription }}
          <span v-if="rest" class="text-macross-primary-300 font-semibold">· {{ rest }}</span>
          <span v-if="completedSets > 0" class="text-dimmed tabular-nums">
            · {{ completedSets }}/{{ scheme?.sets }}
          </span>
        </template>
      </p>
    </div>

    <UIcon v-if="!isDone" name="i-lucide-chevron-right" class="text-dimmed size-5 shrink-0" />
  </NuxtLink>
</template>
