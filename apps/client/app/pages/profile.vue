<script setup lang="ts">
const { t } = useI18n()

const user = useSupabaseUser()

definePageMeta({
  middleware: 'auth',
  title: 'nav.profile',
})

useHead({ title: t('nav.profile') })
</script>

<template>
  <div class="space-y-3">
    <h1 class="font-logo text-3xl tracking-wider uppercase">{{ t('nav.profile') }}</h1>
    <p class="text-muted text-sm">{{ user?.email }}</p>
  </div>
</template>
