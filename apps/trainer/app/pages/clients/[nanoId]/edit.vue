<script setup lang="ts">
import type { CreateClient, UpdateClient } from '@macross/shared'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'clients.edit.title' })

const { t } = useI18n()
const route = useRoute()
const { nanoId } = route.params

const { client, loading } = useGetClient(String(nanoId))
const { update, pending } = useUpdateClient()

function onSubmit(data: CreateClient | UpdateClient) {
  update(String(nanoId), data as UpdateClient)
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <h1 class="mb-6 text-2xl font-bold">{{ t('clients.edit.title') }}</h1>
    <ClientForm v-if="client" :client :loading="pending" @submit="onSubmit" />
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
