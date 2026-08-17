<script setup lang="ts">
import {
  type BaseResponse,
  type Client,
  type Exercise,
  type Routine,
  type RoutineExercise,
  type UpdateRoutine,
} from '@macross/shared'
import { insertNodeAt, removeNode, useSortable } from '@vueuse/integrations/useSortable'

import type { BuilderDay, BuilderScheme, RoutineBuilderState } from './types'

interface RoutineWizardProps {
  loading?: boolean
  routine?: Routine
}

interface RoutineWizardEmits {
  submit: [UpdateRoutine]
}

const { loading = false, routine } = defineProps<RoutineWizardProps>()
const emit = defineEmits<RoutineWizardEmits>()

const { t } = useI18n()

const MAX_DAYS = 7
const DEFAULT_DAYS = 3

const isEdit = computed(() => !!routine)
const firstStep = computed(() => (isEdit.value ? 1 : 0))

const startWeek = computed(() => routine?.startWeek ?? 1)
const hasWorkouts = computed(() =>
  (routine?.days ?? [])
    .flatMap(day => day.blocks)
    .flatMap(block => block.exercises)
    .flatMap(slot => slot.schemes)
    .some(scheme => (scheme.trainedSets ?? 0) > 0),
)

const currentStep = ref(routine ? 1 : 0)
const activeDay = ref(0)
const blocksEl = ref<HTMLElement | null>(null)

const state = reactive<RoutineBuilderState>(
  routine
    ? seedFromRoutine(routine)
    : {
        name: '',
        clientId: '',
        weeks: 4,
        notes: '',
        activate: true,
        days: Array.from({ length: DEFAULT_DAYS }, makeDay),
      },
)

const { data: clientsData } = useFetch<BaseResponse<Client>>('/api/clients', {
  key: 'routine-clients',
  query: { limit: 100 },
})
const clients = computed(() => clientsData.value?.rows ?? [])

const { data: exercisesData } = useFetch<BaseResponse<Exercise>>('/api/exercises', {
  key: 'routine-exercises',
  query: { limit: 100 },
})
const exercises = computed(() => exercisesData.value?.rows ?? [])

const steps = computed(() => {
  const all = [
    { title: t('routines.wizard.step1'), icon: 'i-lucide-flag', value: 0 },
    { title: t('routines.wizard.step2'), icon: 'i-lucide-clipboard-list', value: 1 },
    { title: t('routines.wizard.step3'), icon: 'i-lucide-dumbbell', value: 2 },
  ]
  // En edición no hay "punto de partida": se entra directo a datos + builder.
  return isEdit.value ? all.slice(1) : all
})

const selectedClient = computed<Client | undefined>({
  get: () => clients.value.find(c => c.id === state.clientId),
  set: val => {
    state.clientId = val?.id ?? ''
  },
})

const currentDay = computed(() => state.days[activeDay.value])

// useSortable captura la lista una vez y hay un array por día: el getter resuelve al soltar.
const currentBlocks = computed({
  get: () => currentDay.value?.blocks ?? [],
  set: blocks => {
    if (currentDay.value) currentDay.value.blocks = blocks
  },
})

const duplicateTarget = computed(() => nextEmptyDayIndex(state.days, activeDay.value))

const canDuplicateDay = computed(
  () =>
    !!currentDay.value?.blocks.length &&
    (duplicateTarget.value >= 0 || state.days.length < MAX_DAYS),
)

const step1Valid = computed(() => state.name.trim().length > 0 && state.clientId.length > 0)

const canSubmit = computed(() => state.days.every(dayComplete))

useSortable(blocksEl, currentBlocks, {
  handle: '[data-drag-block]',
  animation: 150,
  ghostClass: 'opacity-40',
  // El contenedor está detrás de un v-else: sin esto no engancha en un día recién creado.
  watchElement: true,
  onUpdate: e => {
    if (e.oldIndex == null || e.newIndex == null) return
    // Se revierte el nodo que ya movió Sortable para que Vue quede como única fuente de verdad.
    removeNode(e.item)
    insertNodeAt(e.from, e.item, e.oldIndex)
    moveBlock(e.oldIndex, e.newIndex)
  },
})

// Un slot creado a mitad de fase solo tiene schemes desde la semana en curso, así que las semanas
// sin prescripción se rellenan con la más cercana: la matriz nunca muestra una celda vacía (y esas
// semanas quedan bloqueadas igual, así que el relleno no viaja al server).
function seedSchemes(slot: RoutineExercise, weeks: number): BuilderScheme[] {
  const byWeek = new Map(slot.schemes.map(scheme => [scheme.weekNumber, scheme]))
  const nearest = (week: number) =>
    slot.schemes.toSorted(
      (a, b) => Math.abs(a.weekNumber - week) - Math.abs(b.weekNumber - week),
    )[0]

  return Array.from({ length: weeks }, (_, i) => {
    const week = i + 1
    const scheme = byWeek.get(week)
    const source = scheme ?? nearest(week)

    return makeScheme(week, {
      sets: source?.sets,
      reps: source?.reps,
      restSeconds: source?.restSeconds,
      notes: scheme?.notes ?? undefined,
      trainedSets: scheme?.trainedSets ?? 0,
    })
  })
}

// Los ids de día, bloque y slot viajan de vuelta en el submit: son los que dejan que el PATCH
// empareje filas vivas en vez de reemplazar el árbol y resetearle el progreso al cliente.
function seedFromRoutine(r: Routine): RoutineBuilderState {
  return {
    name: r.name,
    clientId: r.clientId ?? '',
    weeks: r.weeks,
    notes: r.notes ?? '',
    activate: r.active,
    days: (r.days ?? []).map(d => ({
      id: d.id,
      label: d.label ?? '',
      blocks: d.blocks.map(block => ({
        id: block.id,
        type: block.type,
        notes: block.notes ?? '',
        exercises: block.exercises.map(slot => ({
          id: slot.id,
          exercise: {
            id: slot.exercise.id,
            nameEs: slot.exercise.nameEs,
            nameEn: slot.exercise.nameEn,
          },
          optional: slot.optional,
          notes: slot.notes ?? '',
          schemes: seedSchemes(slot, r.weeks),
        })),
      })),
    })),
  }
}

function dayComplete(day: BuilderDay) {
  return isDayComplete(day, startWeek.value)
}

function setDaysCount(n: number) {
  while (state.days.length < n) state.days.push(makeDay())
  while (state.days.length > n) state.days.pop()
  if (activeDay.value > state.days.length - 1) activeDay.value = state.days.length - 1
}

function addDay() {
  if (state.days.length >= MAX_DAYS) return
  state.days.push(makeDay())
  activeDay.value = state.days.length - 1
}

// El día destino conserva su id: es la fila, no el contenido. Reusarla evita retirarla e insertar
// otra por nada (y en edición sería un día vacío que ya existe en la DB).
function duplicateDay() {
  const source = currentDay.value
  if (!source) return

  const target = duplicateTarget.value
  const clone = cloneDay(source, startWeek.value)

  if (target >= 0) {
    state.days[target] = { ...clone, id: state.days[target]?.id }
    activeDay.value = target
    return
  }

  if (state.days.length >= MAX_DAYS) return
  state.days.push(clone)
  activeDay.value = state.days.length - 1
}

function removeDay(index: number) {
  state.days.splice(index, 1)
  if (activeDay.value >= state.days.length) activeDay.value = Math.max(0, state.days.length - 1)
}

function selectDay(index: number) {
  activeDay.value = index
}

function addBlock() {
  currentDay.value?.blocks.push(makeBlock(state.weeks, startWeek.value))
}

function updateBlocks(update: (blocks: BuilderDay['blocks']) => BuilderDay['blocks']) {
  const day = currentDay.value
  if (day) day.blocks = update(day.blocks)
}

function moveBlock(from: number, to: number) {
  updateBlocks(blocks => moveItem(blocks, from, to))
}

function submit() {
  const payload: UpdateRoutine = {
    name: state.name.trim(),
    clientId: state.clientId || undefined,
    daysPerWeek: state.days.length,
    weeks: state.weeks,
    notes: state.notes.trim() || undefined,
    isTemplate: false,
    activate: state.activate,
    days: state.days.map(d => ({
      id: d.id,
      label: d.label.trim() || undefined,
      blocks: d.blocks
        .map(b => ({
          id: b.id,
          type: b.type,
          notes: b.notes.trim() || undefined,
          exercises: b.exercises
            .filter(e => e.exercise)
            .map(e => ({
              id: e.id,
              exerciseId: e.exercise!.id,
              optional: e.optional,
              notes: e.notes.trim() || undefined,
              schemes: e.schemes.map(scheme => ({
                weekNumber: scheme.weekNumber,
                sets: scheme.sets,
                reps: scheme.reps.trim(),
                restSeconds: scheme.restSeconds ?? undefined,
                notes: scheme.notes.trim() || undefined,
              })),
            })),
        }))
        .filter(b => b.exercises.length > 0),
    })),
  }
  emit('submit', payload)
}

function next() {
  if (currentStep.value < 2) currentStep.value += 1
}

function back() {
  if (currentStep.value > firstStep.value) currentStep.value -= 1
}
</script>

<template>
  <div class="space-y-6">
    <UStepper :items="steps" v-model="currentStep" disabled class="w-full" />

    <UAlert
      v-if="hasWorkouts"
      color="warning"
      variant="subtle"
      icon="i-lucide-history"
      :title="t('routines.wizard.inProgressTitle')"
      :description="t('routines.wizard.inProgressHint', { week: startWeek })"
    />

    <!-- Copiar rutina y crear desde template todavía no están disponibles -->
    <div v-if="currentStep === 0" class="grid gap-3 sm:grid-cols-3">
      <div class="border-primary bg-primary/8 flex flex-col gap-1.5 rounded-lg border p-4">
        <UIcon name="i-lucide-plus" class="text-primary size-5" />
        <span class="text-highlighted font-semibold">{{
          t('routines.wizard.startCards.new.title')
        }}</span>
        <span class="text-muted text-sm">{{
          t('routines.wizard.startCards.new.description')
        }}</span>
      </div>
      <div
        class="border-default flex cursor-not-allowed flex-col gap-1.5 rounded-lg border p-4 opacity-45"
      >
        <UIcon name="i-lucide-copy" class="size-5" />
        <span class="font-semibold">{{ t('routines.wizard.startCards.copy.title') }}</span>
        <span class="text-muted text-sm">{{
          t('routines.wizard.startCards.copy.description')
        }}</span>
        <UBadge
          :label="t('routines.wizard.soon')"
          color="neutral"
          variant="subtle"
          size="sm"
          class="mt-1 self-start"
        />
      </div>
      <div
        class="border-default flex cursor-not-allowed flex-col gap-1.5 rounded-lg border p-4 opacity-45"
      >
        <UIcon name="i-lucide-layout-template" class="size-5" />
        <span class="font-semibold">{{ t('routines.wizard.startCards.template.title') }}</span>
        <span class="text-muted text-sm">{{
          t('routines.wizard.startCards.template.description')
        }}</span>
        <UBadge
          :label="t('routines.wizard.soon')"
          color="neutral"
          variant="subtle"
          size="sm"
          class="mt-1 self-start"
        />
      </div>
    </div>

    <div v-else-if="currentStep === 1" class="grid gap-4 sm:grid-cols-2">
      <UFormField :label="t('routines.form.client')" class="sm:col-span-2">
        <USelectMenu
          v-model="selectedClient"
          :items="clients"
          by="id"
          label-key="fullName"
          :placeholder="t('routines.form.clientPlaceholder')"
          class="w-full"
        />
      </UFormField>
      <USwitch
        v-if="!isEdit"
        v-model="state.activate"
        :label="t('routines.wizard.activate')"
        :description="t('routines.wizard.activateHint')"
        class="sm:col-span-2"
      />
      <UFormField :label="t('routines.form.name')" class="sm:col-span-2">
        <UInput
          v-model="state.name"
          :placeholder="t('routines.form.namePlaceholder')"
          class="w-full"
        />
      </UFormField>
      <UFormField :label="t('routines.form.daysPerWeek')">
        <div
          class="bg-macross-gray-950 ring-accented inline-flex gap-1 rounded-sm p-0.5 ring ring-inset"
        >
          <UButton
            v-for="n in MAX_DAYS"
            :key="n"
            :label="String(n)"
            size="sm"
            :color="state.days.length === n ? 'primary' : 'neutral'"
            :variant="state.days.length === n ? 'solid' : 'ghost'"
            class="size-9 justify-center rounded-sm px-0"
            @click="setDaysCount(n)"
          />
        </div>
      </UFormField>
      <!-- 4 semanas fijas por fase (regla de negocio) → campo bloqueado -->
      <UFormField :label="t('routines.form.weeks')">
        <UInput
          :model-value="String(state.weeks)"
          disabled
          trailing-icon="i-lucide-lock"
          class="w-full"
        />
        <p class="text-dimmed mt-1 text-xs">{{ t('routines.form.weeksLocked') }}</p>
      </UFormField>
      <UFormField :label="t('routines.form.notes')" class="sm:col-span-2">
        <UTextarea
          v-model="state.notes"
          :placeholder="t('routines.form.notesPlaceholder')"
          class="w-full"
        />
      </UFormField>
    </div>

    <div v-else class="space-y-4">
      <div
        class="bg-macross-gray-950 ring-accented inline-flex flex-wrap items-center gap-1 rounded-sm p-0.5 ring ring-inset"
      >
        <UChip
          v-for="(day, i) in state.days"
          :key="i"
          :show="!dayComplete(day)"
          color="warning"
          size="sm"
          inset
        >
          <UButton
            :label="t('routines.builder.day', { n: i + 1 })"
            :color="activeDay === i ? 'primary' : 'neutral'"
            :variant="activeDay === i ? 'solid' : 'ghost'"
            size="sm"
            class="h-8 rounded-sm px-3.5"
            @click="selectDay(i)"
          />
        </UChip>
        <UButton
          :label="t('routines.builder.addDay')"
          icon="i-lucide-plus"
          color="primary"
          variant="ghost"
          size="sm"
          class="h-8 rounded-sm px-3.5"
          :disabled="state.days.length >= MAX_DAYS"
          @click="addDay"
        />
      </div>

      <div v-if="currentDay" class="space-y-4">
        <div class="flex flex-wrap items-end gap-3">
          <UFormField :label="t('routines.builder.dayLabel')" class="flex-1">
            <UInput
              v-model="currentDay.label"
              :placeholder="t('routines.builder.dayLabelPlaceholder')"
              class="w-full"
            />
          </UFormField>
          <UButton
            :label="t('routines.builder.duplicateDay')"
            icon="i-lucide-copy"
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled="!canDuplicateDay"
            @click="duplicateDay"
          />
          <UButton
            v-if="state.days.length > 1"
            :label="t('routines.builder.removeDay')"
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            @click="removeDay(activeDay)"
          />
        </div>

        <BaseEmptyState
          v-if="currentDay.blocks.length === 0"
          :message="t('routines.builder.emptyDay')"
        />
        <!-- Contenedor propio: hermanado con el botón de abajo, Sortable lo dejaría arrastrar. -->
        <div v-else ref="blocksEl" class="space-y-4">
          <RoutineBuilderBlock
            v-for="(block, i) in currentDay.blocks"
            :key="i"
            :block
            :index="i"
            :total="currentDay.blocks.length"
            :weeks="state.weeks"
            :start-week="startWeek"
            :options="exercises"
            @remove="updateBlocks(blocks => blocks.toSpliced(i, 1))"
            @remove-exercise="ei => updateBlocks(blocks => removeExerciseAt(blocks, i, ei))"
            @add-exercise="
              updateBlocks(blocks =>
                addExerciseToBlock(blocks, i, makeExercise(state.weeks, startWeek)),
              )
            "
            @group="updateBlocks(blocks => groupWithNext(blocks, i))"
            @move="to => moveBlock(i, to)"
            @set-type="
              type =>
                updateBlocks(blocks =>
                  setBlockType(blocks, i, type, makeExercise(state.weeks, startWeek)),
                )
            "
          />
        </div>

        <UButton
          :label="t('routines.builder.addBlock')"
          icon="i-lucide-plus"
          color="neutral"
          variant="outline"
          @click="addBlock"
        />
      </div>
    </div>

    <div class="flex gap-3 pt-2">
      <UButton
        v-if="currentStep === firstStep"
        :label="t('routines.wizard.cancel')"
        color="neutral"
        variant="ghost"
        to="/routines"
      />
      <UButton
        v-else
        :label="t('routines.wizard.back')"
        color="neutral"
        variant="ghost"
        @click="back"
      />
      <UButton
        v-if="currentStep < 2"
        class="ml-auto"
        :label="t('routines.wizard.next')"
        color="primary"
        :disabled="currentStep === 1 && !step1Valid"
        @click="next"
      />
      <UButton
        v-else
        class="ml-auto"
        :label="t('routines.wizard.save')"
        color="primary"
        :loading
        :disabled="!canSubmit"
        @click="submit"
      />
    </div>
  </div>
</template>
