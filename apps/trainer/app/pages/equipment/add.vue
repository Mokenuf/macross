<script setup lang="ts">
import type { CreateEquipment } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'equipment.pages.add' })

const { t } = useI18n()
const { create, pending } = useCreateEquipment()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('equipment.title'), to: '/equipment' },
  { label: t('common.actions.add') },
])

function onSubmit(data: CreateEquipment) {
  create(data)
}
</script>

<template>
  <div>
    <BasePageHead :breadcrumbs :title="t('equipment.pages.add')" />
    <EquipmentForm :loading="pending" @submit="onSubmit" />
  </div>
</template>
