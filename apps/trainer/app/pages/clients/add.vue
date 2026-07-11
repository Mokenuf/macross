<script setup lang="ts">
import type { CreateClient, UpdateClient } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'clients.add.title' })

const { t } = useI18n()
const { create, pending } = useCreateClient()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('clients.title'), to: '/clients' },
  { label: t('common.actions.add') },
])

function onSubmit(data: CreateClient | UpdateClient) {
  if (!('email' in data)) return
  create(data)
}
</script>

<template>
  <div>
    <BasePageHead
      :breadcrumbs
      :title="t('clients.add.heading')"
      :subtitle="t('clients.add.subtitle')"
    />
    <ClientForm :loading="pending" @submit="onSubmit" />
  </div>
</template>
