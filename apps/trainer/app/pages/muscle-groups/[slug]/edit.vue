<script setup lang="ts">
import type { UpdateMuscleGroup } from '@macross/shared'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'muscle-groups.edit.title' })

const { t } = useI18n()

const route = useRoute()
const { slug } = route.params

const { muscleGroup, loading } = useGetMuscleGroup(String(slug))
const { update, pending } = useUpdateMuscleGroup()

function onSubmit(data: UpdateMuscleGroup) {
  update(String(slug), data)
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <h1 class="mb-6 text-2xl font-bold">{{ t('muscle-groups.edit.title') }}</h1>
    <MuscleGroupForm v-if="muscleGroup" :muscle-group :loading="pending" @submit="onSubmit" />
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
