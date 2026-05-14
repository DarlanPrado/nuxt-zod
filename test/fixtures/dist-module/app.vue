<template>
  <div id="dist-module-app">
    {{ marker }}
  </div>
</template>

<script setup lang="ts">
const z = useZod()
const marker = z.string().safeParse('ok').success ? 'dist-module-app-ok' : 'dist-module-app-fail'
</script>
