<script setup lang="ts">
import { useZod } from '#imports'

defineOptions({ name: 'ZodConfigSchemaBeforeAwait' })

const z = useZod()
const schema = z.string()
await new Promise<void>(resolve => setTimeout(resolve, 80))
const parsed = schema.safeParse(123)
const appMessage = parsed.success
  ? 'no-error'
  : parsed.error.issues[0]?.message ?? 'no-message'
</script>

<template>
  <div id="schema-before-await-message">
    {{ appMessage }}
  </div>
</template>
