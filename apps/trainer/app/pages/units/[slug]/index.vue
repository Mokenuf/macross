<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'units.pages.detail' })
const { t, locale } = useI18n()
const { localizedName } = useLocalizedName()

const route = useRoute()
const { slug } = route.params

const { unit, loading } = useGetUnit(String(slug))
const { remove, pending } = useDeleteUnit()
const { data: user } = useGetMe()
const isManager = computed(() => user.value?.role === 'manager')

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('units.title'), to: '/units' },
  ...(unit.value ? [{ label: localizedName(unit.value) }] : []),
])

const otherName = computed(() => {
  if (!unit.value) return undefined
  return locale.value === 'en' ? unit.value.nameEs : (unit.value.nameEn ?? undefined)
})

const showDeleteModal = ref(false)

function openDeleteModal() {
  showDeleteModal.value = true
}

async function confirmDelete() {
  await remove(String(slug))
  await navigateTo('/units')
}
</script>

<template>
  <div>
    <div v-if="unit">
      <BasePageHead :breadcrumbs :title="localizedName(unit)" :subtitle="otherName">
        <template v-if="isManager" #actions>
          <div class="flex gap-2">
            <UButton
              :label="t('common.actions.edit')"
              color="neutral"
              variant="outline"
              size="sm"
              :to="`/units/${unit.slug}/edit`"
            />
            <UButton
              v-if="!unit.isDefault"
              :label="t('common.actions.delete')"
              color="error"
              variant="outline"
              size="sm"
              @click="openDeleteModal"
            />
          </div>
        </template>
      </BasePageHead>
      <UnitDetail :unit />
    </div>
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>

    <BaseConfirmModal v-model:open="showDeleteModal" :loading="pending" @confirm="confirmDelete">
      <i18n-t keypath="common.confirmDelete.message" tag="span" scope="global">
        <template #name>
          <strong>{{ unit ? localizedName(unit) : '' }}</strong>
        </template>
      </i18n-t>
    </BaseConfirmModal>
  </div>
</template>
