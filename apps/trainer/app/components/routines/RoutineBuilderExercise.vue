<script setup lang="ts">
import type { Exercise } from '@macross/shared'

import type { BuilderExercise } from '@/types/routine-builder'

interface RoutineBuilderExerciseProps {
  exercise: BuilderExercise
  index: number
  weeks: number
  options: Exercise[]
}

interface RoutineBuilderExerciseEmits {
  remove: []
}

const { exercise, index, options } = defineProps<RoutineBuilderExerciseProps>()
const emit = defineEmits<RoutineBuilderExerciseEmits>()

const { t, locale } = useI18n()
const { localizedName } = useLocalizedName()

const open = ref(true)
const nameKey = computed(() => (locale.value === 'en' ? 'nameEn' : 'nameEs'))
const blockLetter = computed(() => String.fromCharCode(65 + index))

const selected = computed<Exercise | undefined>({
  get: () => options.find(o => o.id === exercise.exercise?.id),
  set: val => {
    exercise.exercise = val ? { id: val.id, nameEs: val.nameEs, nameEn: val.nameEn } : null
  },
})

// Matriz-espejo: una sola prescripción reflejada igual en las N semanas. El popover por-celda se libera en Fase 4.
const cellPreview = computed(() => `${exercise.sets}×${exercise.reps || '—'}`)
const summaryName = computed(() =>
  exercise.exercise ? localizedName(exercise.exercise) : t('routines.builder.noExercise'),
)
</script>

<template>
  <div class="border-default overflow-hidden rounded-lg border">
    <UCollapsible v-model:open="open" :unmount-on-hide="false">
      <div
        class="bg-primary/8 flex cursor-pointer items-center gap-2.5 px-3 py-2"
        :class="open ? 'border-default border-b' : ''"
      >
        <UIcon
          :name="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
          class="text-dimmed size-4"
        />
        <span class="font-logo text-primary text-lg leading-none">{{ blockLetter }}</span>
        <!-- superset/dropset se liberan en Fase 4 -->
        <div
          class="bg-macross-gray-950 ring-accented inline-flex gap-1 rounded-sm p-0.5 ring ring-inset"
          @click.stop
        >
          <UButton
            :label="t('routines.builder.blockTypes.single')"
            color="primary"
            variant="solid"
            size="sm"
            class="h-8 rounded-sm px-3.5"
          />
          <UButton
            :label="t('routines.builder.blockTypes.superset')"
            color="neutral"
            variant="ghost"
            size="sm"
            class="h-8 rounded-sm px-3.5"
            disabled
          />
          <UButton
            :label="t('routines.builder.blockTypes.dropset')"
            color="neutral"
            variant="ghost"
            size="sm"
            class="h-8 rounded-sm px-3.5"
            disabled
          />
        </div>
        <UButton
          class="ml-auto"
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          @click.stop="emit('remove')"
        />
      </div>

      <template #content>
        <div class="space-y-3 p-3">
          <table v-if="selected" class="w-full text-sm">
            <thead>
              <tr class="text-dimmed text-[10px] uppercase">
                <th class="px-2 py-1.5" />
                <th v-for="w in weeks" :key="w" class="px-2 py-1.5 text-center font-semibold">
                  {{ t('routines.builder.week', { n: w }) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-highlighted px-2 py-1.5 font-semibold">{{ summaryName }}</td>
                <td v-for="w in weeks" :key="w" class="px-2 py-1.5 text-center">
                  <span
                    class="text-highlighted bg-macross-gray-950 ring-accented inline-flex rounded px-2.5 py-1 font-semibold ring ring-inset"
                  >
                    {{ cellPreview }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <USelectMenu
            v-model="selected"
            :items="options"
            by="id"
            :label-key="nameKey"
            :placeholder="t('routines.builder.exercisePlaceholder')"
            icon="i-lucide-search"
            class="w-full"
          />
          <div v-if="selected" class="flex flex-wrap items-end gap-3">
            <UFormField :label="t('routines.builder.sets')">
              <UInputNumber v-model="exercise.sets" :min="1" class="w-24" />
            </UFormField>
            <UFormField :label="t('routines.builder.reps')">
              <UInput
                v-model="exercise.reps"
                :placeholder="t('routines.builder.repsPlaceholder')"
                class="w-28"
              />
            </UFormField>
            <UFormField :label="t('routines.builder.rest')">
              <UInput
                v-model="exercise.restSeconds"
                :placeholder="t('routines.builder.restPlaceholder')"
                class="w-32"
              />
            </UFormField>
            <UCheckbox
              v-model="exercise.optional"
              :label="t('routines.builder.optional')"
              class="ml-auto"
            />
          </div>
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
