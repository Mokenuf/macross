<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
useHead({ title: 'Ejercicios' })

const { exercises, pagination, loading, page, limit, search } = useGetExercises()

const columns = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'muscleGroup', header: 'Grupo Muscular' },
  { accessorKey: 'description', header: 'Descripción' },
]
</script>

<template>
  <div class="space-y-4">
    <UInput v-model="search" placeholder="Buscar ejercicio..." icon="i-lucide-search" />

    <UTable :columns :data="exercises" :loading />

    <UPagination v-model:page="page" :items-per-page="limit" :total="pagination.total" />
  </div>
</template>
