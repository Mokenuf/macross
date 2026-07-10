<script setup lang="ts">
import type { MuscleGroup } from '@macross/shared'

import type { Filter } from '@/types/base-filters'
import type { TableAction, TableColumn } from '@/types/base-table'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'muscle-groups.title' })

const { t } = useI18n()
const { localizedName } = useLocalizedName()
const { muscleGroups, pagination, counts, loading, page, limit, search } = useGetMuscleGroupList()
const { remove } = useDeleteMuscleGroup()
const { data: user } = useGetMe()

const isManager = computed(() => user.value?.role === 'manager')

const filterConfig = computed<Filter[]>(() => [
  {
    type: 'search',
    key: 'search',
    label: t('filters.search'),
    placeholder: t('muscle-groups.filters.placeholder'),
    debounce: 300,
  },
])

const filterValues = computed(() => ({ search: search.value }))

const columns = computed<TableColumn<MuscleGroup>[]>(() => [
  { id: 'name', header: t('muscle-groups.columns.name'), accessorFn: row => localizedName(row) },
])

const actions: TableAction<MuscleGroup>[] = [
  { type: 'view', href: row => `/muscle-groups/${row.slug}` },
  { type: 'edit', href: row => `/muscle-groups/${row.slug}/edit`, visible: isManager },
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
      :title="t('muscle-groups.title')"
      :subtitle="t('muscle-groups.count', { count: counts?.active ?? 0 })"
    >
      <template #actions>
        <UButton
          v-if="isManager"
          :label="t('muscle-groups.add')"
          icon="i-lucide-plus"
          color="primary"
          to="/muscle-groups/add"
        />
      </template>
    </BasePageHead>
    <BaseFilters :filters="filterConfig" :values="filterValues" @update:filters="onFilterUpdate" />

    <BaseTable
      :columns
      :actions
      :data="muscleGroups"
      :loading
      :pagination
      :delete-label="row => localizedName(row)"
      v-model:page="page"
      v-model:limit="limit"
    />
  </div>
</template>
