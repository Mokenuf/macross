<script setup lang="ts">
import type { CreateExercise } from '@macross/shared'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'Agregar ejercicio' })

const { create } = useCreateExercise()

function onSubmit(data: CreateExercise) {
  create(data)
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto py-6">
    <h1 class="text-2xl font-bold mb-6">Agregar ejercicio</h1>
    <ExerciseForm @submit="onSubmit" />
  </div>
</template>
