<script setup lang="ts">
import type { Exercise } from '@macross/shared'

import type { BuilderExercise, BuilderScheme } from './types'

interface RoutineBuilderExerciseProps {
  exercise: BuilderExercise
  index: number
  weeks: number
  startWeek: number
  options: Exercise[]
}

interface RoutineBuilderExerciseEmits {
  remove: []
}

const { exercise, index, options, startWeek, weeks } = defineProps<RoutineBuilderExerciseProps>()
const emit = defineEmits<RoutineBuilderExerciseEmits>()

const { t, locale } = useI18n()
const { localizedName } = useLocalizedName()

const editingWeek = ref<number | null>(null)
const open = ref(true)

const nameKey = computed(() => (locale.value === 'en' ? 'nameEn' : 'nameEs'))
const blockLetter = computed(() => String.fromCharCode(65 + index))

const selected = computed<Exercise | undefined>({
  get: () => options.find(o => o.id === exercise.exercise?.id),
  set: val => {
    exercise.exercise = val ? { id: val.id, nameEs: val.nameEs, nameEn: val.nameEn } : null
  },
})

const summaryName = computed(() =>
  exercise.exercise ? localizedName(exercise.exercise) : t('routines.builder.noExercise'),
)

// Sin scheme para esa semana la celda no aplica: el ejercicio se agregó cuando la semana ya estaba
// cerrada. Se recorre el rango y se busca, igual que el desarme del server.
const cells = computed(() =>
  Array.from({ length: weeks }, (_, i) => {
    const week = i + 1
    return { week, scheme: exercise.schemes.find(scheme => scheme.weekNumber === week) }
  }),
)

let snapshot: BuilderScheme | null = null

function isLocked(scheme: BuilderScheme) {
  return isSchemeLocked(scheme, startWeek)
}

function lockReason(scheme: BuilderScheme) {
  return scheme.trainedSets > 0
    ? t('routines.builder.lockedTrained')
    : t('routines.builder.lockedPast')
}

function cellPreview(scheme: BuilderScheme) {
  return `${scheme.sets}×${scheme.reps || '—'}`
}

function toggleCell(scheme: BuilderScheme, isOpen: boolean) {
  editingWeek.value = isOpen ? scheme.weekNumber : null
  snapshot = isOpen ? { ...scheme } : null
}

function cancelCell(scheme: BuilderScheme) {
  if (snapshot) Object.assign(scheme, snapshot)
  editingWeek.value = null
}

// Un ejercicio nuevo nace con las N semanas en blanco y el día no se puede guardar hasta llenarlas:
// sin esto, cargar una prescripción que no progresa cuesta cuatro popovers.
function applyToRest(scheme: BuilderScheme) {
  for (const target of exercise.schemes) {
    if (target.weekNumber <= scheme.weekNumber || isLocked(target)) continue
    target.sets = scheme.sets
    target.reps = scheme.reps
    target.restSeconds = scheme.restSeconds
  }
  editingWeek.value = null
}
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
        <!-- superset/dropset llegan con las agrupaciones -->
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
                <td v-for="{ week, scheme } in cells" :key="week" class="px-2 py-1.5 text-center">
                  <UTooltip
                    v-if="!scheme"
                    :text="t('routines.builder.notApplicable', { n: startWeek })"
                  >
                    <span
                      class="text-dimmed bg-macross-gray-950 ring-accented font-logo inline-flex min-w-13 cursor-not-allowed justify-center rounded-sm px-2.5 py-2 text-lg leading-none ring ring-inset"
                    >
                      —
                    </span>
                  </UTooltip>
                  <UTooltip v-else-if="isLocked(scheme)" :text="lockReason(scheme)">
                    <span
                      class="text-dimmed bg-macross-gray-950 ring-accented font-logo inline-flex min-w-13 cursor-not-allowed items-center justify-center gap-1 rounded-sm px-2.5 py-2 text-lg leading-none ring ring-inset"
                    >
                      <UIcon name="i-lucide-lock" class="size-3" />
                      {{ cellPreview(scheme) }}
                    </span>
                  </UTooltip>
                  <UPopover
                    v-else
                    :open="editingWeek === scheme.weekNumber"
                    @update:open="isOpen => toggleCell(scheme, isOpen)"
                  >
                    <span
                      class="bg-macross-gray-950 font-logo inline-flex min-w-13 cursor-pointer justify-center rounded-sm px-2.5 py-2 text-lg leading-none ring transition-colors ring-inset"
                      :class="
                        editingWeek === scheme.weekNumber
                          ? 'text-macross-bronze-soft ring-primary'
                          : 'text-highlighted ring-accented hover:ring-primary'
                      "
                    >
                      {{ cellPreview(scheme) }}
                    </span>

                    <template #content>
                      <div class="w-60 space-y-3 p-3">
                        <p class="text-primary text-[10px] font-semibold tracking-widest uppercase">
                          {{
                            t('routines.builder.cellHeader', {
                              name: summaryName,
                              n: scheme.weekNumber,
                            })
                          }}
                        </p>
                        <div class="flex items-center justify-between gap-3">
                          <span class="text-muted text-xs">{{ t('routines.builder.sets') }}</span>
                          <UInputNumber v-model="scheme.sets" :min="1" size="sm" class="w-28" />
                        </div>
                        <div class="flex items-center justify-between gap-3">
                          <span class="text-muted text-xs">{{ t('routines.builder.reps') }}</span>
                          <UInput
                            v-model="scheme.reps"
                            :placeholder="t('routines.builder.repsPlaceholder')"
                            size="sm"
                            class="w-28"
                          />
                        </div>
                        <div class="flex items-center justify-between gap-3">
                          <span class="text-muted text-xs">{{ t('routines.builder.rest') }}</span>
                          <UInputNumber
                            v-model="scheme.restSeconds"
                            :min="0"
                            :placeholder="t('routines.builder.restPlaceholder')"
                            size="sm"
                            class="w-28"
                          />
                        </div>
                        <UButton
                          :label="t('routines.builder.applyToRest')"
                          icon="i-lucide-arrow-right-to-line"
                          color="neutral"
                          variant="ghost"
                          size="xs"
                          block
                          :disabled="scheme.weekNumber >= weeks"
                          @click="applyToRest(scheme)"
                        />
                        <div class="flex gap-2">
                          <UButton
                            :label="t('common.actions.cancel')"
                            color="neutral"
                            variant="ghost"
                            size="xs"
                            block
                            @click="cancelCell(scheme)"
                          />
                          <UButton
                            :label="t('routines.builder.cellDone')"
                            color="primary"
                            size="xs"
                            block
                            @click="editingWeek = null"
                          />
                        </div>
                      </div>
                    </template>
                  </UPopover>
                </td>
              </tr>
            </tbody>
          </table>
          <UInputMenu
            v-model="selected"
            :items="options"
            by="id"
            :label-key="nameKey"
            :placeholder="t('routines.builder.exercisePlaceholder')"
            icon="i-lucide-search"
            class="w-full"
          />
          <div v-if="selected" class="flex justify-end">
            <UCheckbox
              v-model="exercise.optional"
              :label="t('routines.builder.optional')"
              :ui="{ icon: 'size-3' }"
            />
          </div>
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
