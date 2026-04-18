<script setup lang="ts">
import type { CreateExercise } from '@macross/shared'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'Agregar ejercicio' })

const { create } = useCreateExercise()

function onSubmit(data: CreateExercise) {
  create(data)
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <h1 class="mb-6 text-2xl font-bold">Agregar ejercicio</h1>
    <ExerciseForm @submit="onSubmit" />
  </div>
</template>
