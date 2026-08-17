<script setup lang="ts">
import type { BlockType, Exercise } from '@macross/shared'
import { BlockTypes } from '@macross/shared'

import type { BuilderBlock, BuilderExercise, BuilderScheme } from './types'

interface RoutineBuilderBlockProps {
  block: BuilderBlock
  index: number
  weeks: number
  startWeek: number
  options: Exercise[]
  canGroup: boolean
}

interface RoutineBuilderBlockEmits {
  remove: []
  removeExercise: [number]
  addExercise: []
  group: []
  setType: [BlockType]
}

const { block, canGroup, index, options, startWeek, weeks } =
  defineProps<RoutineBuilderBlockProps>()
const emit = defineEmits<RoutineBuilderBlockEmits>()

const { t, locale } = useI18n()
const { localizedName } = useLocalizedName()

const editing = ref<{ exercise: number; week: number } | null>(null)
const open = ref(true)

const nameKey = computed(() => (locale.value === 'en' ? 'nameEn' : 'nameEs'))
const blockLetter = computed(() => String.fromCharCode(65 + index))
// En un bloque de un solo ejercicio la nota del bloque sería un segundo lugar para escribir lo
// mismo que la nota del ejercicio.
const isGrouped = computed(() => block.exercises.length > 1)

let snapshot: BuilderScheme | null = null

// Sin scheme para esa semana la celda no aplica: el ejercicio se agregó cuando la semana ya estaba
// cerrada. Se recorre el rango y se busca, igual que el desarme del server.
function cells(exercise: BuilderExercise) {
  return Array.from({ length: weeks }, (_, i) => {
    const week = i + 1
    return { week, scheme: exercise.schemes.find(scheme => scheme.weekNumber === week) }
  })
}

function exerciseName(exercise: BuilderExercise) {
  return exercise.exercise ? localizedName(exercise.exercise) : t('routines.builder.noExercise')
}

function selectedExercise(exercise: BuilderExercise) {
  return options.find(option => option.id === exercise.exercise?.id)
}

function selectExercise(exercise: BuilderExercise, value: Exercise | undefined) {
  exercise.exercise = value ? { id: value.id, nameEs: value.nameEs, nameEn: value.nameEn } : null
}

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

function isEditing(exerciseIndex: number, scheme: BuilderScheme) {
  return editing.value?.exercise === exerciseIndex && editing.value.week === scheme.weekNumber
}

function toggleCell(exerciseIndex: number, scheme: BuilderScheme, isOpen: boolean) {
  editing.value = isOpen ? { exercise: exerciseIndex, week: scheme.weekNumber } : null
  snapshot = isOpen ? { ...scheme } : null
}

function cancelCell(scheme: BuilderScheme) {
  if (snapshot) Object.assign(scheme, snapshot)
  editing.value = null
}

// Un ejercicio nuevo nace con las N semanas en blanco y el día no se puede guardar hasta llenarlas:
// sin esto, cargar una prescripción que no progresa cuesta cuatro popovers.
function applyToRest(exercise: BuilderExercise, scheme: BuilderScheme) {
  for (const target of exercise.schemes) {
    if (target.weekNumber <= scheme.weekNumber || isLocked(target)) continue
    target.sets = scheme.sets
    target.reps = scheme.reps
    target.restSeconds = scheme.restSeconds
  }
  editing.value = null
}

const TYPES: BlockType[] = [BlockTypes.single, BlockTypes.superset, BlockTypes.dropset]
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

        <div
          class="bg-macross-gray-950 ring-accented inline-flex gap-1 rounded-sm p-0.5 ring ring-inset"
          @click.stop
        >
          <UButton
            v-for="type in TYPES"
            :key="type"
            :label="t(`routines.builder.blockTypes.${type}`)"
            size="sm"
            :color="block.type === type ? 'primary' : 'neutral'"
            :variant="block.type === type ? 'solid' : 'ghost'"
            class="h-8 rounded-sm px-3.5"
            @click="emit('setType', type)"
          />
        </div>

        <div class="ml-auto flex items-center gap-1" @click.stop>
          <UTooltip :text="t('routines.builder.groupWithNext')">
            <UButton
              icon="i-lucide-combine"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="!canGroup"
              @click="emit('group')"
            />
          </UTooltip>
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            @click="emit('remove')"
          />
        </div>
      </div>

      <template #content>
        <div class="space-y-3 p-3">
          <div class="overflow-x-auto">
            <table class="w-full table-fixed text-sm">
              <thead>
                <tr class="text-dimmed text-[10px] uppercase">
                  <th class="w-2/5 px-2 py-1.5" />
                  <th v-for="w in weeks" :key="w" class="px-2 py-1.5 text-center font-semibold">
                    {{ t('routines.builder.week', { n: w }) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(exercise, ei) in block.exercises" :key="ei">
                  <td class="px-2 py-1.5">
                    <div class="flex items-center gap-1">
                      <UInputMenu
                        :model-value="selectedExercise(exercise)"
                        :items="options"
                        by="id"
                        :label-key="nameKey"
                        variant="none"
                        open-on-click
                        :placeholder="t('routines.builder.exercisePlaceholder')"
                        class="min-w-0 flex-1"
                        @update:model-value="value => selectExercise(exercise, value)"
                      />
                      <UBadge
                        v-if="exercise.optional"
                        :label="t('routines.builder.optional')"
                        color="neutral"
                        size="sm"
                      />
                      <UPopover>
                        <UButton
                          icon="i-lucide-ellipsis-vertical"
                          color="neutral"
                          variant="ghost"
                          size="xs"
                        />
                        <template #content>
                          <div class="w-64 space-y-3 p-3">
                            <p
                              class="text-primary text-[10px] font-semibold tracking-widest uppercase"
                            >
                              {{ exerciseName(exercise) }}
                            </p>
                            <UCheckbox
                              v-model="exercise.optional"
                              :label="t('routines.builder.optional')"
                              :description="t('routines.builder.optionalHint')"
                              :ui="{ icon: 'size-3' }"
                            />
                            <UTextarea
                              v-model="exercise.notes"
                              :rows="2"
                              :placeholder="t('routines.builder.exerciseNotesPlaceholder')"
                              class="w-full"
                            />
                            <UButton
                              :label="t('routines.builder.removeExercise')"
                              icon="i-lucide-trash-2"
                              color="error"
                              variant="ghost"
                              size="xs"
                              block
                              @click="emit('removeExercise', ei)"
                            />
                          </div>
                        </template>
                      </UPopover>
                    </div>
                  </td>
                  <td
                    v-for="{ week, scheme } in cells(exercise)"
                    :key="week"
                    class="px-2 py-1.5 text-center"
                  >
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
                      :open="isEditing(ei, scheme)"
                      @update:open="isOpen => toggleCell(ei, scheme, isOpen)"
                    >
                      <span
                        class="bg-macross-gray-950 font-logo inline-flex min-w-13 cursor-pointer justify-center rounded-sm px-2.5 py-2 text-lg leading-none ring transition-colors ring-inset"
                        :class="
                          isEditing(ei, scheme)
                            ? 'text-macross-bronze-soft ring-primary'
                            : 'text-highlighted ring-accented hover:ring-primary'
                        "
                      >
                        {{ cellPreview(scheme) }}
                      </span>

                      <template #content>
                        <div class="w-60 space-y-3 p-3">
                          <p
                            class="text-primary text-[10px] font-semibold tracking-widest uppercase"
                          >
                            {{
                              t('routines.builder.cellHeader', {
                                name: exerciseName(exercise),
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
                            @click="applyToRest(exercise, scheme)"
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
                              @click="editing = null"
                            />
                          </div>
                        </div>
                      </template>
                    </UPopover>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <UTextarea
            v-if="isGrouped || block.notes"
            v-model="block.notes"
            :rows="1"
            :placeholder="t('routines.builder.blockNotesPlaceholder')"
            class="w-full"
          />

          <UButton
            :label="t('routines.builder.addExerciseToBlock')"
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            size="sm"
            block
            @click="emit('addExercise')"
          />
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
