<script setup lang="ts">
import type { UpdateEquipment } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'equipment.pages.edit' })

const { t } = useI18n()
const { localizedName } = useLocalizedName()
const route = useRoute()
const { slug } = route.params

const { equipment, loading } = useGetEquipment(String(slug))
const { update, pending } = useUpdateEquipment()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('equipment.title'), to: '/equipment' },
  ...(equipment.value
    ? [{ label: localizedName(equipment.value), to: `/equipment/${equipment.value.slug}` }]
    : []),
  { label: t('common.actions.edit') },
])

function onSubmit(data: UpdateEquipment) {
  update(String(slug), data)
}
</script>

<template>
  <div>
    <BasePageHead :breadcrumbs :title="t('equipment.pages.edit')" />
    <EquipmentForm v-if="equipment" :equipment :loading="pending" @submit="onSubmit" />
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
