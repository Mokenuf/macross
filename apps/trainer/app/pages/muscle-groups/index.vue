<script setup lang="ts">
import type { MuscleGroup } from '@macross/shared'

import type { Filter } from '@/types/base-filters'
import type { TableAction, TableColumn } from '@/types/base-table'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'Grupos Musculares' })

const { muscleGroups, pagination, loading, page, limit, search } = useGetMuscleGroups()
const { remove } = useDeleteMuscleGroup()
const { data: user } = useGetMe()

const isManager = computed(() => user.value?.role === 'manager')

const filterConfig: Filter[] = [
  {
    type: 'search',
    key: 'search',
    label: 'Buscar',
    placeholder: 'Buscar grupo muscular...',
    debounce: 300,
  },
]

const filterValues = computed(() => ({ search: search.value }))

const columns: TableColumn<MuscleGroup>[] = [{ accessorKey: 'name', header: 'Nombre' }]

const actions: TableAction<MuscleGroup>[] = [
  { type: 'view', href: row => `/muscle-groups/${row.slug}` },
  { type: 'edit', href: row => `/muscle-groups/${row.slug}/edit`, visible: isManager },
  { type: 'delete', onSelect: row => remove(row.slug), visible: isManager },
]

function onFilterUpdate({ key, value }: { key: string; value: string | number }) {
  const map: Record<string, Ref | WritableComputedRef<string | number>> = { search }
  if (map[key]) map[key].value = value
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <BaseFilters
        :filters="filterConfig"
        :values="filterValues"
        @update:filters="onFilterUpdate"
      />
      <UButton
        v-if="isManager"
        label="Agregar Grupo Muscular"
        icon="i-lucide-plus"
        color="primary"
        to="/muscle-groups/add"
      />
    </div>

    <BaseTable
      :columns
      :actions
      :data="muscleGroups"
      :loading
      :pagination
      :delete-label="row => row.name"
      v-model:page="page"
      v-model:limit="limit"
    />
  </div>
</template>
