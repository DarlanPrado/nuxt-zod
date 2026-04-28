# Nuxt Zod

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A [Nuxt](https://nuxt.com/) module that brings [Zod](https://zod.dev/) into your app with auto-imported composables, a `$zod` plugin, and first-class server-side support via Nitro.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Features

- 🔌 &nbsp;Auto-imported `useZod()` composable — available in components, pages, and Nitro server routes
- 🛠 &nbsp;`$zod` plugin instance accessible anywhere via `useNuxtApp()`
- 🌐 &nbsp;Server-side support with `useZod()` auto-import in Nitro and explicit `#nuxt-zod/server` alias
- ✅ &nbsp;`event.validate()` on `H3Event` — validate `body`, `query`, and `params` with typed results and configurable `422` errors
- 🏷️ &nbsp;Full TypeScript augmentation for `NuxtApp` and Vue component instances
- ⚡ &nbsp;Zod pre-bundled for faster Vite HMR and cold starts
- 📦 &nbsp;Compatible with Zod v3 and v4

## Why use nuxt-zod?

`nuxt-zod` gives you a Nuxt-native Zod workflow with zero boilerplate.

- Auto-imported `useZod()` — no manual imports needed
- `$zod` plugin available globally across the app
- Nitro server routes get `useZod()` auto-imported too
- Explicit `#nuxt-zod/server` alias for static analysis and tree-shaking
- Full TypeScript support out of the box

## Quick Example

```ts
const z = useZod()

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18),
})

const result = userSchema.safeParse({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  age: 36,
})

console.log(result.success) // true
```

## Quick Setup

Install the module in your Nuxt project:

```bash
npx nuxi@latest module add nuxt-zod
```

Zod is now available globally in your app. ✨

## Usage

### Client-side with `useZod()`

Access the Zod `z` namespace anywhere in your app via the auto-imported `useZod()` composable:

```vue
<template>
  <div>
    <input v-model="email" placeholder="Email" />
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
const z = useZod()

const email = ref('')
const error = ref('')

const schema = z.string().email('Invalid email address')

watch(email, (value) => {
  const result = schema.safeParse(value)
  error.value = result.success ? '' : result.error.issues[0].message
})
</script>
```

### `$zod` plugin

The `$zod` instance is also available via `useNuxtApp()`:

```ts
const { $zod } = useNuxtApp()

const schema = $zod.object({ name: $zod.string() })
```

### Server-side with `useZod()` (Nitro auto-import)

`useZod()` is auto-imported in all Nitro server routes, middleware, and utils:

```ts
// server/api/validate.ts
export default defineEventHandler(async (event) => {
  const z = useZod()
  const body = await readBody(event)

  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
  })

  const result = schema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error.issues })
  }

  return { success: true, data: result.data }
})
```

### Nitro `event.validate()` (body, query, params)

`H3Event` is extended with `event.validate()` to parse the request once and return only the fields you list. Schemas can be combined in any way (`body`, `query`, `params`, or any combination). On failure, the response body (Nuxt / h3) includes your payload under `data`, with Zod issues when `includeIssues` is true.

```ts
// server/api/example.post.ts
export default defineEventHandler(async (event) => {
  const z = useZod()
  const { body, query } = await event.validate({
    body: z.object({ name: z.string() }),
    query: z.object({ page: z.coerce.number().optional() }),
  })
  return { ok: true, body, query }
})
```

`event.validate()` uses async-safe parsing, so async Zod refinements/transforms are supported.

Default error behavior is configured under `nuxtZod.validation` (see below). You can override it per call: `await event.validate(schemas, { statusCode, message, includeIssues })`.

Types for your own helpers: `ValidationSchema`, `ValidationOptions`, and `InferValidated` are exported from the `nuxt-zod` package and re-exported for types from `#nuxt-zod/server`.

#### Local override example

```ts
export default defineEventHandler(async (event) => {
  const z = useZod()
  const { body } = await event.validate(
    { body: z.object({ name: z.string().min(1) }) },
    { includeIssues: false, message: 'Bad input' },
  )
  return { ok: true, body }
})
```

#### Error payload shape (Nuxt / h3)

`event.validate()` throws `createError(...)`. In Nuxt error responses, your custom payload is nested under `data`:

```json
{
  "statusCode": 422,
  "statusMessage": "Validation failed",
  "data": {
    "validation": true,
    "issues": {
      "body": [
        { "code": "invalid_type", "message": "..." }
      ]
    }
  }
}
```

If `includeIssues` is `false`, `issues` is omitted.

### Explicit server import via `#nuxt-zod/server`

For static analysis or when you prefer explicit imports in server code:

```ts
// server/api/validate.ts
import { z } from '#nuxt-zod/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const schema = z.object({ name: z.string() })
  const result = schema.safeParse(body)
  return { success: result.success }
})
```

## Configuration

### Module options (`nuxt.config.ts`)

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-zod'],
  nuxtZod: {
    client: true, // Enable useZod() + $zod in app code (default: true)
    server: true, // Enable useZod() + #nuxt-zod/server + event.validate() in Nitro (default: true)
    validation: {
      statusCode: 422,
      message: 'Validation failed',
      includeIssues: true,
    },
  },
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `client` | `boolean` | `true` | Enables `$zod` plugin and `useZod()` auto-import for client + SSR code |
| `server` | `boolean` | `true` | Enables `useZod()` auto-import in Nitro, registers the `#nuxt-zod/server` alias, and Nitro plugin for `event.validate()` |
| `validation` | `object` | see below | Defaults for `event.validate()` errors (`statusCode`, `message`, `includeIssues`) |

`validation` defaults:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `statusCode` | `number` | `422` | HTTP status when Zod validation fails |
| `message` | `string` | `'Validation failed'` | `statusMessage` / error message on the thrown error |
| `includeIssues` | `boolean` | `true` | When true, error `data` includes `issues` grouped by `body` / `query` / `params` |

### Exported types

You can import and reuse these types in your own server helpers:

```ts
import type { ValidationSchema, ValidationOptions, InferValidated } from 'nuxt-zod'
```

## Troubleshooting

### `Property 'validate' does not exist on type 'H3Event'`

- Run `npm run dev:prepare` to regenerate Nuxt/Nitro generated types.
- If the error is in `playground/server/*`, restart `nuxt dev playground` after type generation.
- Ensure the module is enabled with `server: true` in `nuxtZod` options.

### `/` returns page not found in playground

- Keep `playground/app.vue` as shell (`<NuxtPage />`).
- Put page content under `playground/pages/index.vue` and additional routes in `playground/pages/*`.

## Comparison

| | Without nuxt-zod | With nuxt-zod |
|---|---|---|
| Auto-import composable | Manual `import { z } from 'zod'` everywhere | `useZod()` available automatically |
| Plugin access | Manual setup in a Nuxt plugin | `$zod` injected via `useNuxtApp()` |
| Server-side support | Manual import in every server route | `useZod()` auto-imported in Nitro |
| TypeScript types | No `NuxtApp` augmentation | Full type augmentation included |

## Works well with

- Nuxt 3 / Nuxt 4
- TypeScript
- [vee-validate](https://vee-validate.logaretm.com/)
- Nuxt server routes (`server/api/*`)
- Zod v3 and v4

## Contributing

Contributions are welcome. Open an issue for bugs or feature ideas, and submit a PR when you're ready.

Normas do projeto para agentes/editores Cursor estão em [.cursor/rules/](.cursor/rules/).

For local development and test commands, see [package.json](package.json).

## License

[MIT](LICENSE) — Made with ❤️ by [Darlan Prado](https://github.com/DarlanPrado)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-zod/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-zod

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-zod.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-zod

[license-src]: https://img.shields.io/npm/l/nuxt-zod.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-zod

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com
