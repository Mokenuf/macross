<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'equipment.pages.detail' })
const { t, locale } = useI18n()
const { localizedName } = useLocalizedName()

const route = useRoute()
const { slug } = route.params

const { equipment, loading } = useGetEquipment(String(slug))
const { remove, pending } = useDeleteEquipment()
const { data: user } = useGetMe()
const isManager = computed(() => user.value?.role === 'manager')

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('equipment.title'), to: '/equipment' },
  ...(equipment.value ? [{ label: localizedName(equipment.value) }] : []),
])

const otherName = computed(() => {
  if (!equipment.value) return undefined
  return locale.value === 'en' ? equipment.value.nameEs : (equipment.value.nameEn ?? undefined)
})

const showDeleteModal = ref(false)

function openDeleteModal() {
  showDeleteModal.value = true
}

async function confirmDelete() {
  await remove(String(slug))
  await navigateTo('/equipment')
}
</script>

<template>
  <div>
    <div v-if="equipment">
      <BasePageHead :breadcrumbs :title="localizedName(equipment)" :subtitle="otherName">
        <template v-if="isManager" #actions>
          <div class="flex gap-2">
            <UButton
              :label="t('common.actions.edit')"
              color="neutral"
              variant="outline"
              size="sm"
              :to="`/equipment/${equipment.slug}/edit`"
            />
            <UButton
              :label="t('common.actions.delete')"
              color="error"
              variant="outline"
              size="sm"
              @click="openDeleteModal"
            />
          </div>
        </template>
      </BasePageHead>
      <EquipmentDetail :equipment />
    </div>
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>

    <BaseConfirmModal v-model:open="showDeleteModal" :loading="pending" @confirm="confirmDelete">
      <i18n-t keypath="common.confirmDelete.message" tag="span" scope="global">
        <template #name>
          <strong>{{ equipment ? localizedName(equipment) : '' }}</strong>
        </template>
      </i18n-t>
    </BaseConfirmModal>
  </div>
</template>
