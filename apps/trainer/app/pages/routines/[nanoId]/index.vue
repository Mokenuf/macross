<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'routines.title' })

const { t } = useI18n()
const route = useRoute()
const nanoId = String(route.params.nanoId)

const { routine, loading } = useGetRoutine(nanoId)
const { deactivate, pending: deactivating } = useDeactivateRoutine()
const { activate, pending: activating } = useActivateRoutine()

const toggleModalOpen = ref(false)
const toggling = computed(() => deactivating.value || activating.value)
const confirmKey = computed(() => (routine.value?.active ? 'confirmDeactivate' : 'confirmActivate'))

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('routines.title'), to: '/routines' },
  ...(routine.value ? [{ label: routine.value.name }] : []),
])

const subtitle = computed(() => {
  if (!routine.value) return undefined
  const freq = t('routines.detail.frequency', {
    weeks: routine.value.weeks,
    days: routine.value.daysPerWeek,
  })
  const who = routine.value.client?.fullName ?? t('routines.noClient')
  return `${who} · ${freq}`
})

function openToggleModal() {
  toggleModalOpen.value = true
}

async function confirmToggle() {
  if (!routine.value) return
  await (routine.value.active ? deactivate(nanoId) : activate(nanoId))
  toggleModalOpen.value = false
}
</script>

<template>
  <div>
    <div v-if="routine">
      <BasePageHead :title="routine.name" :breadcrumbs :subtitle>
        <template #title-suffix>
          <BaseBadge
            v-if="routine.active"
            :label="t('routines.status.active')"
            color="success"
            shape="pill"
          />
          <BaseBadge v-else :label="t('routines.status.inactive')" color="neutral" shape="pill" />
        </template>
        <template #actions>
          <div class="flex gap-2">
            <UButton
              v-if="routine.active"
              :label="t('routines.actions.deactivate')"
              icon="i-lucide-power"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="openToggleModal"
            />
            <UButton
              v-else
              :label="t('routines.actions.activate')"
              icon="i-lucide-power"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="openToggleModal"
            />
            <!-- Duplicar (copiar rutina / desde template) todavía no está disponible. -->
            <UButton
              :label="t('routines.actions.duplicate')"
              icon="i-lucide-copy"
              color="neutral"
              variant="ghost"
              size="sm"
              disabled
            />
            <UButton
              :label="t('common.actions.edit')"
              icon="i-lucide-pencil"
              color="primary"
              size="sm"
              :to="`/routines/${routine.nanoId}/edit`"
            />
          </div>
        </template>
      </BasePageHead>
      <RoutineDetail :routine />
    </div>
    <div v-else-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
    </div>

    <BaseConfirmModal
      v-model:open="toggleModalOpen"
      :title="t(`routines.${confirmKey}.title`)"
      :confirm-label="t(`routines.${confirmKey}.confirm`)"
      :loading="toggling"
      icon="i-lucide-power"
      @confirm="confirmToggle"
    >
      {{ t(`routines.${confirmKey}.message`, { name: routine?.name ?? '' }) }}
    </BaseConfirmModal>
  </div>
</template>
