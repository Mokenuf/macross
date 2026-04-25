<script setup lang="ts">
import {
  createTrainerSchema,
  updateTrainerSchema,
  type CreateTrainer,
  type Trainer,
  type UpdateTrainer,
} from '@macross/shared'
import type { FormSubmitEvent } from '@nuxt/ui'

interface TrainerFormProps {
  trainer?: Trainer
}
interface TrainerFormEmits {
  submit: [payload: CreateTrainer | UpdateTrainer]
}

const { trainer } = defineProps<TrainerFormProps>()
const emit = defineEmits<TrainerFormEmits>()

const isEdit = computed(() => !!trainer)
const schema = computed(() => (isEdit.value ? updateTrainerSchema : createTrainerSchema))

const state = reactive<Partial<CreateTrainer & UpdateTrainer>>({
  fullName: trainer?.fullName ?? '',
  email: trainer?.email ?? '',
  phone: trainer?.phone ?? '',
  avatarUrl: trainer?.avatarUrl ?? '',
})

function onSubmit(event: FormSubmitEvent<CreateTrainer | UpdateTrainer>) {
  emit('submit', event.data)
}
</script>

<template>
  <UForm :schema :state class="space-y-4" @submit="onSubmit">
    <UFormField label="Nombre completo" name="fullName" required>
      <UInput v-model="state.fullName" placeholder="Sebastián Censi" class="w-full" />
    </UFormField>
    <UFormField v-if="!isEdit" label="Email" name="email" required>
      <UInput v-model="state.email" type="email" placeholder="seba@macross.com" class="w-full" />
    </UFormField>
    <UFormField label="Teléfono" name="phone">
      <UInput v-model="state.phone" placeholder="+5491112345678" class="w-full" />
    </UFormField>
    <UFormField v-if="isEdit" label="URL de avatar" name="avatarUrl">
      <UInput
        v-model="state.avatarUrl"
        placeholder="https://cdn.macross.com/avatar.png"
        class="w-full"
      />
    </UFormField>
    <div class="flex justify-end gap-3">
      <UButton
        class="cursor-pointer"
        label="Cancelar"
        color="neutral"
        variant="ghost"
        to="/trainers"
      />
      <UButton
        class="cursor-pointer"
        type="submit"
        :label="isEdit ? 'Guardar cambios' : 'Invitar entrenador'"
      />
    </div>
  </UForm>
</template>
