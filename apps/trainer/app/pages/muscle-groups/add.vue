<script setup lang="ts">
import type { CreateMuscleGroup } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'muscle-groups.pages.add' })

const { t } = useI18n()
const { create, pending } = useCreateMuscleGroup()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('muscle-groups.title'), to: '/muscle-groups' },
  { label: t('common.actions.add') },
])

function onSubmit(data: CreateMuscleGroup) {
  create(data)
}
</script>

<template>
  <div>
    <BasePageHead :breadcrumbs :title="t('muscle-groups.pages.add')" />
    <MuscleGroupForm :loading="pending" @submit="onSubmit" />
  </div>
</template>
