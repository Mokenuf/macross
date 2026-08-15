<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

const { locale } = useI18n()

const booting = ref(true)

useHead({
  titleTemplate: '%s | Macros for Progress',
})

onMounted(() => {
  // El rAF le da un frame al primer paint: apagar el splash en el mismo tick lo hace parpadear.
  requestAnimationFrame(() => (booting.value = false))
})
</script>

<template>
  <UApp :locale="locales[locale]">
    <NuxtPwaAssets />
    <AppSplash v-if="booting" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
