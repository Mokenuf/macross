<script setup lang="ts">
import {
  createClientSchema,
  updateClientSchema,
  Roles,
  type BaseResponse,
  type Client,
  type CreateClient,
  type Trainer,
  type UpdateClient,
} from '@macross/shared'
import type { FormSubmitEvent } from '@nuxt/ui'

interface ClientFormProps {
  loading?: boolean
  client?: Client
}
interface ClientFormEmits {
  submit: [payload: CreateClient | UpdateClient]
}

const { client, loading = false } = defineProps<ClientFormProps>()
const emit = defineEmits<ClientFormEmits>()

const { data: me } = useGetMe()
const isManager = computed(() => me.value?.role === Roles.manager)

const { data: trainersData } = useFetch<BaseResponse<Trainer>>('/api/trainers', {
  key: 'trainers-select',
  query: { limit: 100 },
})
const trainerOptions = computed(() =>
  (trainersData.value?.rows ?? []).map(t => ({ label: t.fullName, value: t.id })),
)

const { levelOptions, goalOptions } = useClientOptions()

const isEdit = computed(() => !!client)
const schema = computed(() => (isEdit.value ? updateClientSchema : createClientSchema))

const state = reactive<Partial<CreateClient & UpdateClient>>({
  fullName: client?.fullName ?? '',
  email: client?.email ?? '',
  phone: client?.phone ?? '',
  trainerId: client?.trainerId ?? undefined,
  avatarUrl: client?.avatarUrl ?? '',
  birthDate: client?.birthDate ?? undefined,
  weightKg: client?.weightKg ?? undefined,
  heightCm: client?.heightCm ?? undefined,
  level: client?.level ?? undefined,
  goal: client?.goal ?? [],
  desiredWeeklyFrequency: client?.desiredWeeklyFrequency ?? undefined,
  injuries: client?.injuries ?? undefined,
  availableEquipment: client?.availableEquipment ?? undefined,
})

function onSubmit(event: FormSubmitEvent<CreateClient | UpdateClient>) {
  emit('submit', event.data)
}
</script>

<template>
  <UForm :schema :state class="space-y-4" @submit="onSubmit">
    <UFormField label="Nombre completo" name="fullName" required>
      <UInput v-model="state.fullName" placeholder="Fran Racciatti" class="w-full" />
    </UFormField>
    <UFormField v-if="!isEdit" label="Email" name="email" required>
      <UInput v-model="state.email" type="email" placeholder="fran@macross.com" class="w-full" />
    </UFormField>
    <UFormField v-if="isManager" label="Entrenador" name="trainerId" required>
      <USelect
        v-model="state.trainerId"
        :items="trainerOptions"
        placeholder="Asignar entrenador"
        class="w-full"
      />
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

    <USeparator label="Datos de entrenamiento" />

    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Fecha de nacimiento" name="birthDate">
        <UInput v-model="state.birthDate" type="date" class="w-full" />
      </UFormField>
      <UFormField label="Frecuencia semanal deseada" name="desiredWeeklyFrequency">
        <UInput
          v-model="state.desiredWeeklyFrequency"
          type="number"
          min="1"
          max="7"
          placeholder="3"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Peso (kg)" name="weightKg">
        <UInput v-model="state.weightKg" type="number" step="0.1" placeholder="70" class="w-full" />
      </UFormField>
      <UFormField label="Altura (cm)" name="heightCm">
        <UInput v-model="state.heightCm" type="number" placeholder="175" class="w-full" />
      </UFormField>
      <UFormField label="Nivel" name="level">
        <USelect
          v-model="state.level"
          :items="levelOptions"
          placeholder="Seleccionar nivel"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Objetivos" name="goal">
        <USelect
          v-model="state.goal"
          :items="goalOptions"
          multiple
          placeholder="Seleccionar objetivos"
          class="w-full"
        />
      </UFormField>
    </div>
    <UFormField label="Lesiones / restricciones" name="injuries">
      <UTextarea
        v-model="state.injuries"
        placeholder="Ej: Dolor lumbar crónico, no hacer sentadilla profunda"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Equipamiento disponible" name="availableEquipment">
      <UTextarea
        v-model="state.availableEquipment"
        placeholder="Ej: Mancuernas hasta 20kg, banco plano, barra y discos"
        class="w-full"
      />
    </UFormField>

    <div class="flex justify-end gap-3">
      <UButton
        class="cursor-pointer"
        label="Cancelar"
        color="neutral"
        variant="ghost"
        to="/clients"
      />
      <UButton
        class="cursor-pointer"
        type="submit"
        :label="isEdit ? 'Guardar cambios' : 'Invitar cliente'"
        :loading
      />
    </div>
  </UForm>
</template>
