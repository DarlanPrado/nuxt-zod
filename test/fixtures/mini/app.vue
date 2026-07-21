<template>
  <div>
    <div id="composable-result">
      {{ composableResult }}
    </div>
    <div id="injection-result">
      {{ injectionResult }}
    </div>
    <div id="composable-global-error">
      {{ composableGlobalError }}
    </div>
    <div id="schema-priority-error">
      {{ schemaPriorityError }}
    </div>
    <div id="use-zod-schemas-result">
      {{ useZodSchemasResult }}
    </div>
    <div id="provider-id">
      {{ providerId }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNuxtApp } from '#app'
import { useZod, useZodSchemas } from '#imports'

const { user, auth } = useZodSchemas()
const useZodSchemasResult = user.create.safeParse({ name: 'fixture' }).success
  && auth.login.body.safeParse({ token: 'ok' }).success
  ? 'use-zod-schemas-ok'
  : 'use-zod-schemas-fail'

const { $zod } = useNuxtApp()

const z = useZod()
const schema = z.object({ name: z.string() })
const composableResult = schema.safeParse({ name: 'nuxt-zod' }).success
  ? 'composable-ok'
  : 'composable-fail'

const injectionSchema = $zod.object({ version: $zod.number() })
const injectionResult = injectionSchema.safeParse({ version: 4 }).success
  ? 'injection-ok'
  : 'injection-fail'

const composableGlobalErrorResult = z.string().safeParse(123)
const composableGlobalError = composableGlobalErrorResult.success
  ? 'no-error'
  : composableGlobalErrorResult.error.issues[0]?.message ?? 'no-message'

const schemaPriorityErrorResult = z.string().check(z.minLength(5, 'schema-level-priority')).safeParse('a')
const schemaPriorityError = schemaPriorityErrorResult.success
  ? 'no-error'
  : schemaPriorityErrorResult.error.issues[0]?.message ?? 'no-message'

const providerId = 'mini'
</script>
