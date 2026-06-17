<script setup lang="ts">
import type { CreateClient, UpdateClient } from '@macross/shared'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'Agregar Cliente' })

const { create, pending } = useCreateClient()

function onSubmit(data: CreateClient | UpdateClient) {
  if (!('email' in data)) return
  create(data)
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <h1 class="mb-6 text-2xl font-bold">Invitar Cliente</h1>
    <ClientForm :loading="pending" @submit="onSubmit" />
  </div>
</template>
