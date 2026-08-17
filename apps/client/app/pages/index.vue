<script setup lang="ts">
const { t } = useI18n()

definePageMeta({
  middleware: 'auth',
  title: 'common.home.title',
})

const { routine, loading } = useGetActiveRoutine()
const { isPhaseDone, suggestedDay, week } = usePlanCursor()
const { profile } = useGetProfile()

const firstName = computed(() => profile.value?.fullName.split(' ')[0] ?? '')

const dayTitle = computed(() => {
  const day = suggestedDay.value
  if (!day) return ''
  const label = t('plan.dayLabel', { number: day.dayNumber })
  return day.label ? `${label} · ${day.label}` : label
})

const dayMeta = computed(() => {
  const day = suggestedDay.value
  if (!day || !routine.value) return ''
  const count = dayExercises(day, week.value).length
  return [
    routine.value.name,
    t('plan.weekShort', { number: week.value }),
    count === 1 ? t('plan.exerciseOne', { count }) : t('plan.exerciseMany', { count }),
  ].join(' · ')
})

useHead({ title: t('common.home.title') })
</script>

<template>
  <div class="space-y-5">
    <header class="space-y-0.5">
      <p class="text-dimmed text-sm">
        {{ t('common.home.greeting') }}<template v-if="firstName">, {{ firstName }}</template> 👋
      </p>
      <template v-if="routine && suggestedDay">
        <p class="text-primary pt-1 text-xs font-semibold tracking-widest uppercase">
          {{ t('common.home.todayLabel') }}
        </p>
        <h1 class="font-logo text-4xl leading-none tracking-wide uppercase">{{ dayTitle }}</h1>
        <p class="text-muted pt-1 text-sm">{{ dayMeta }}</p>
      </template>
    </header>

    <div v-if="loading" class="bg-muted ring-accented h-28 animate-pulse rounded-xl ring-1" />

    <template v-else-if="routine">
      <div
        v-if="isPhaseDone"
        class="bg-secondary/8 ring-secondary/30 space-y-1 rounded-xl p-5 text-center ring-1"
      >
        <UIcon name="i-lucide-party-popper" class="text-secondary size-7" />
        <p class="text-secondary font-semibold">{{ t('plan.phaseDone.title') }}</p>
        <p class="text-muted text-sm">
          {{ t('plan.phaseDone.description', { weeks: routine.weeks }) }}
        </p>
      </div>

      <div class="space-y-2.5">
        <UButton
          v-if="suggestedDay"
          :label="
            t('common.home.startDay', {
              day: t('plan.dayLabel', { number: suggestedDay.dayNumber }),
            })
          "
          :to="`/plan/${suggestedDay.nanoId}`"
          size="xl"
          block
          leading-icon="i-lucide-play"
        />
        <UButton
          :label="t('common.home.viewPlan')"
          to="/plan"
          color="neutral"
          variant="outline"
          size="xl"
          block
          trailing-icon="i-lucide-arrow-right"
        />
      </div>
    </template>

    <div v-else class="bg-muted ring-accented space-y-2 rounded-xl p-6 text-center ring-1">
      <UIcon name="i-lucide-clipboard-list" class="text-dimmed size-8" />
      <p class="text-default font-semibold">{{ t('plan.empty.title') }}</p>
      <p class="text-muted text-sm">{{ t('plan.empty.description') }}</p>
    </div>
  </div>
</template>
