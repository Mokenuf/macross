<script setup lang="ts">
import type { BaseResponse, Equipment, Exercise, MuscleGroup } from '@macross/shared'

import type { Filter } from '@/types/base-filters'
import type { TableAction, TableColumn } from '@/types/base-table'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'Ejercicios' })

const { exercises, pagination, loading, page, limit, search, equipmentIds, muscleGroupIds } =
  useGetExercises()
const { remove } = useDeleteExercise()
const { data: user } = useGetMe()

const { data: muscleGroupsData } = useFetch<BaseResponse<MuscleGroup>>('/api/muscle-groups', {
  key: 'muscle-groups-select',
  query: { limit: 100 },
})
const { data: equipmentData } = useFetch<BaseResponse<Equipment>>('/api/equipment', {
  key: 'equipment-select',
  query: { limit: 100 },
})

const isManager = computed(() => user.value?.role === 'manager')

const muscleGroupOptions = computed(() =>
  (muscleGroupsData.value?.rows ?? []).map(mg => ({ label: mg.name, value: mg.id })),
)
const equipmentOptions = computed(() =>
  (equipmentData.value?.rows ?? []).map(e => ({ label: e.name, value: e.id })),
)

const filterConfig = computed<Filter[]>(() => [
  {
    type: 'search',
    key: 'search',
    label: 'Buscar',
    placeholder: 'Buscar ejercicio...',
    debounce: 300,
  },
  {
    type: 'select',
    key: 'muscleGroupIds',
    label: 'Grupo muscular',
    placeholder: 'Filtrar por grupo muscular',
    options: muscleGroupOptions.value,
    searchable: true,
    multiple: true,
  },
  {
    type: 'select',
    key: 'equipmentIds',
    label: 'Equipamiento',
    placeholder: 'Filtrar por equipamiento',
    options: equipmentOptions.value,
    searchable: true,
    multiple: true,
  },
])

const filterValues = computed(() => ({
  search: search.value,
  muscleGroupIds: muscleGroupIds.value,
  equipmentIds: equipmentIds.value,
}))

const columns: TableColumn<Exercise>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  {
    accessorKey: 'muscleGroups',
    header: 'Grupos Musculares',
    cell: ({ row }) => row.original.muscleGroups.map(mg => mg.name).join(', '),
  },
  {
    accessorKey: 'equipment',
    header: 'Equipamiento',
    cell: ({ row }) => row.original.equipment?.name ?? '—',
  },
  { accessorKey: 'description', header: 'Descripción' },
]

const actions: TableAction<Exercise>[] = [
  { type: 'view', href: row => `/exercises/${row.slug}` },
  { type: 'edit', href: row => `/exercises/${row.slug}/edit`, visible: isManager },
  { type: 'delete', onSelect: row => remove(row.slug), visible: isManager },
]

function onFilterUpdate({ key, value }: { key: string; value: string | number | string[] }) {
  const map: Record<string, Ref | WritableComputedRef<string | number | string[]>> = {
    search,
    muscleGroupIds,
    equipmentIds,
  }
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
        label="Agregar Ejercicio"
        icon="i-lucide-plus"
        color="primary"
        to="/exercises/add"
      />
    </div>

    <BaseTable
      :columns
      :actions
      :data="exercises"
      :loading
      :pagination
      :delete-label="row => row.name"
      v-model:page="page"
      v-model:limit="limit"
    />
  </div>
</template>
