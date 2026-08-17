<script setup lang="ts">
import type { RoutineDay } from '@macross/shared'

const { t } = useI18n()

definePageMeta({
  middleware: 'auth',
  title: 'plan.title',
})

const { routine, loading } = useGetActiveRoutine()
const { currentWeek, isPhaseDone, setWeek, suggestedDay, week } = usePlanCursor()

useHead({ title: t('plan.title') })

function exercisesText(day: RoutineDay): string {
  const count = dayExercises(day, week.value).length
  return count === 1 ? t('plan.exerciseOne', { count }) : t('plan.exerciseMany', { count })
}

function dayDone(day: RoutineDay): boolean {
  return isDayDone(day, week.value)
}

function isSuggested(day: RoutineDay): boolean {
  return day.nanoId === suggestedDay.value?.nanoId
}

// La elegida gana sobre las demás: sin eso, espiar la semana 4 y estar en la 4 se ven igual.
function weekButton(value: number): WeekButton {
  if (value === week.value) return { color: 'primary', variant: 'solid' }
  if (isWeekDone(routine.value, value)) return { color: 'secondary', variant: 'soft' }
  if (value === currentWeek.value) return { color: 'primary', variant: 'soft' }
  return { color: 'neutral', variant: 'outline' }
}

type WeekButton = {
  color: 'primary' | 'secondary' | 'neutral'
  variant: 'solid' | 'soft' | 'outline'
}
</script>

<template>
  <div class="space-y-5">
    <header class="space-y-0.5">
      <p class="text-dimmed text-sm">{{ t('plan.title') }}</p>
      <template v-if="routine">
        <h1 class="font-logo text-4xl leading-none tracking-wide uppercase">{{ routine.name }}</h1>
        <p class="text-muted pt-1 text-sm">
          {{ t('plan.meta', { week, weeks: routine.weeks, days: routine.days?.length ?? 0 }) }}
        </p>
      </template>
    </header>

    <div v-if="routine" class="bg-muted ring-accented space-y-2 rounded-md p-3 ring-1">
      <p class="text-dimmed text-[10px] font-semibold tracking-widest uppercase">
        {{ t('plan.weekPicker') }}
      </p>
      <div class="grid grid-cols-4 gap-2">
        <UButton
          v-for="n in routine.weeks"
          :key="n"
          :label="String(n)"
          v-bind="weekButton(n)"
          size="lg"
          class="font-logo justify-center text-xl"
          @click="setWeek(n)"
        />
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div
        v-for="n in 4"
        :key="n"
        class="bg-muted ring-accented h-18 animate-pulse rounded-md ring-1"
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

    <template v-else>
      <div
        v-if="isPhaseDone"
        class="bg-secondary/8 ring-secondary/30 space-y-1 rounded-md p-5 text-center ring-1"
      >
        <UIcon name="i-lucide-party-popper" class="text-secondary size-7" />
        <p class="text-secondary font-semibold">{{ t('plan.phaseDone.title') }}</p>
        <p class="text-muted text-sm">
          {{ t('plan.phaseDone.description', { weeks: routine.weeks }) }}
        </p>
      </div>

      <div class="space-y-3">
        <NuxtLink
          v-for="day in routine.days"
          :key="day.nanoId"
          :to="`/plan/${day.nanoId}`"
          :class="[
            'bg-muted flex items-center gap-3.5 rounded-md p-3.5 ring-1 transition-colors',
            dayDone(day) ? 'opacity-70' : '',
            isSuggested(day) ? 'ring-primary' : 'ring-accented hover:ring-primary',
          ]"
        >
          <span
            :class="[
              'ring-accented font-logo flex size-12 shrink-0 items-center justify-center rounded-sm text-2xl ring-1',
              dayDone(day)
                ? 'bg-secondary/12 text-secondary'
                : 'from-macross-gray-700 to-macross-gray-950 text-macross-bronze-soft bg-linear-to-br',
            ]"
          >
            <UIcon v-if="dayDone(day)" name="i-lucide-check" class="size-5" />
            <template v-else>{{ day.dayNumber }}</template>
          </span>
          <div class="min-w-0 flex-1">
            <p class="flex items-center gap-2">
              <span class="text-default truncate font-semibold">
                {{ t('plan.dayLabel', { number: day.dayNumber })
                }}<template v-if="day.label"> · {{ day.label }}</template>
              </span>
              <UBadge
                v-if="isSuggested(day)"
                :label="t('plan.dayTodo')"
                color="primary"
                size="sm"
                class="shrink-0"
              />
            </p>
            <p :class="['text-sm', dayDone(day) ? 'text-secondary' : 'text-muted']">
              {{ dayDone(day) ? t('plan.dayCompleted') : exercisesText(day) }}
            </p>
          </div>
          <UIcon
            v-if="!dayDone(day)"
            name="i-lucide-chevron-right"
            class="text-dimmed size-5 shrink-0"
          />
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
