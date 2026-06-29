<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  title: 'nav.dashboard',
})

const { data: user, pending } = useGetMe()
const { t } = useI18n()
</script>

<template>
  <div v-if="pending" class="flex items-center gap-2 text-neutral-400">
    <UIcon name="i-lucide-loader-2" class="animate-spin" />
    {{ t('common.table.loading') }}
  </div>
  <div v-else-if="user">
    <h1 class="text-2xl font-bold">{{ t('dashboard.greeting', { name: user.fullName }) }}</h1>
    <p class="mt-2 text-neutral-400">{{ t('dashboard.welcome') }}</p>
    <UBadge :color="user.role === 'manager' ? 'error' : 'info'" class="mt-3">
      {{ t(`dashboard.roles.${user.role}`) }}
    </UBadge>
  </div>
</template>
