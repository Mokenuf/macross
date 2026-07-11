<script setup lang="ts">
import type { CreateExercise } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'exercises.pages.add' })
const { t } = useI18n()

const { create, pending } = useCreateExercise()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('exercises.title'), to: '/exercises' },
  { label: t('common.actions.add') },
])

function onSubmit(data: CreateExercise) {
  create(data)
}
</script>

<template>
  <div>
    <BasePageHead :breadcrumbs :title="t('exercises.pages.add')" />
    <ExerciseForm :loading="pending" @submit="onSubmit" />
  </div>
</template>
