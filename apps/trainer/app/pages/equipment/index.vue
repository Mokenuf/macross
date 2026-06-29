<script setup lang="ts">
import type { Equipment } from '@macross/shared'

import type { Filter } from '@/types/base-filters'
import type { TableAction, TableColumn } from '@/types/base-table'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'equipment.title' })

const { t } = useI18n()
const { equipments, pagination, loading, page, limit, search } = useGetEquipmentList()
const { remove } = useDeleteEquipment()
const { data: user } = useGetMe()

const isManager = computed(() => user.value?.role === 'manager')

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
  { accessorKey: 'name', header: t('equipment.columns.name') },
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
    <div class="flex items-end justify-between">
      <BaseFilters
        :filters="filterConfig"
        :values="filterValues"
        @update:filters="onFilterUpdate"
      />
      <UButton
        v-if="isManager"
        :label="t('equipment.add')"
        icon="i-lucide-plus"
        color="primary"
        to="/equipment/add"
      />
    </div>

    <BaseTable
      :columns
      :actions
      :data="equipments"
      :loading
      :pagination
      :delete-label="row => row.name"
      v-model:page="page"
      v-model:limit="limit"
    />
  </div>
</template>
