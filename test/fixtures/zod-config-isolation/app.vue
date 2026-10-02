<template>
  <div>
    <div id="ssr-app-message">
      {{ ssrMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
const z = useZod()
const parsed = z.string().safeParse(123)
const ssrMessage = parsed.success
  ? 'no-error'
  : parsed.error.issues[0]?.message ?? 'no-message'
</script>
