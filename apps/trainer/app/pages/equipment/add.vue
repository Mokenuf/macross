<script setup lang="ts">
import type { CreateEquipment } from '@macross/shared'

definePageMeta({ layout: 'admin', middleware: 'auth', title: 'equipment.pages.add' })

const { t } = useI18n()
const { create, pending } = useCreateEquipment()

function onSubmit(data: CreateEquipment) {
  create(data)
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl py-6">
    <h1 class="mb-6 text-2xl font-bold">{{ t('equipment.pages.add') }}</h1>
    <EquipmentForm :loading="pending" @submit="onSubmit" />
  </div>
</template>
