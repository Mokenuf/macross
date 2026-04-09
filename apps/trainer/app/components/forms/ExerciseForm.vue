<script setup lang="ts">
import { createExerciseSchema, type CreateExercise, type Exercise } from '@macross/shared'
import type { FormSubmitEvent } from '@nuxt/ui'

interface ExerciseFormProps {
  exercise?: Exercise
}
interface ExerciseFormEmits {
  submit: [payload: CreateExercise]
}

const { exercise } = defineProps<ExerciseFormProps>()
const emit = defineEmits<ExerciseFormEmits>()

const state = reactive<Partial<CreateExercise>>({
  name: exercise?.name ?? '',
  description: exercise?.description ?? '',
  videoUrl: exercise?.videoUrl ?? '',
  muscleGroup: exercise?.muscleGroup ?? '',
})

function onSubmit(event: FormSubmitEvent<CreateExercise>) {
  emit('submit', event.data)
}
</script>

<template>
  <UForm :schema="createExerciseSchema" :state class="space-y-4" @submit="onSubmit">
    <UFormField label="Nombre" name="name" required>
      <UInput v-model="state.name" placeholder="Ej: Sentadilla búlgara" class="w-full" />
    </UFormField>

    <UFormField label="Descripción" name="description">
      <UTextarea
        v-model="state.description"
        placeholder="Descripción del ejercicio"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Grupo muscular" name="muscleGroup">
      <UInput v-model="state.muscleGroup" placeholder="Ej: Pierna, Core, Pecho" class="w-full" />
    </UFormField>

    <UFormField label="URL del video" name="videoUrl">
      <UInput
        v-model="state.videoUrl"
        placeholder="Ej: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        class="w-full"
      />
    </UFormField>

    <div class="flex justify-end gap-3">
      <UButton label="Cancelar" color="neutral" variant="ghost" to="/exercises" />
      <UButton class="cursor-pointer" type="submit" label="Guardar" />
    </div>
  </UForm>
</template>
