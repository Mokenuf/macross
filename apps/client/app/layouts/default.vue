<script setup lang="ts">
const { error } = useGetProfile()

const { t } = useI18n()

const supabase = useSupabaseClient()

const toast = useToast()

// `immediate` porque el error llega ya seteado desde SSR/payload: no hay cambio que observar.
watch(
  error,
  async err => {
    if (!import.meta.client) return
    if (err?.statusCode !== 401 && err?.statusCode !== 403) return

    // Soltar la sesión y no solo navegar: `guest` rebota a `/` a cualquiera con sesión viva.
    await supabase.auth.signOut()
    toast.add({
      title: t('auth.toasts.sessionRevoked'),
      description: t('auth.toasts.sessionRevokedDescription'),
      color: 'error',
    })
    await navigateTo('/auth/login', { external: true })
  },
  { immediate: true },
)
</script>

<template>
  <div class="bg-background flex h-dvh flex-col overflow-hidden">
    <header class="flex shrink-0 items-center px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
      <NuxtLink to="/" class="font-logo text-primary text-lg tracking-wider uppercase">
        Macros for Progress
      </NuxtLink>
    </header>

    <main class="min-h-0 flex-1 overflow-y-auto px-5 pt-1">
      <slot />
    </main>

    <BottomNav />
  </div>
</template>
