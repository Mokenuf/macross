<script setup lang="ts">
import type { UpdateExercise } from '@macross/shared'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'Editar ejercicio' })

const route = useRoute()
const { slug } = route.params

const { exercise, loading } = useGetExercise(String(slug))
const { update } = useUpdateExercise()

function onSubmit(data: UpdateExercise) {
  update(String(slug), data)
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto py-6">
    <h1 class="text-2xl font-bold mb-6">Editar ejercicio</h1>
    <ExerciseForm v-if="exercise" :exercise @submit="onSubmit" />
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8" />
    </div>
  </div>
</template>
