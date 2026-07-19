<script setup lang="ts">
import type { Routine, RoutineBlock, RoutineExercise } from '@macross/shared'

interface RoutineDetailProps {
  routine: Routine
}

const { routine } = defineProps<RoutineDetailProps>()

const { t } = useI18n()
const { localizedName } = useLocalizedName()

const activeDay = ref(0)

const days = computed(() => routine.days ?? [])
const currentDay = computed(() => days.value[activeDay.value])

function selectDay(index: number) {
  activeDay.value = index
}

function blockLetter(index: number) {
  return String.fromCharCode(65 + index)
}

function dayExerciseCount(blocks: RoutineBlock[]) {
  return blocks.reduce((total, block) => total + block.exercises.length, 0)
}

function schemeCell(exercise: RoutineExercise, week: number) {
  const scheme = exercise.schemes.find(s => s.weekNumber === week)
  return scheme ? `${scheme.sets}×${scheme.reps}` : '—'
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="routine.notes" class="border-default bg-elevated/40 rounded-lg border p-4">
      <p class="text-muted text-sm whitespace-pre-line">{{ routine.notes }}</p>
    </div>

    <BaseEmptyState v-if="days.length === 0" :message="t('routines.detail.noDays')" />

    <template v-else>
      <div
        class="bg-macross-gray-950 ring-accented inline-flex flex-wrap gap-1 rounded-sm p-0.5 ring ring-inset"
      >
        <UButton
          v-for="(day, i) in days"
          :key="day.id"
          :label="t('routines.builder.day', { n: day.dayNumber })"
          :color="activeDay === i ? 'primary' : 'neutral'"
          :variant="activeDay === i ? 'solid' : 'ghost'"
          size="sm"
          class="h-8 rounded-sm px-3.5"
          @click="selectDay(i)"
        />
      </div>

      <div v-if="currentDay" class="space-y-3.5">
        <div class="flex items-center gap-3">
          <span class="text-primary text-[11px] font-semibold tracking-wider uppercase">
            {{ t('routines.builder.day', { n: currentDay.dayNumber })
            }}<template v-if="currentDay.label"> · {{ currentDay.label }}</template>
          </span>
          <span class="text-dimmed ml-auto text-xs">
            {{
              t('routines.detail.blocksExercises', {
                blocks: currentDay.blocks.length,
                exercises: dayExerciseCount(currentDay.blocks),
              })
            }}
          </span>
        </div>

        <div
          v-for="(block, bi) in currentDay.blocks"
          :key="block.id"
          class="border-default overflow-hidden rounded-lg border"
        >
          <div class="border-default bg-primary/8 flex items-center gap-2.5 border-b px-3 py-2">
            <span class="font-logo text-primary text-lg leading-none">{{ blockLetter(bi) }}</span>
            <BaseBadge :label="t(`routines.builder.blockTypes.${block.type}`)" color="primary" />
          </div>

          <div class="overflow-x-auto p-3">
            <table class="w-full table-fixed text-sm">
              <thead>
                <tr class="text-dimmed text-[10px] uppercase">
                  <th class="w-2/5 px-2 py-1.5 text-left font-semibold">
                    {{ t('routines.detail.exercise') }}
                  </th>
                  <th
                    v-for="w in routine.weeks"
                    :key="w"
                    class="px-2 py-1.5 text-center font-semibold"
                  >
                    {{ t('routines.builder.week', { n: w }) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="exercise in block.exercises" :key="exercise.id">
                  <td class="px-2 py-1.5">
                    <div class="flex items-center gap-2">
                      <NuxtLink
                        :to="`/exercises/${exercise.exercise.slug}`"
                        class="text-highlighted hover:text-primary font-semibold transition-colors"
                      >
                        {{ localizedName(exercise.exercise) }}
                      </NuxtLink>
                      <BaseBadge
                        v-if="exercise.optional"
                        :label="t('routines.builder.optional')"
                        color="neutral"
                      />
                    </div>
                  </td>
                  <td v-for="w in routine.weeks" :key="w" class="px-2 py-1.5 text-center">
                    <span
                      class="text-highlighted bg-macross-gray-950 ring-accented font-logo inline-flex min-w-13 justify-center rounded-sm px-2.5 py-2 text-lg leading-none ring ring-inset"
                    >
                      {{ schemeCell(exercise, w) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
