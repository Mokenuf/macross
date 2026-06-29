<script setup lang="ts">
import type { CreateTrainer, UpdateTrainer } from '@macross/shared'

const { t } = useI18n()

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'trainers.add.title' })

const { create, pending } = useCreateTrainer()

function onSubmit(data: CreateTrainer | UpdateTrainer) {
  if (!('email' in data)) return
  create(data)
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <h1 class="mb-6 text-2xl font-bold">{{ t('trainers.add.heading') }}</h1>
    <TrainerForm :loading="pending" @submit="onSubmit" />
  </div>
</template>
