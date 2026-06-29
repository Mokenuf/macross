<script setup lang="ts">
import {
  type BaseResponse,
  createExerciseSchema,
  type CreateExercise,
  type Equipment,
  type Exercise,
  type MuscleGroup,
} from '@macross/shared'
import type { FormSubmitEvent } from '@nuxt/ui'

interface ExerciseFormProps {
  exercise?: Exercise
  loading?: boolean
}
interface ExerciseFormEmits {
  submit: [payload: CreateExercise]
}

const { exercise, loading = false } = defineProps<ExerciseFormProps>()
const emit = defineEmits<ExerciseFormEmits>()
const { t, locale } = useI18n()

const state = reactive<Partial<CreateExercise>>({
  nameEs: exercise?.nameEs ?? '',
  nameEn: exercise?.nameEn ?? '',
  descriptionEs: exercise?.descriptionEs ?? '',
  descriptionEn: exercise?.descriptionEn ?? '',
  videoUrl: exercise?.videoUrl ?? '',
  muscleGroupIds: exercise?.muscleGroups.map(mg => mg.id) ?? [],
  equipmentId: exercise?.equipment?.id,
})

const nameKey = computed(() => (locale.value === 'en' ? 'nameEn' : 'nameEs'))

const form = useTemplateRef('form')
useRevalidateOnLocale(() => form.value)

const selectedMuscleGroups = ref<MuscleGroup[]>(exercise?.muscleGroups ?? [])

const muscleGroupsSearchTerm = ref('')
const debouncedSearch = refDebounced(muscleGroupsSearchTerm, 300)

const { data, pending } = useLazyFetch<BaseResponse<MuscleGroup>>('/api/muscle-groups', {
  query: { search: debouncedSearch, limit: 5 },
})

const muscleGroups = computed<MuscleGroup[]>(() => data.value?.rows ?? [])

const items = computed<MuscleGroup[]>(() => {
  if (debouncedSearch.value) return muscleGroups.value

  const fetchedIds = new Set(muscleGroups.value.map(mg => mg.id))
  const cachedNotInFetch = selectedMuscleGroups.value.filter(mg => !fetchedIds.has(mg.id))
  return [...muscleGroups.value, ...cachedNotInFetch]
})

const selectedEquipment = ref<Equipment | undefined>(exercise?.equipment ?? undefined)

const equipmentSearchTerm = ref('')
const debouncedEquipmentSearch = refDebounced(equipmentSearchTerm, 300)

const { data: equipmentData, pending: equipmentPending } = useLazyFetch<BaseResponse<Equipment>>(
  '/api/equipment',
  {
    query: { search: debouncedEquipmentSearch, limit: 5 },
  },
)

const equipmentList = computed<Equipment[]>(() => equipmentData.value?.rows ?? [])

const equipmentItems = computed<Equipment[]>(() => {
  if (debouncedEquipmentSearch.value || !selectedEquipment.value) return equipmentList.value

  const fetchedIds = new Set(equipmentList.value.map(e => e.id))
  return fetchedIds.has(selectedEquipment.value.id)
    ? equipmentList.value
    : [selectedEquipment.value, ...equipmentList.value]
})

watch(
  selectedMuscleGroups,
  mgs => {
    state.muscleGroupIds = mgs.map(mg => mg.id)
  },
  { deep: true },
)

watch(selectedEquipment, e => {
  state.equipmentId = e?.id
})

function onSubmit(event: FormSubmitEvent<CreateExercise>) {
  emit('submit', event.data)
}
</script>

<template>
  <UForm ref="form" :schema="createExerciseSchema" :state class="space-y-4" @submit="onSubmit">
    <UFormField :label="t('exercises.form.nameEs')" name="nameEs" required>
      <UInput
        v-model="state.nameEs"
        :placeholder="t('exercises.form.nameEsExample')"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="t('exercises.form.nameEn')" name="nameEn" required>
      <UInput
        v-model="state.nameEn"
        :placeholder="t('exercises.form.nameEnExample')"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="t('exercises.form.descriptionEs')" name="descriptionEs">
      <UTextarea
        v-model="state.descriptionEs"
        :placeholder="t('exercises.form.descriptionEsPlaceholder')"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="t('exercises.form.descriptionEn')" name="descriptionEn">
      <UTextarea
        v-model="state.descriptionEn"
        :placeholder="t('exercises.form.descriptionEnPlaceholder')"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="t('exercises.form.muscleGroup')" name="muscleGroupIds">
      <USelectMenu
        v-model="selectedMuscleGroups"
        v-model:search-term="muscleGroupsSearchTerm"
        :search-input="{
          placeholder: t('exercises.filters.searchPlaceholder'),
          icon: 'i-lucide-search',
        }"
        :ignore-filter="true"
        :loading="pending"
        :items
        by="id"
        :label-key="nameKey"
        clear
        multiple
        :placeholder="t('exercises.form.muscleGroupPlaceholder')"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="t('exercises.form.equipment')" name="equipmentId">
      <USelectMenu
        v-model="selectedEquipment"
        v-model:search-term="equipmentSearchTerm"
        :search-input="{
          placeholder: t('exercises.filters.searchPlaceholder'),
          icon: 'i-lucide-search',
        }"
        :ignore-filter="true"
        :loading="equipmentPending"
        :items="equipmentItems"
        by="id"
        :label-key="nameKey"
        clear
        :placeholder="t('exercises.form.equipmentPlaceholder')"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="t('exercises.form.videoUrl')" name="videoUrl">
      <UInput
        v-model="state.videoUrl"
        :placeholder="t('exercises.form.videoUrlExample')"
        class="w-full"
      />
    </UFormField>

    <div class="flex justify-end gap-3">
      <UButton
        :label="t('common.actions.cancel')"
        color="neutral"
        variant="ghost"
        to="/exercises"
      />
      <UButton class="cursor-pointer" type="submit" :label="t('common.actions.save')" :loading />
    </div>
  </UForm>
</template>
