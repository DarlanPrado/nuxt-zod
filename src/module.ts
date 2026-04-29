import {
  defineNuxtModule,
  addPlugin,
  addImports,
  addServerImports,
  addServerPlugin,
  addTypeTemplate,
  createResolver,
} from '@nuxt/kit'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { ZodErrorMessages } from './runtime/zod-errors'

export type {
  ZodErrorMessages,
} from './runtime/zod-errors'
export type {
  ValidationSchema,
  ValidationSchemaInput,
  ValidationOptions,
  InferValidated,
  NuxtZodRuntimeValidation,
} from './runtime/server/utils/validation'

export interface ModuleOptions {
  /**
   * Enable $zod injection and useZod() auto-import in the Nuxt app (client + SSR).
   * @default true
   */
  client?: boolean
  /**
   * Enable useZod() auto-import, #nuxt-zod/server, and event.validate() in Nitro.
   * @default true
   */
  server?: boolean
  /**
   * Default options for `event.validate()` error responses (overridable per call).
   */
  validation?: {
    /**
     * HTTP status for Zod validation failures.
     * @default 422
     */
    statusCode?: number
    /**
     * Error message (H3 `statusMessage`).
     * @default 'Validation failed'
     */
    message?: string
    /**
     * When true, failed responses include `data.issues` with Zod issues per `body` / `query` / `params`.
     * @default true
     */
    includeIssues?: boolean
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-zod',
    configKey: 'nuxtZod',
    compatibility: { nuxt: '>=3.0.0' },
  },
  defaults: {
    client: true,
    server: true,
    validation: {
      statusCode: 422,
      message: 'Validation failed',
      includeIssues: true,
    },
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    type NuxtZodRuntimeConfig = {
      validation?: {
        statusCode?: number
        message?: string
        includeIssues?: boolean
      }
      errors?: ZodErrorMessages
    }
    const appConfigErrorMessages = (
      nuxt.options.appConfig as { zod?: { errors?: ZodErrorMessages } } | undefined
    )?.zod?.errors
    const hasAppConfigFile = (nuxt.options._layers || []).some((layer) => {
      const root = layer.config.srcDir || layer.cwd
      return [
        'app.config.ts',
        'app.config.mts',
        'app.config.js',
        'app.config.mjs',
        'app/app.config.ts',
        'app/app.config.mts',
        'app/app.config.js',
        'app/app.config.mjs',
      ].some(file => existsSync(join(root, file)))
    })
    const hasGlobalZodErrorMessages
      = !!(appConfigErrorMessages && Object.keys(appConfigErrorMessages).length > 0)
        || hasAppConfigFile

    // ─── App-side (client + SSR) ──────────────────────────────────────────
    if (options.client !== false) {
      // Provides $zod on the NuxtApp instance
      addPlugin(resolve('./runtime/plugin'))
      if (hasGlobalZodErrorMessages) {
        // Register error-map bootstrap only when app.config declares zod.errors.
        addPlugin(resolve('./runtime/plugin-errors'))
      }

      // Auto-import useZod() in all app code (components, pages, composables)
      addImports({
        name: 'useZod',
        as: 'useZod',
        from: resolve('./runtime/composables/useZod'),
      })
    }

    // ─── Server-side (Nitro) ──────────────────────────────────────────────
    if (options.server !== false) {
      // event.validate() on H3Event
      addServerPlugin(resolve('./runtime/server/plugin'))
      if (hasGlobalZodErrorMessages) {
        // Keep error-map setup out of server bundle when unused.
        addServerPlugin(resolve('./runtime/server/plugin-errors'))
      }

      // Auto-import useZod() in Nitro routes, middleware, and server utils
      addServerImports([{
        name: 'useZod',
        as: 'useZod',
        from: resolve('./runtime/server/utils/useZod'),
      }])

      // Expose validation defaults to Nitro (useRuntimeConfig in server)
      nuxt.options.runtimeConfig = nuxt.options.runtimeConfig || { public: {} }
      const moduleRuntimeConfig = nuxt.options.runtimeConfig as {
        nuxtZod?: NuxtZodRuntimeConfig
      }
      const currentNuxtZodRuntimeConfig = (
        moduleRuntimeConfig.nuxtZod as NuxtZodRuntimeConfig | undefined
      ) || {}
      moduleRuntimeConfig.nuxtZod = {
        ...currentNuxtZodRuntimeConfig,
        validation: {
          ...currentNuxtZodRuntimeConfig.validation,
          statusCode: options.validation?.statusCode ?? 422,
          message: options.validation?.message ?? 'Validation failed',
          includeIssues: options.validation?.includeIssues !== false,
        },
        errors: appConfigErrorMessages ?? currentNuxtZodRuntimeConfig.errors,
      }

      // Explicit import alias: import { z } from '#nuxt-zod/server'
      nuxt.hook('nitro:config', (nitroConfig) => {
        nitroConfig.virtual ||= {}
        nitroConfig.virtual['#nuxt-zod/server'] = `export { z } from 'zod'`
      })
    }

    // ─── TypeScript augmentation ──────────────────────────────────────────
    addTypeTemplate({
      filename: 'types/nuxt-zod.d.ts',
      getContents: () => `// Auto-generated by nuxt-zod
import type { z } from 'zod'

type ZodErrorRuleMessages = {
  default?: string
  [rule: string]: string | undefined
}

type ZodErrorTypeConfig = string | ZodErrorRuleMessages

type ZodErrorMessages = {
  iso?: ZodErrorRuleMessages
  string?: ZodErrorTypeConfig
  number?: ZodErrorTypeConfig
  boolean?: ZodErrorTypeConfig
  date?: ZodErrorTypeConfig
  array?: ZodErrorTypeConfig
  object?: ZodErrorTypeConfig
  bigint?: ZodErrorTypeConfig
  null?: ZodErrorTypeConfig
  undefined?: ZodErrorTypeConfig
  default?: string
  [key: string]: string | ZodErrorRuleMessages | ZodErrorTypeConfig | undefined
}

declare module '#app' {
  interface NuxtApp {
    $zod: typeof z
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $zod: typeof z
  }
}

declare module '#nuxt-zod/server' {
  export { z } from 'zod'
  export type { ValidationSchema, ValidationSchemaInput, ValidationOptions, InferValidated, NuxtZodRuntimeValidation } from 'nuxt-zod'
}

declare module 'nuxt/schema' {
  interface AppConfigInput {
    zod?: {
      errors?: ZodErrorMessages
    }
  }
  interface AppConfig {
    zod?: {
      errors?: ZodErrorMessages
    }
  }
}

export {}
`,
    })

    // ─── Vite: pre-bundle zod for faster dev HMR and cold start ──────────
    nuxt.options.vite.optimizeDeps ||= {}
    nuxt.options.vite.optimizeDeps.include ||= []
    if (!nuxt.options.vite.optimizeDeps.include.includes('zod')) {
      nuxt.options.vite.optimizeDeps.include.push('zod')
    }
  },
})
