<template>
  <div>
    <div id="app-custom-error">
      {{ appCustomError }}
    </div>
    <div id="config-hidden">
      {{ configHidden }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useZod } from '#imports'

const z = useZod()
const parsed = z.string().safeParse(123)
const appCustomError = parsed.success
  ? 'no-error'
  : parsed.error.issues[0]?.message ?? 'no-message'

const configHidden = typeof z.config === 'undefined' ? 'config-hidden-ok' : 'config-exposed'
</script>
