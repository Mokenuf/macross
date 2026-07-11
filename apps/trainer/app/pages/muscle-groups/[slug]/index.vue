<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'muscle-groups.pages.detail' })
const { t, locale } = useI18n()
const { localizedName } = useLocalizedName()

const route = useRoute()
const { slug } = route.params

const { muscleGroup, loading } = useGetMuscleGroup(String(slug))
const { remove, pending } = useDeleteMuscleGroup()
const { data: user } = useGetMe()
const isManager = computed(() => user.value?.role === 'manager')

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('muscle-groups.title'), to: '/muscle-groups' },
  ...(muscleGroup.value ? [{ label: localizedName(muscleGroup.value) }] : []),
])

const otherName = computed(() => {
  if (!muscleGroup.value) return undefined
  return locale.value === 'en' ? muscleGroup.value.nameEs : (muscleGroup.value.nameEn ?? undefined)
})

const showDeleteModal = ref(false)

function openDeleteModal() {
  showDeleteModal.value = true
}

async function confirmDelete() {
  await remove(String(slug))
  await navigateTo('/muscle-groups')
}
</script>

<template>
  <div>
    <div v-if="muscleGroup">
      <BasePageHead :breadcrumbs :title="localizedName(muscleGroup)" :subtitle="otherName">
        <template v-if="isManager" #actions>
          <div class="flex gap-2">
            <UButton
              :label="t('common.actions.edit')"
              color="neutral"
              variant="outline"
              size="sm"
              :to="`/muscle-groups/${muscleGroup.slug}/edit`"
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
      <MuscleGroupDetail :muscle-group="muscleGroup" />
    </div>
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>

    <BaseConfirmModal v-model:open="showDeleteModal" :loading="pending" @confirm="confirmDelete">
      <i18n-t keypath="common.confirmDelete.message" tag="span" scope="global">
        <template #name>
          <strong>{{ muscleGroup ? localizedName(muscleGroup) : '' }}</strong>
        </template>
      </i18n-t>
    </BaseConfirmModal>
  </div>
</template>
