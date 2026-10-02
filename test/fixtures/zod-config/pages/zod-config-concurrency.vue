<script setup lang="ts">
import { useZod } from '#imports'

defineOptions({ name: 'ZodConfigConcurrency' })

const z = useZod()
await new Promise<void>(resolve => setTimeout(resolve, 80))
const parsed = z.string().safeParse(123)
const appMessage = parsed.success
  ? 'no-error'
  : parsed.error.issues[0]?.message ?? 'no-message'
</script>

<template>
  <div id="concurrency-app-message">
    {{ appMessage }}
  </div>
</template>
