<script setup lang="ts">
const { t } = useI18n()
const { logout } = useLogout()
</script>

<template>
  <div class="bg-background flex min-h-svh flex-col">
    <header
      class="flex items-center justify-between px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-3"
    >
      <NuxtLink to="/" class="font-logo text-primary text-lg tracking-wider uppercase">
        Macros for Progress
      </NuxtLink>
      <div class="flex items-center gap-1">
        <LanguageSwitcher />
        <UButton
          :title="t('nav.logout')"
          icon="i-lucide-log-out"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="logout"
        />
      </div>
    </header>

    <main class="flex-1 px-5 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <slot />
    </main>

    <BottomNav />
  </div>
</template>
