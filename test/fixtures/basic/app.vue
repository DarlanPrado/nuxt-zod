<template>
  <div>
    <div id="composable-result">
      {{ composableResult }}
    </div>
    <div id="injection-result">
      {{ injectionResult }}
    </div>
  </div>
</template>

<script setup lang="ts">
const { $zod } = useNuxtApp()

// useZod() composable (auto-imported)
const z = useZod()
const schema = z.object({ name: z.string() })
const composableResult = schema.safeParse({ name: 'nuxt-zod' }).success
  ? 'composable-ok'
  : 'composable-fail'

// $zod injection on NuxtApp
const injectionSchema = $zod.object({ version: $zod.number() })
const injectionResult = injectionSchema.safeParse({ version: 4 }).success
  ? 'injection-ok'
  : 'injection-fail'
</script>
