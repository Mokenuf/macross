<script setup lang="ts">
import type { Exercise } from '@macross/shared'

import type { Filter } from '@/types/base-filters'
import type { TableAction, TableColumn } from '@/types/base-table'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'Ejercicios' })

const { exercises, pagination, loading, page, limit, search } = useGetExercises()
const { data: user } = useGetMe()

const isManager = computed(() => user.value?.role === 'manager')

const filterConfig: Filter[] = [
  {
    type: 'search',
    key: 'search',
    label: 'Buscar',
    placeholder: 'Buscar ejercicio...',
    debounce: 300,
  },
]

const filterValues = computed(() => ({ search: search.value }))

const columns: TableColumn<Exercise>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'muscleGroup', header: 'Grupo Muscular' },
  { accessorKey: 'description', header: 'Descripción' },
]

const actions: TableAction<Exercise>[] = [
  { type: 'view', href: row => `/exercises/${row.slug}` },
  { type: 'edit', href: row => `/exercises/${row.slug}/edit`, visible: isManager },
  { type: 'delete', onSelect: row => handleDelete(row.id), visible: isManager },
]

function onFilterUpdate({ key, value }: { key: string; value: string | number }) {
  const map: Record<string, Ref | WritableComputedRef<string | number>> = { search }
  if (map[key]) map[key].value = value
}

function handleDelete(id: string) {
  console.log('should delete exercise with id', id)
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
      v-model:page="page"
      v-model:limit="limit"
    />
  </div>
</template>
