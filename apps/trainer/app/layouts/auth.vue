<template>
  <div
    class="bg-default relative flex min-h-screen items-center justify-center bg-[radial-gradient(110%_70%_at_80%_-10%,rgba(199,514,99,0.12),transparent_55%)]"
  >
    <div class="absolute top-4 right-4">
      <LanguageSwitcher />
    </div>
    <slot />
  </div>
</template>
