<script setup lang="ts">
import {
  type BaseResponse,
  type Client,
  type Exercise,
  type Routine,
  type UpdateRoutine,
} from '@macross/shared'

import type { BuilderDay, BuilderExercise, RoutineBuilderState } from '@/types/routine-builder'

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

const currentStep = ref(routine ? 1 : 0)
const activeDay = ref(0)

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

const step1Valid = computed(() => state.name.trim().length > 0 && state.clientId.length > 0)

const canSubmit = computed(() => state.days.every(dayComplete))

function makeDay(): BuilderDay {
  return { label: '', exercises: [] }
}

function makeExercise(): BuilderExercise {
  return { exercise: null, sets: 3, reps: '', restSeconds: null, optional: false, notes: '' }
}

// Edición: se aplanan los bloques (cada slot → fila suelta) y se toma la prescripción de la semana 1
// (en el modelo flat las N semanas nacen iguales). La progresión por semana no sobrevive a este
// colapso — lo preserva el editor de matriz por semana del builder completo.
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
      exercises: d.blocks.flatMap(block =>
        block.exercises.map(slot => {
          const week1 = slot.schemes.find(s => s.weekNumber === 1) ?? slot.schemes[0]
          return {
            id: slot.id,
            exercise: {
              id: slot.exercise.id,
              nameEs: slot.exercise.nameEs,
              nameEn: slot.exercise.nameEn,
            },
            sets: week1?.sets ?? 3,
            reps: week1?.reps ?? '',
            restSeconds: week1?.restSeconds ?? null,
            optional: slot.optional,
            notes: slot.notes ?? '',
          }
        }),
      ),
    })),
  }
}

function dayComplete(day: BuilderDay) {
  return (
    day.exercises.length > 0 &&
    day.exercises.every(e => e.exercise && e.reps.trim().length > 0 && e.sets >= 1)
  )
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

function removeDay(index: number) {
  state.days.splice(index, 1)
  if (activeDay.value >= state.days.length) activeDay.value = Math.max(0, state.days.length - 1)
}

function selectDay(index: number) {
  activeDay.value = index
}

function addExercise() {
  currentDay.value?.exercises.push(makeExercise())
}

function removeExercise(exIndex: number) {
  currentDay.value?.exercises.splice(exIndex, 1)
}

function next() {
  if (currentStep.value < 2) currentStep.value += 1
}

function back() {
  if (currentStep.value > firstStep.value) currentStep.value -= 1
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
      exercises: d.exercises
        .filter(e => e.exercise)
        .map(e => ({
          id: e.id,
          exerciseId: e.exercise!.id,
          sets: e.sets,
          reps: e.reps.trim(),
          restSeconds: e.restSeconds ?? undefined,
          optional: e.optional,
          notes: e.notes.trim() || undefined,
        })),
    })),
  }
  emit('submit', payload)
}
</script>

<template>
  <div class="space-y-6">
    <UStepper :items="steps" v-model="currentStep" disabled class="w-full" />

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
          <!-- Duplicar día llega con el builder completo -->
          <UButton
            :label="t('routines.builder.duplicateDay')"
            icon="i-lucide-copy"
            color="neutral"
            variant="ghost"
            size="sm"
            disabled
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
          v-if="currentDay.exercises.length === 0"
          :message="t('routines.builder.emptyDay')"
        />
        <RoutineBuilderExercise
          v-for="(exercise, i) in currentDay.exercises"
          :key="i"
          :exercise
          :index="i"
          :weeks="state.weeks"
          :options="exercises"
          @remove="removeExercise(i)"
        />

        <UButton
          :label="t('routines.builder.addExercise')"
          icon="i-lucide-plus"
          color="neutral"
          variant="outline"
          @click="addExercise"
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
