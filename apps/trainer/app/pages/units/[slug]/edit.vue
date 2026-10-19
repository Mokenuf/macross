<script setup lang="ts">
import type { UpdateUnit } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'units.pages.edit' })

const { t } = useI18n()
const { localizedName } = useLocalizedName()
const route = useRoute()
const { slug } = route.params

const { unit, loading } = useGetUnit(String(slug))
const { update, pending } = useUpdateUnit()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('units.title'), to: '/units' },
  ...(unit.value ? [{ label: localizedName(unit.value), to: `/units/${unit.value.slug}` }] : []),
  { label: t('common.actions.edit') },
])

function onSubmit(data: UpdateUnit) {
  update(String(slug), data)
}
</script>

<template>
  <div>
    <BasePageHead :breadcrumbs :title="t('units.pages.edit')" />
    <UnitForm v-if="unit" :unit :loading="pending" @submit="onSubmit" />
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
