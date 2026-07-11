<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div
    class="bg-background fixed inset-0 z-50 flex flex-col items-center justify-center text-center"
  >
    <p class="font-logo text-5xl leading-[0.88] tracking-wider uppercase">
      Macros<br /><span class="text-primary">for Progress</span>
    </p>

    <div class="absolute bottom-10 flex flex-col items-center gap-3">
      <UIcon name="i-lucide-loader-circle" class="text-primary size-7 animate-spin" />
      <p class="text-dimmed text-[11px] tracking-widest uppercase">
        {{ t('common.splash.loading') }}
      </p>
    </div>
  </div>
</template>
