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
