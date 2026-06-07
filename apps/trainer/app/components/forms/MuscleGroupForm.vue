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

const { muscleGroup, loading = false } = defineProps<MuscleGroupFormProps>()
const emit = defineEmits<MuscleGroupFormEmits>()

const state = reactive<Partial<CreateMuscleGroup>>({
  name: muscleGroup?.name ?? '',
})

function onSubmit(event: FormSubmitEvent<CreateMuscleGroup>) {
  emit('submit', event.data)
}
</script>

<template>
  <UForm :schema="createMuscleGroupSchema" :state class="space-y-4" @submit="onSubmit">
    <UFormField label="Nombre" name="name" required>
      <UInput v-model="state.name" placeholder="Ej: Pecho" class="w-full" />
    </UFormField>

    <div class="flex justify-end gap-3">
      <UButton label="Cancelar" color="neutral" variant="ghost" to="/muscle-groups" />
      <UButton class="cursor-pointer" type="submit" label="Guardar" :loading />
    </div>
  </UForm>
</template>
