<script setup lang="ts">
import { Roles, type Trainer } from '@macross/shared'

import type { Filter } from '@/types/base-filters'
import type { TableAction, TableColumn } from '@/types/base-table'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'Entrenadores' })

const { trainers, pagination, loading, page, limit, search, role } = useGetTrainerList()
const { remove } = useDeleteTrainer()
const { data: user } = useGetMe()

const isManager = computed(() => user.value?.role === Roles.manager)

const filterConfig: Filter[] = [
  {
    type: 'search',
    key: 'search',
    label: 'Buscar',
    placeholder: 'Buscar entrenador...',
    debounce: 300,
  },
  {
    type: 'select',
    key: 'role',
    label: 'Rol',
    placeholder: 'Seleccionar rol',
    options: [
      { label: 'Entrenador', value: Roles.trainer },
      { label: 'Manager', value: Roles.manager },
    ],
  },
]

const filterValues = computed(() => ({ search: search.value, role: role.value }))

const UBadge = resolveComponent('UBadge')
const roleBadge = {
  [Roles.trainer]: { label: 'Entrenador', color: 'primary' },
  [Roles.manager]: { label: 'Manager', color: 'neutral' },
}

const columns: TableColumn<Trainer>[] = [
  { accessorKey: 'fullName', header: 'Nombre' },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'role',
    header: 'Rol',
    cell: ({ row }) => {
      const rowValue = row.original.role
      return h(
        UBadge,
        { class: 'capitalize', variant: 'subtle', color: roleBadge[rowValue].color },
        () => roleBadge[rowValue].label,
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha de creación',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('es-AR'),
  },
]

const canDeleteTrainer = (row: Trainer) => isManager.value && row.role !== Roles.manager

const actions: TableAction<Trainer>[] = [
  { type: 'view', href: row => `/trainers/${row.nanoId}` },
  { type: 'edit', href: row => `/trainers/${row.nanoId}/edit`, visible: isManager },
  { type: 'delete', onSelect: row => remove(row.nanoId), visible: canDeleteTrainer },
]

function onFilterUpdate({ key, value }: { key: string; value: string | number | string[] }) {
  const map: Record<string, Ref | WritableComputedRef<string | number | string[]>> = {
    search,
    role,
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
        label="Agregar Entrenador"
        icon="i-lucide-plus"
        color="primary"
        to="/trainers/add"
      />
    </div>
    <BaseTable
      :columns
      :actions
      :data="trainers"
      :loading
      :pagination
      :delete-label="row => row.fullName"
      v-model:page="page"
      v-model:limit="limit"
    />
  </div>
</template>
