<script setup lang="ts">
import type { Client } from '@macross/shared'
import { differenceInYears } from 'date-fns'

interface ClientDetailProps {
  client: Client
}

const { client } = defineProps<ClientDetailProps>()

const { levelLabels, goalLabels } = useClientOptions()

const age = computed(() =>
  client.birthDate ? differenceInYears(new Date(), new Date(client.birthDate)) : null,
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <UAvatar :src="client.avatarUrl ?? undefined" :alt="client.fullName" size="xl" />
      <p class="text-lg font-medium">{{ client.fullName }}</p>
    </div>

    <div>
      <h3 class="text-sm font-medium text-neutral-500">Email</h3>
      <p class="mt-1">{{ client.email }}</p>
    </div>

    <div v-if="client.phone">
      <h3 class="text-sm font-medium text-neutral-500">Teléfono</h3>
      <p class="mt-1">{{ client.phone }}</p>
    </div>

    <div v-if="client.trainer">
      <h3 class="text-sm font-medium text-neutral-500">Entrenador</h3>
      <ULink :to="`/trainers/${client.trainer.nanoId}`" class="text-primary mt-1 inline-block">
        {{ client.trainer.fullName }}
      </ULink>
    </div>

    <USeparator label="Datos de entrenamiento" />

    <div class="grid grid-cols-2 gap-6">
      <div v-if="age !== null">
        <h3 class="text-sm font-medium text-neutral-500">Edad</h3>
        <p class="mt-1">{{ age }} años</p>
      </div>
      <div v-if="client.desiredWeeklyFrequency">
        <h3 class="text-sm font-medium text-neutral-500">Frecuencia semanal</h3>
        <p class="mt-1">{{ client.desiredWeeklyFrequency }} días</p>
      </div>
      <div v-if="client.weightKg">
        <h3 class="text-sm font-medium text-neutral-500">Peso</h3>
        <p class="mt-1">{{ client.weightKg }} kg</p>
      </div>
      <div v-if="client.heightCm">
        <h3 class="text-sm font-medium text-neutral-500">Altura</h3>
        <p class="mt-1">{{ client.heightCm }} cm</p>
      </div>
      <div v-if="client.level">
        <h3 class="text-sm font-medium text-neutral-500">Nivel</h3>
        <p class="mt-1">{{ levelLabels[client.level] }}</p>
      </div>
      <div v-if="client.goal?.length">
        <h3 class="text-sm font-medium text-neutral-500">Objetivos</h3>
        <p class="mt-1">{{ client.goal.map(g => goalLabels[g]).join(', ') }}</p>
      </div>
    </div>

    <div v-if="client.injuries">
      <h3 class="text-sm font-medium text-neutral-500">Lesiones / restricciones</h3>
      <p class="mt-1 whitespace-pre-wrap">{{ client.injuries }}</p>
    </div>

    <div v-if="client.availableEquipment">
      <h3 class="text-sm font-medium text-neutral-500">Equipamiento disponible</h3>
      <p class="mt-1 whitespace-pre-wrap">{{ client.availableEquipment }}</p>
    </div>

    <template v-if="client.notes">
      <USeparator label="Notas del entrenador" />
      <p class="whitespace-pre-wrap">{{ client.notes }}</p>
    </template>
  </div>
</template>
