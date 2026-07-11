<script setup lang="ts">
import type { CreateClient, UpdateClient } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'clients.edit.title' })

const { t } = useI18n()
const route = useRoute()
const { nanoId } = route.params

const { client, loading } = useGetClient(String(nanoId))
const { update, pending } = useUpdateClient()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('clients.title'), to: '/clients' },
  ...(client.value
    ? [{ label: client.value.fullName, to: `/clients/${client.value.nanoId}` }]
    : []),
  { label: t('common.actions.edit') },
])

function onSubmit(data: CreateClient | UpdateClient) {
  update(String(nanoId), data as UpdateClient)
}
</script>

<template>
  <div>
    <BasePageHead :breadcrumbs :title="t('clients.edit.title')" />
    <ClientForm v-if="client" :client :loading="pending" @submit="onSubmit" />
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>
  </div>
</template>
