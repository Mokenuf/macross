<script setup lang="ts">
import type { Equipment } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

import type { Filter } from '@/types/base-filters'
import type { TableAction, TableColumn } from '@/types/base-table'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'equipment.title' })

const { t } = useI18n()
const { localizedName } = useLocalizedName()
const { equipments, pagination, counts, loading, page, limit, search } = useGetEquipmentList()
const { remove } = useDeleteEquipment()
const { data: user } = useGetMe()

const isManager = computed(() => user.value?.role === 'manager')

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('equipment.title') },
])

const filterConfig: Filter[] = [
  {
    type: 'search',
    key: 'search',
    label: t('filters.search'),
    placeholder: t('equipment.filters.searchPlaceholder'),
    debounce: 300,
  },
]

const filterValues = computed(() => ({ search: search.value }))

const columns = computed<TableColumn<Equipment>[]>(() => [
  { id: 'name', header: t('equipment.columns.name'), accessorFn: row => localizedName(row) },
])

const actions: TableAction<Equipment>[] = [
  { type: 'view', href: row => `/equipment/${row.slug}` },
  { type: 'edit', href: row => `/equipment/${row.slug}/edit`, visible: isManager },
  { type: 'delete', onSelect: row => remove(row.slug), visible: isManager },
]

function onFilterUpdate({ key, value }: { key: string; value: string | number | string[] }) {
  const map: Record<string, Ref | WritableComputedRef<string | number | string[]>> = { search }
  if (map[key]) map[key].value = value
}
</script>

<template>
  <div class="space-y-4">
    <BasePageHead
      :loading
      :breadcrumbs
      :title="t('equipment.title')"
      :subtitle="t('equipment.count', { count: counts?.active ?? 0 })"
    >
      <template #actions>
        <UButton
          v-if="isManager"
          :label="t('equipment.add')"
          icon="i-lucide-plus"
          color="primary"
          to="/equipment/add"
        />
      </template>
    </BasePageHead>
    <BaseFilters :filters="filterConfig" :values="filterValues" @update:filters="onFilterUpdate" />

    <BaseTable
      :columns
      :actions
      :data="equipments"
      :loading
      :pagination
      :delete-label="row => localizedName(row)"
      v-model:page="page"
      v-model:limit="limit"
    />
  </div>
</template>
