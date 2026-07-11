<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

const { locale } = useI18n()

const booting = ref(true)

useHead({
  titleTemplate: '%s | Macros for Progress',
})

onMounted(() => {
  // splash de arranque: se va apenas hidrata el cliente
  requestAnimationFrame(() => (booting.value = false))
})
</script>

<template>
  <UApp :locale="locales[locale]">
    <AppSplash v-if="booting" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
