<script setup lang="ts">
import type { CreateTrainer, UpdateTrainer } from '@macross/shared'

const { t } = useI18n()

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'trainers.edit.title' })

const route = useRoute()
const { nanoId } = route.params

const { trainer, loading } = useGetTrainer(String(nanoId))
const { update, pending } = useUpdateTrainer()

function onSubmit(data: CreateTrainer | UpdateTrainer) {
  update(String(nanoId), data as UpdateTrainer)
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <h1 class="mb-6 text-2xl font-bold">{{ t('trainers.edit.heading') }}</h1>
    <TrainerForm v-if="trainer" :trainer :loading="pending" @submit="onSubmit" />
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
