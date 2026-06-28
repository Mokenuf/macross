<script setup lang="ts">
import type { UpdateEquipment } from '@macross/shared'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'Editar Equipamiento' })

const route = useRoute()
const { slug } = route.params

const { equipment, loading } = useGetEquipment(String(slug))
const { update, pending } = useUpdateEquipment()

function onSubmit(data: UpdateEquipment) {
  update(String(slug), data)
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <h1 class="mb-6 text-2xl font-bold">Editar Equipamiento</h1>
    <EquipmentForm v-if="equipment" :equipment :loading="pending" @submit="onSubmit" />
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
