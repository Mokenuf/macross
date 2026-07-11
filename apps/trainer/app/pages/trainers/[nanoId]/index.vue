<script setup lang="ts">
import { Roles } from '@macross/shared'
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'trainers.detail.title' })
const { t } = useI18n()

const route = useRoute()
const { nanoId } = route.params

const { trainer, loading } = useGetTrainer(String(nanoId))
const { remove, pending: deleting } = useDeleteTrainer()
const { data: user } = useGetMe()
const isManager = computed(() => user.value?.role === Roles.manager)
const canDelete = computed(() => isManager.value && trainer.value?.role !== Roles.manager)

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('trainers.title'), to: '/trainers' },
  ...(trainer.value ? [{ label: trainer.value.fullName }] : []),
])

const showDeleteModal = ref(false)

function openDeleteModal() {
  showDeleteModal.value = true
}

async function confirmDelete() {
  await remove(String(nanoId))
  await navigateTo('/trainers')
}
</script>

<template>
  <div>
    <div v-if="trainer">
      <BasePageHead :breadcrumbs :title="trainer.fullName" :subtitle="trainer.email">
        <template #actions>
          <div class="flex gap-2">
            <UButton
              v-if="isManager"
              :label="t('trainers.detail.viewClients')"
              icon="i-lucide-users"
              color="neutral"
              variant="outline"
              size="sm"
              :to="`/clients?trainerId=${trainer.id}`"
            />
            <UButton
              v-if="isManager"
              :label="t('common.actions.edit')"
              color="neutral"
              variant="outline"
              size="sm"
              :to="`/trainers/${trainer.nanoId}/edit`"
            />
            <UButton
              v-if="canDelete"
              :label="t('common.actions.delete')"
              color="error"
              variant="outline"
              size="sm"
              @click="openDeleteModal"
            />
          </div>
        </template>
      </BasePageHead>
      <TrainerDetail :trainer />
    </div>
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>

    <BaseConfirmModal v-model:open="showDeleteModal" :loading="deleting" @confirm="confirmDelete">
      <i18n-t keypath="common.confirmDelete.message" tag="span" scope="global">
        <template #name>
          <strong>{{ trainer ? trainer.fullName : '' }}</strong>
        </template>
      </i18n-t>
    </BaseConfirmModal>
  </div>
</template>
