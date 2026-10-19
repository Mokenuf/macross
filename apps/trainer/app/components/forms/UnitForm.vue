<script setup lang="ts">
import { createUnitSchema, UnitKinds, type CreateUnit, type Unit } from '@macross/shared'
import type { FormSubmitEvent } from '@nuxt/ui'

interface UnitFormProps {
  unit?: Unit
  loading?: boolean
}
interface UnitFormEmits {
  submit: [payload: CreateUnit]
}

const { t } = useI18n()
const { unit, loading = false } = defineProps<UnitFormProps>()
const emit = defineEmits<UnitFormEmits>()
const { kindOptions } = useUnitOptions()

const form = useTemplateRef('form')
useRevalidateOnLocale(() => form.value)

const state = reactive<Partial<CreateUnit>>({
  nameEs: unit?.nameEs ?? '',
  nameEn: unit?.nameEn ?? '',
  kind: unit?.kind ?? UnitKinds.count,
  isDefault: unit?.isDefault ?? false,
})

const isCurrentDefault = unit?.isDefault ?? false

function onSubmit(event: FormSubmitEvent<CreateUnit>) {
  emit('submit', event.data)
}
</script>

<template>
  <UForm ref="form" :schema="createUnitSchema" :state class="space-y-4" @submit="onSubmit">
    <div class="grid grid-cols-2 gap-4">
      <UFormField :label="t('units.form.nameEs')" name="nameEs" required>
        <UInput
          v-model="state.nameEs"
          :placeholder="t('units.form.nameEsExample')"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="t('units.form.nameEn')" name="nameEn" required>
        <UInput
          v-model="state.nameEn"
          :placeholder="t('units.form.nameEnExample')"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField :label="t('units.form.kind')" name="kind" :help="t('units.form.kindHelp')" required>
      <USelectMenu
        v-model="state.kind"
        :items="kindOptions"
        value-key="value"
        :search-input="false"
        class="w-full"
      />
    </UFormField>

    <USwitch
      v-model="state.isDefault"
      :disabled="isCurrentDefault"
      :label="t('units.form.isDefault')"
      :description="
        isCurrentDefault ? t('units.form.isDefaultLocked') : t('units.form.isDefaultHint')
      "
    />

    <div class="flex justify-end gap-3">
      <UButton :label="t('common.actions.cancel')" color="neutral" variant="outline" to="/units" />
      <UButton type="submit" :label="t('common.actions.save')" :loading />
    </div>
  </UForm>
</template>
