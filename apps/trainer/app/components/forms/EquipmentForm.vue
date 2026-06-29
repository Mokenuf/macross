<script setup lang="ts">
import { createEquipmentSchema, type CreateEquipment, type Equipment } from '@macross/shared'
import type { FormSubmitEvent } from '@nuxt/ui'

interface EquipmentFormProps {
  equipment?: Equipment
  loading?: boolean
}
interface EquipmentFormEmits {
  submit: [payload: CreateEquipment]
}

const { t } = useI18n()
const { equipment, loading = false } = defineProps<EquipmentFormProps>()
const emit = defineEmits<EquipmentFormEmits>()

const form = useTemplateRef('form')
useRevalidateOnLocale(() => form.value)

const state = reactive<Partial<CreateEquipment>>({
  nameEs: equipment?.nameEs ?? '',
  nameEn: equipment?.nameEn ?? '',
})

function onSubmit(event: FormSubmitEvent<CreateEquipment>) {
  emit('submit', event.data)
}
</script>

<template>
  <UForm ref="form" :schema="createEquipmentSchema" :state class="space-y-4" @submit="onSubmit">
    <UFormField :label="t('equipment.form.nameEs')" name="nameEs" required>
      <UInput
        v-model="state.nameEs"
        :placeholder="t('equipment.form.nameEsExample')"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="t('equipment.form.nameEn')" name="nameEn" required>
      <UInput
        v-model="state.nameEn"
        :placeholder="t('equipment.form.nameEnExample')"
        class="w-full"
      />
    </UFormField>

    <div class="flex justify-end gap-3">
      <UButton
        :label="t('common.actions.cancel')"
        color="neutral"
        variant="ghost"
        to="/equipment"
      />
      <UButton class="cursor-pointer" type="submit" :label="t('common.actions.save')" :loading />
    </div>
  </UForm>
</template>
