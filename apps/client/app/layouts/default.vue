<script setup lang="ts">
const { t } = useI18n()
const { logout } = useLogout()
</script>

<template>
  <div class="bg-background flex min-h-screen flex-col">
    <header class="border-default flex items-center justify-between border-b p-4">
      <h1 class="text-lg font-semibold">Macross</h1>
      <div class="flex items-center gap-1">
        <LanguageSwitcher />
        <UButton
          :title="t('nav.logout')"
          icon="i-lucide-log-out"
          color="neutral"
          variant="ghost"
          @click="logout"
        />
      </div>
    </header>
    <main class="flex-1 p-4">
      <slot />
    </main>
  </div>
</template>
