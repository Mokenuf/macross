<script setup lang="ts">
import type { RoutineBlock, RoutineExercise } from '@macross/shared'

const route = useRoute()
const { t } = useI18n()
const { localizedName } = useLocalizedName()

definePageMeta({
  middleware: 'auth',
})

const { routine, loading } = useGetActiveRoutine()

const nanoId = computed(() => String(route.params.nanoId))
const day = computed(() => routine.value?.days?.find(d => d.nanoId === nanoId.value) ?? null)
const heroTitle = computed(() =>
  day.value ? (day.value.label ?? t('plan.dayLabel', { number: day.value.dayNumber })) : '',
)
const firstExerciseSlug = computed(
  () => day.value?.blocks.flatMap(b => b.exercises)[0]?.exercise.slug ?? null,
)

useHead({ title: () => heroTitle.value || t('plan.title') })

function blockLetter(index: number): string {
  return String.fromCharCode(65 + index)
}

// Semana fija en 1 en Fase 3 (sin logs, no interactiva). Ver ticket 3.
function prescription(exercise: RoutineExercise): string {
  const scheme = exercise.schemes.find(s => s.weekNumber === 1) ?? exercise.schemes[0]
  return scheme ? `${scheme.sets} × ${scheme.reps}` : '—'
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
          <!-- Bloque agrupado (superserie/dropset/circuito): esqueleto. El builder mínimo de Fase 2 solo produce 'single'. -->
          <div
            v-if="block.type !== 'single'"
            class="ring-accented overflow-hidden rounded-md ring-1"
          >
            <div
              class="bg-primary/8 border-default flex items-center gap-2.5 border-b px-3.5 py-2.5"
            >
              <span class="font-logo text-primary text-xl leading-none">{{ blockLetter(bi) }}</span>
              <span class="text-primary text-[11px] font-semibold tracking-wider uppercase">
                {{ t(`plan.blockTypes.${block.type}`) }}
              </span>
            </div>
            <NuxtLink
              v-for="exercise in block.exercises"
              :key="exercise.id"
              :to="`/plan/${nanoId}/${exercise.exercise.slug}`"
              class="hover:bg-elevated/50 border-default flex items-center gap-3.5 border-b px-3.5 py-3 transition-colors last:border-b-0"
            >
              <div class="min-w-0 flex-1">
                <p class="text-default truncate font-semibold">
                  {{ localizedName(exercise.exercise) }}
                </p>
                <p class="text-muted text-sm">{{ prescription(exercise) }}</p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="text-dimmed size-5 shrink-0" />
            </NuxtLink>
          </div>

          <template v-else>
            <NuxtLink
              v-for="exercise in block.exercises"
              :key="exercise.id"
              :to="`/plan/${nanoId}/${exercise.exercise.slug}`"
              class="bg-muted ring-accented hover:ring-primary flex items-center gap-3.5 rounded-md p-3.5 ring-1 transition-colors"
            >
              <span
                class="from-macross-gray-700 to-macross-gray-950 ring-accented text-macross-bronze-soft font-logo flex size-12 shrink-0 items-center justify-center rounded-sm bg-linear-to-br text-2xl ring-1"
              >
                {{ blockLetter(bi) }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-default truncate font-semibold">
                  {{ localizedName(exercise.exercise) }}
                </p>
                <p class="text-muted text-sm">{{ prescription(exercise) }}</p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="text-dimmed size-5 shrink-0" />
            </NuxtLink>
          </template>
        </template>
      </div>

      <div
        v-if="firstExerciseSlug"
        class="bg-background/70 sticky bottom-0 z-20 -mx-5 px-5 py-8 backdrop-blur-md"
      >
        <UButton
          :to="`/plan/${nanoId}/${firstExerciseSlug}`"
          :label="t('plan.startWorkout')"
          size="xl"
          block
          leading-icon="i-lucide-play"
        />
      </div>
    </template>
  </div>
</template>
