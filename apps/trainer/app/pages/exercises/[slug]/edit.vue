<script setup lang="ts">
import type { UpdateExercise } from '@macross/shared'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'Editar ejercicio' })

const route = useRoute()
const { slug } = route.params

const { exercise, loading } = useGetExercise(String(slug))
const { update, pending } = useUpdateExercise()

function onSubmit(data: UpdateExercise) {
  update(String(slug), data)
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <h1 class="mb-6 text-2xl font-bold">Editar ejercicio</h1>
    <ExerciseForm v-if="exercise" :exercise :loading="pending" @submit="onSubmit" />
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
