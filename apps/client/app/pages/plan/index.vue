<script setup lang="ts">
import type { RoutineDay } from '@macross/shared'

const { t } = useI18n()

definePageMeta({
  middleware: 'auth',
  title: 'plan.title',
})

const { routine, loading } = useGetActiveRoutine()

useHead({ title: t('plan.title') })

function exercisesText(day: RoutineDay): string {
  const count = day.blocks.reduce((sum, block) => sum + block.exercises.length, 0)
  return count === 1 ? t('plan.exerciseOne', { count }) : t('plan.exerciseMany', { count })
}
</script>

<template>
  <div class="space-y-5">
    <header class="space-y-0.5">
      <p class="text-dimmed text-sm">{{ t('plan.title') }}</p>
      <template v-if="routine">
        <h1 class="font-logo text-4xl leading-none tracking-wide uppercase">{{ routine.name }}</h1>
        <p class="text-muted pt-1 text-sm">
          {{ t('plan.meta', { week: 1, weeks: routine.weeks, days: routine.days?.length ?? 0 }) }}
        </p>
      </template>
    </header>

    <div v-if="loading" class="space-y-3">
      <div
        v-for="n in 4"
        :key="n"
        class="bg-muted ring-accented h-[72px] animate-pulse rounded-md ring-1"
      />
    </div>

    <div
      v-else-if="!routine"
      class="bg-muted ring-accented space-y-2 rounded-md p-6 text-center ring-1"
    >
      <UIcon name="i-lucide-clipboard-list" class="text-dimmed size-8" />
      <p class="text-default font-semibold">{{ t('plan.empty.title') }}</p>
      <p class="text-muted text-sm">{{ t('plan.empty.description') }}</p>
    </div>

    <div v-else class="space-y-3">
      <NuxtLink
        v-for="day in routine.days"
        :key="day.nanoId"
        :to="`/plan/${day.nanoId}`"
        class="bg-muted ring-accented hover:ring-primary flex items-center gap-3.5 rounded-md p-3.5 ring-1 transition-colors"
      >
        <span
          class="from-macross-gray-700 to-macross-gray-950 ring-accented text-macross-bronze-soft font-logo flex size-12 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br text-2xl ring-1"
        >
          {{ day.dayNumber }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-default truncate font-semibold">
            {{ t('plan.dayLabel', { number: day.dayNumber })
            }}<template v-if="day.label"> · {{ day.label }}</template>
          </p>
          <p class="text-muted text-sm">{{ exercisesText(day) }}</p>
        </div>
        <UIcon name="i-lucide-chevron-right" class="text-dimmed size-5 shrink-0" />
      </NuxtLink>
    </div>
  </div>
</template>
