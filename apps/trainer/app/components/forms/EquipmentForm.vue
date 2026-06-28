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

const { equipment, loading = false } = defineProps<EquipmentFormProps>()
const emit = defineEmits<EquipmentFormEmits>()

const state = reactive<Partial<CreateEquipment>>({
  name: equipment?.name ?? '',
})

function onSubmit(event: FormSubmitEvent<CreateEquipment>) {
  emit('submit', event.data)
}
</script>

<template>
  <UForm :schema="createEquipmentSchema" :state class="space-y-4" @submit="onSubmit">
    <UFormField label="Nombre" name="name" required>
      <UInput v-model="state.name" placeholder="Ej: Mancuerna" class="w-full" />
    </UFormField>

    <div class="flex justify-end gap-3">
      <UButton label="Cancelar" color="neutral" variant="ghost" to="/equipment" />
      <UButton class="cursor-pointer" type="submit" label="Guardar" :loading />
    </div>
  </UForm>
</template>
