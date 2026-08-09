<template>
  <div>
    <div id="layers-schemas-result">
      {{ layersSchemasResult }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useZodSchemas } from '#imports'

const { baseOnly, sharedKey, appOnly } = useZodSchemas()

const layersSchemasResult
  = baseOnly.ping.safeParse({ from: 'base' }).success
    && appOnly.ping.safeParse({ from: 'app' }).success
    && sharedKey.body.safeParse({ source: 'app-layer' }).success
    && !sharedKey.body.safeParse({ source: 'base-layer' }).success
    ? 'layers-schemas-ok'
    : 'layers-schemas-fail'
</script>
