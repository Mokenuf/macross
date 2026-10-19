<script setup lang="ts">
import type { CreateUnit } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'units.pages.add' })

const { t } = useI18n()
const { create, pending } = useCreateUnit()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('units.title'), to: '/units' },
  { label: t('common.actions.add') },
])

function onSubmit(data: CreateUnit) {
  create(data)
}
</script>

<template>
  <div>
    <BasePageHead :breadcrumbs :title="t('units.pages.add')" />
    <UnitForm :loading="pending" @submit="onSubmit" />
  </div>
</template>
