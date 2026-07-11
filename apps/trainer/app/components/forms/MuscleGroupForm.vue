<script setup lang="ts">
import { createMuscleGroupSchema, type CreateMuscleGroup, type MuscleGroup } from '@macross/shared'
import type { FormSubmitEvent } from '@nuxt/ui'

interface MuscleGroupFormProps {
  muscleGroup?: MuscleGroup
  loading?: boolean
}
interface MuscleGroupFormEmits {
  submit: [payload: CreateMuscleGroup]
}

const { t } = useI18n()

const { muscleGroup, loading = false } = defineProps<MuscleGroupFormProps>()
const emit = defineEmits<MuscleGroupFormEmits>()

const form = useTemplateRef('form')
useRevalidateOnLocale(() => form.value)

const state = reactive<Partial<CreateMuscleGroup>>({
  nameEs: muscleGroup?.nameEs ?? '',
  nameEn: muscleGroup?.nameEn ?? '',
})

function onSubmit(event: FormSubmitEvent<CreateMuscleGroup>) {
  emit('submit', event.data)
}
</script>

<template>
  <UForm ref="form" :schema="createMuscleGroupSchema" :state class="space-y-4" @submit="onSubmit">
    <UFormField :label="t('muscle-groups.form.nameEs')" name="nameEs" required>
      <UInput
        v-model="state.nameEs"
        :placeholder="t('muscle-groups.form.nameEsPlaceholder')"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="t('muscle-groups.form.nameEn')" name="nameEn" required>
      <UInput
        v-model="state.nameEn"
        :placeholder="t('muscle-groups.form.nameEnPlaceholder')"
        class="w-full"
      />
    </UFormField>

    <div class="flex justify-end gap-3">
      <UButton
        :label="t('common.actions.cancel')"
        color="neutral"
        variant="outline"
        to="/muscle-groups"
      />
      <UButton type="submit" :label="t('common.actions.save')" :loading />
    </div>
  </UForm>
</template>
