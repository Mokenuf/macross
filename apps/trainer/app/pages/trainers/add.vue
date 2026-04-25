<script setup lang="ts">
import type { CreateTrainer } from '@macross/shared'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'Agregar Entrenador' })

const { create } = useCreateTrainer()

function onSubmit(data: CreateTrainer) {
  create(data)
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <h1 class="mb-6 text-2xl font-bold">Invitar Entrenador</h1>
    <TrainerForm @submit="onSubmit" />
  </div>
</template>
