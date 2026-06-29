<script setup lang="ts">
import type { CreateMuscleGroup } from '@macross/shared'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'muscle-groups.add' })

const { t } = useI18n()

const { create, pending } = useCreateMuscleGroup()

function onSubmit(data: CreateMuscleGroup) {
  create(data)
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <h1 class="mb-6 text-2xl font-bold">{{ t('muscle-groups.add') }}</h1>
    <MuscleGroupForm :loading="pending" @submit="onSubmit" />
  </div>
</template>
