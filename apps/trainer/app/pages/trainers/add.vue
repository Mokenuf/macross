<script setup lang="ts">
import type { CreateTrainer, UpdateTrainer } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'trainers.add.title' })

const { t } = useI18n()
const { create, pending } = useCreateTrainer()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('trainers.title'), to: '/trainers' },
  { label: t('common.actions.add') },
])

function onSubmit(data: CreateTrainer | UpdateTrainer) {
  if (!('email' in data)) return
  create(data)
}
</script>

<template>
  <div>
    <BasePageHead
      :breadcrumbs
      :title="t('trainers.add.heading')"
      :subtitle="t('trainers.add.subtitle')"
    />
    <TrainerForm :loading="pending" @submit="onSubmit" />
  </div>
</template>
