<script setup lang="ts">
interface BaseConfirmModalProps {
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  icon?: string
}

interface BaseConfirmModalEmits {
  confirm: []
}

const {
  title,
  confirmLabel,
  cancelLabel,
  loading = false,
  icon = 'i-lucide-triangle-alert',
} = defineProps<BaseConfirmModalProps>()

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<BaseConfirmModalEmits>()

const { t } = useI18n()

function cancel() {
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" :dismissible="!loading">
    <template #content>
      <div class="p-5">
        <div class="flex items-start gap-3">
          <div
            class="bg-error/10 text-error flex size-9.5 shrink-0 items-center justify-center rounded-full"
          >
            <UIcon :name="icon" class="size-4.5" />
          </div>
          <div class="space-y-1">
            <h3 class="font-semibold">{{ title ?? t('common.confirmDelete.title') }}</h3>
            <div class="text-muted text-sm"><slot /></div>
          </div>
        </div>
        <div class="mt-4.5 flex justify-end gap-2.5">
          <UButton
            :label="cancelLabel ?? t('common.actions.cancel')"
            color="neutral"
            variant="ghost"
            :disabled="loading"
            @click="cancel"
          />
          <UButton
            :label="confirmLabel ?? t('common.actions.delete')"
            color="error"
            variant="solid"
            :loading="loading"
            @click="emit('confirm')"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
