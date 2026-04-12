<script setup lang="ts">
import type { CreateMuscleGroup } from '@macross/shared'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'Agregar Grupo Muscular' })

const { create } = useCreateMuscleGroup()

function onSubmit(data: CreateMuscleGroup) {
  create(data)
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto py-6">
    <h1 class="text-2xl font-bold mb-6">Agregar Grupo Muscular</h1>
    <MuscleGroupForm @submit="onSubmit" />
  </div>
</template>
