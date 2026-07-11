<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'clients.detail.title' })
const { t } = useI18n()

const route = useRoute()
const { nanoId } = route.params

const { client, loading, refresh } = useGetClient(String(nanoId))
const { remove, pending: deleting } = useDeleteClient()
const { reactivate, pending: reactivating } = useReactivateClient()

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('clients.title'), to: '/clients' },
  ...(client.value ? [{ label: client.value.fullName }] : []),
])

const showDeleteModal = ref(false)

function openDeleteModal() {
  showDeleteModal.value = true
}

async function confirmDelete() {
  await remove(String(nanoId))
  await navigateTo('/clients')
}

async function onReactivate() {
  await reactivate(String(nanoId))
  await refresh()
}
</script>

<template>
  <div>
    <div v-if="client">
      <BasePageHead :breadcrumbs :title="client.fullName" :subtitle="client.email">
        <template #actions>
          <div class="flex gap-2">
            <UButton
              :label="t('common.actions.edit')"
              color="neutral"
              variant="outline"
              size="sm"
              :to="`/clients/${client.nanoId}/edit`"
            />
            <UButton
              v-if="!client.deletedAt"
              :label="t('common.actions.delete')"
              color="error"
              variant="outline"
              size="sm"
              @click="openDeleteModal"
            />
            <UButton
              v-else
              :label="t('clients.actions.reactivate')"
              icon="i-lucide-rotate-ccw"
              color="neutral"
              variant="outline"
              size="sm"
              :loading="reactivating"
              @click="onReactivate"
            />
          </div>
        </template>
      </BasePageHead>
      <ClientDetail :client />
    </div>
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>

    <BaseConfirmModal v-model:open="showDeleteModal" :loading="deleting" @confirm="confirmDelete">
      <i18n-t keypath="common.confirmDelete.message" tag="span" scope="global">
        <template #name>
          <strong>{{ client ? client.fullName : '' }}</strong>
        </template>
      </i18n-t>
    </BaseConfirmModal>
  </div>
</template>
