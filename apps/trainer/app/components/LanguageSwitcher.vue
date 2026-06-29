<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { locale, locales, setLocale } = useI18n()

const flags: Record<string, string> = {
  es: 'i-circle-flags-ar',
  en: 'i-circle-flags-us',
}

const items = computed<DropdownMenuItem[]>(() =>
  locales.value.map(l => ({
    label: l.name,
    icon: flags[l.code],
    onSelect: () => setLocale(l.code),
  })),
)
</script>

<template>
  <UDropdownMenu :items>
    <UButton
      :icon="flags[locale]"
      trailing-icon="i-lucide-chevron-down"
      variant="ghost"
      color="neutral"
      size="sm"
    />
  </UDropdownMenu>
</template>
