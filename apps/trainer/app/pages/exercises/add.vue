<script setup lang="ts">
import type { CreateExercise } from '@macross/shared'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'exercises.pages.add' })
const { t } = useI18n()

const { create, pending } = useCreateExercise()

function onSubmit(data: CreateExercise) {
  create(data)
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <h1 class="mb-6 text-2xl font-bold">{{ t('exercises.pages.add') }}</h1>
    <ExerciseForm :loading="pending" @submit="onSubmit" />
  </div>
</template>
