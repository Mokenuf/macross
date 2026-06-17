<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth', title: 'Detalle del cliente' })

const route = useRoute()
const { nanoId } = route.params

const { client, loading } = useGetClient(String(nanoId))
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <div v-if="client">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold">{{ client.fullName }}</h1>
        <UButton icon="i-lucide-pencil" label="Editar" :to="`/clients/${client.nanoId}/edit`" />
      </div>
      <ClientDetail :client />
    </div>
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
