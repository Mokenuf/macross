<script setup lang="ts">
import type { CreateRoutine } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'routines.add.title' })

const { t } = useI18n()
const { create, pending } = useCreateRoutine()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('routines.title'), to: '/routines' },
  { label: t('routines.add.title') },
])

function onSubmit(data: CreateRoutine) {
  create(data)
}
</script>

<template>
  <div>
    <BasePageHead :breadcrumbs :title="t('routines.add.heading')" />
    <RoutineWizard :loading="pending" @submit="onSubmit" />
  </div>
</template>
