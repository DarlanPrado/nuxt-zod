import {
  defineNuxtModule,
  addPlugin,
  addImports,
  addServerImports,
  addServerPlugin,
  addTemplate,
  addTypeTemplate,
  createResolver,
  useLogger,
} from '@nuxt/kit'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getNuxtZodTypeTemplateContents } from './build/nuxt-zod-type-template'
import {
  discoverSchemaFiles,
  generateUseZodSchemasSource,
  isUnderDirectory,
} from './build/zod-schemas-template'
import type { ZodErrorMessages } from './runtime/v3/zod-errors'

/** Vite/Rollup import strings must use forward slashes (Windows `join` yields `\\`). */
function runtimeImportPath(absolutePath: string): string {
  return absolutePath.replace(/\\/g, '/')
}

/**
 * From `src/module.ts` runtime lives as `.ts`; from `dist/module.mjs` the builder emits `.js` only.
 */
function resolveRuntimeEntry(zodRoot: string, ...pathSegments: string[]) {
  const base = join(zodRoot, ...pathSegments)
  const tsCandidate = `${base}.ts`
  if (existsSync(tsCandidate)) return runtimeImportPath(tsCandidate)
  const jsCandidate = `${base}.js`
  return runtimeImportPath(jsCandidate)
}

export type {
  ZodErrorMessages,
} from './runtime/v3/zod-errors'
export type {
  AnyZodSchemaPublic,
  ValidationSchema,
  ValidationSchemaInput,
  ValidationOptions,
  InferValidated,
  NuxtZodRuntimeValidation,
} from './runtime/v4/validation-types'

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
   * Auto-discovered Zod schema registries from the project (see `useZodSchemas()`).
   */
  schemas?: {
    /**
     * When false, skips scanning and does not auto-import `useZodSchemas()`.
     * @default true
     */
    enabled?: boolean
    /**
     * Directory (relative to the Nuxt project root) containing one `.ts` file per domain.
     * @default 'shared/schemas'
     */
    dir?: string
  }
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
  /**
   * Which Zod API surface nuxt-zod exposes as `z` (`useZod`, `$zod`, `#nuxt-zod/server`).
   *
   * - `'v3'` — tree-shakes `zod/v4` from the adapter bundle; `event.validate()` accepts Zod 3 schemas only.
   * - `'v4'` — uses Zod 4 Classic; `event.validate()` accepts both v3 and v4 schemas.
   *
   * When omitted, nuxt-zod defaults to `'v4'` and prints a startup warning.
   * Set this option explicitly to suppress the warning.
   *
   * @default 'v4' (auto, with warning)
   */
  zodVersion?: 'v3' | 'v4'
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
    schemas: {
      enabled: true,
      dir: 'shared/schemas',
    },
    validation: {
      statusCode: 422,
      message: 'Validation failed',
      includeIssues: true,
    },
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    let zodVersion: 'v3' | 'v4'
    if (options.zodVersion === undefined) {
      zodVersion = 'v4'
      const logger = useLogger('nuxt-zod')
      logger.warn(
        '`nuxtZod.zodVersion` is not set in nuxt.config — defaulting to "v4" automatically.\n'
        + '  Set `nuxtZod: { zodVersion: \'v4\' }` explicitly to suppress this warning.',
      )
    }
    else {
      zodVersion = options.zodVersion
    }
    const zodRoot = resolve(`./runtime/${zodVersion}`)
    const zodSpecifier = zodVersion === 'v4' ? 'zod/v4' : 'zod/v3'
    const useZodComposable = resolveRuntimeEntry(zodRoot, 'composables', 'useZod')
    const appPlugin = resolveRuntimeEntry(zodRoot, 'plugin')
    const serverUseZod = resolveRuntimeEntry(zodRoot, 'server/utils', 'useZod')
    const serverPlugin = resolveRuntimeEntry(zodRoot, 'server', 'plugin')
    const appPluginErrors = resolveRuntimeEntry(zodRoot, 'plugin-errors')
    const serverPluginErrors = resolveRuntimeEntry(zodRoot, 'server', 'plugin-errors')

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

    const schemasFeatureEnabled = options.schemas?.enabled !== false
    const schemasDirRelative = options.schemas?.dir ?? 'shared/schemas'
    const schemasRootAbsolute = join(nuxt.options.rootDir, schemasDirRelative)

    const registerUseZodSchemas = schemasFeatureEnabled && (options.client !== false || options.server !== false)

    if (registerUseZodSchemas) {
      const importPathCtx = {
        srcDir: nuxt.options.srcDir || nuxt.options.rootDir,
        rootDir: nuxt.options.rootDir,
      }

      const zodSchemasTemplate = addTemplate({
        filename: 'nuxt-zod-schemas.mts',
        write: true,
        getContents: () => {
          const entries = discoverSchemaFiles(schemasRootAbsolute)
          return generateUseZodSchemasSource(entries, importPathCtx)
        },
      })

      if (options.client !== false) {
        addImports({
          name: 'useZodSchemas',
          as: 'useZodSchemas',
          from: zodSchemasTemplate.dst,
        })
      }

      if (options.server !== false) {
        addServerImports([{
          name: 'useZodSchemas',
          as: 'useZodSchemas',
          from: zodSchemasTemplate.dst,
        }])
      }

      if (nuxt.options.dev) {
        nuxt.hook('builder:watch', async (_event, path) => {
          if (isUnderDirectory(schemasRootAbsolute, path)) {
            await nuxt.callHook('builder:generateApp')
          }
        })
      }
    }

    // ─── App-side (client + SSR) ──────────────────────────────────────────
    if (options.client !== false) {
      // Provides $zod on the NuxtApp instance
      addPlugin(appPlugin)
      if (hasGlobalZodErrorMessages) {
        // Register error-map bootstrap only when app.config declares zod.errors.
        addPlugin(appPluginErrors)
      }

      // Auto-import useZod() in all app code (components, pages, composables)
      addImports({
        name: 'useZod',
        as: 'useZod',
        from: useZodComposable,
      })
    }

    // ─── Server-side (Nitro) ──────────────────────────────────────────────
    if (options.server !== false) {
      // event.validate() on H3Event
      addServerPlugin(serverPlugin)
      if (hasGlobalZodErrorMessages) {
        // Keep error-map setup out of server bundle when unused.
        addServerPlugin(serverPluginErrors)
      }

      // Auto-import useZod() in Nitro routes, middleware, and server utils
      addServerImports([{
        name: 'useZod',
        as: 'useZod',
        from: serverUseZod,
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
      // Re-exports `z` from `zod/v3` or `zod/v4` per `nuxtZod.zodVersion` (no extra provider shim).
      nuxt.hook('nitro:config', (nitroConfig) => {
        nitroConfig.virtual ||= {}
        nitroConfig.virtual['#nuxt-zod/server'] = [
          `export { z } from '${zodSpecifier}'`,
          `export const nuxtZodProviderId = '${zodVersion}' as const`,
        ].join('\n')
      })
    }

    // ─── TypeScript augmentation ──────────────────────────────────────────
    addTypeTemplate({
      filename: 'types/nuxt-zod.d.ts',
      getContents: () => getNuxtZodTypeTemplateContents({ zodSpecifier, zodVersion }),
    })

    // Subpaths only: avoid `optimizeDeps.include: ['zod']`, which pre-bundles the package root
    // and (on older Zod) drags every `locales/*` into the analyzed client graph.
    nuxt.options.vite.optimizeDeps ||= {}
    nuxt.options.vite.optimizeDeps.include ||= []
    const viteDeps = (zodVersion === 'v4'
      ? ['zod/v3', 'zod/v4', 'zod/v4/core'] as const
      : ['zod/v3'] as const)
    for (const dep of viteDeps) {
      if (!nuxt.options.vite.optimizeDeps.include.includes(dep)) {
        nuxt.options.vite.optimizeDeps.include.push(dep)
      }
    }
  },
})
