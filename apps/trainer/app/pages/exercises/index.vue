<script setup lang="ts">
import type { Exercise } from '@macross/shared'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'Ejercicios' })

const { exercises, pagination, loading, page, limit, search } = useGetExercises()
const { data: user } = useGetMe()

const isManager = computed(() => user.value?.role === 'manager')

const columns: TableColumn<Exercise>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'muscleGroup', header: 'Grupo Muscular' },
  { accessorKey: 'description', header: 'Descripción' },
  {
    id: 'actions',
    header: '',
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const UDropdownMenu = resolveComponent('UDropdownMenu')
      const UButton = resolveComponent('UButton')

      return h(
        UDropdownMenu,
        { content: { align: 'end' }, items: getRowActions(row.original) },
        () =>
          h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost' }),
      )
    },
  },
]

function getRowActions(exercise: Exercise) {
  const items: DropdownMenuItem[][] = [
    [
      {
        label: 'Ver',
        icon: 'i-lucide-eye',
        onSelect: () => navigateTo(`/exercises/${exercise.slug}`),
      },
    ],
  ]

  if (isManager.value) {
    items.push([
      {
        label: 'Editar',
        icon: 'i-lucide-pencil',
        onSelect: () => navigateTo(`/exercises/${exercise.slug}/edit`),
      },
      {
        label: 'Eliminar',
        icon: 'i-lucide-trash',
        color: 'error',
        onSelect: () => handleDelete(exercise.id),
      },
    ])
  }

  return items
}

function handleDelete(id: string) {
  console.log('should delete exercise with id', id)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <UInput v-model="search" placeholder="Buscar ejercicio..." icon="i-lucide-search" />
      <UButton
        v-if="isManager"
        label="Agregar Ejercicio"
        icon="i-lucide-plus"
        color="primary"
        to="/exercises/add"
      />
    </div>

    <UTable :columns :data="exercises" :loading />

    <UPagination v-model:page="page" :items-per-page="limit" :total="pagination.total" />
  </div>
</template>
