<script setup lang="ts">
import { Roles, type BaseResponse, type Client, type Trainer } from '@macross/shared'

import type { Filter } from '@/types/base-filters'
import type { TableAction, TableColumn } from '@/types/base-table'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'Clientes' })

const { clients, pagination, loading, page, limit, search, trainerId } = useGetClients()
const { remove } = useDeleteClient()
const { data: me } = useGetMe()

const { data: trainersData } = useFetch<BaseResponse<Trainer>>('/api/trainers', {
  key: 'trainers-select',
  query: { limit: 100 },
})

const isManager = computed(() => me.value?.role === Roles.manager)
const trainerOptions = computed(() =>
  (trainersData.value?.rows ?? []).map(t => ({ label: t.fullName, value: t.id })),
)

const filterConfig = computed<Filter[]>(() => {
  const filters: Filter[] = [
    {
      type: 'search',
      key: 'search',
      label: 'Buscar',
      placeholder: 'Buscar cliente...',
      debounce: 300,
    },
  ]
  if (isManager.value) {
    filters.push({
      type: 'select',
      key: 'trainerId',
      label: 'Entrenador',
      placeholder: 'Filtrar por entrenador',
      options: trainerOptions.value,
    })
  }
  return filters
})

const filterValues = computed(() => ({ search: search.value, trainerId: trainerId.value }))

const columns = computed<TableColumn<Client>[]>(() => {
  const cols: TableColumn<Client>[] = [
    { accessorKey: 'fullName', header: 'Nombre' },
    { accessorKey: 'email', header: 'Email' },
  ]
  if (isManager.value) {
    cols.push({
      accessorKey: 'trainer',
      header: 'Entrenador',
      cell: ({ row }) => row.original.trainer?.fullName ?? '—',
    })
  }
  cols.push({
    accessorKey: 'createdAt',
    header: 'Fecha de creación',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('es-AR'),
  })
  return cols
})

const actions: TableAction<Client>[] = [
  { type: 'view', href: row => `/clients/${row.nanoId}` },
  { type: 'edit', href: row => `/clients/${row.nanoId}/edit` },
  { type: 'delete', onSelect: row => remove(row.nanoId) },
]

function onFilterUpdate({ key, value }: { key: string; value: string | number }) {
  const map: Record<string, Ref | WritableComputedRef<string | number>> = { search, trainerId }
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
      <UButton label="Agregar Cliente" icon="i-lucide-plus" color="primary" to="/clients/add" />
    </div>
    <BaseTable
      :columns
      :actions
      :data="clients"
      :loading
      :pagination
      :delete-label="row => row.fullName"
      v-model:page="page"
      v-model:limit="limit"
    />
  </div>
</template>
