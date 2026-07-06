export interface NuxtZodLocaleOptions {
  /** Active locale applied via `z.config()` on the client. */
  default: string
  /** Locale files kept in the client bundle for `z.locales.*`. */
  locales: string[]
}

export type NuxtZodLocaleOption = string | NuxtZodLocaleOptions

export type ResolvedNuxtZodLocaleConfig = {
  default: string
  locales: string[]
}

export function resolveNuxtZodLocaleConfig(
  option?: NuxtZodLocaleOption,
): ResolvedNuxtZodLocaleConfig {
  if (option === undefined) {
    return { default: 'en', locales: [] }
  }
  if (typeof option === 'string') {
    return { default: option, locales: [] }
  }
  return {
    default: option.default,
    locales: [...new Set(option.locales)],
  }
}

export function createZodLocaleClientPluginSource(defaultLocale: string): string {
  return `import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: 'nuxt-zod-locale',
  enforce: 'pre',
  async setup() {
    const { z } = await import('zod/v4')
    const { default: locale } = await import('zod/v4/locales/${defaultLocale}.js')
    z.config(locale())
  },
})
`
}

const EMPTY_BARREL = 'export {}\n'
const NOOP_LOCALE_ID = '\0nuxt-zod:noop-locale'
const ZOD_LOCALES_INDEX = '/zod/v4/locales/index.js'

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

function filterZodLocalesIndex(source: string, localeFiles: string[]): string {
  if (localeFiles.length === 0) {
    return EMPTY_BARREL
  }
  const allowed = new Set(localeFiles.map(file => `./${file}.js`))
  const lines = source.split(/\r?\n/).filter((line) => {
    const match = line.match(/from\s+['"](\.\/[^'"]+)['"]/)
    return match !== null && allowed.has(match[1]!)
  })
  return lines.length > 0 ? `${lines.join('\n')}\n` : EMPTY_BARREL
}

/** Vite plugin: trims Zod's locale barrel and noops built-in `en` when another default is set. */
export function createZodLocaleStubPlugin(
  { default: defaultLocale, locales }: ResolvedNuxtZodLocaleConfig,
  clientBuild = true,
) {
  const skipBuiltInEn = defaultLocale !== 'en'

  return {
    name: 'nuxt-zod:locale-stub',
    enforce: 'pre' as const,
    resolveId(source: string, importer: string | undefined) {
      if (!clientBuild || !skipBuiltInEn) {
        return
      }
      const normalized = normalizePath(source)
      const fromExternal = importer !== undefined && normalizePath(importer).includes('/zod/v4/classic/external')
      if (fromExternal && (normalized.endsWith('/locales/en.js') || normalized === 'zod/v4/locales/en.js')) {
        return NOOP_LOCALE_ID
      }
    },
    load(id: string) {
      if (id === NOOP_LOCALE_ID) {
        return 'export default function noopLocale() { return {} }\n'
      }
    },
    transform(code: string, id: string) {
      if (clientBuild && normalizePath(id).includes(ZOD_LOCALES_INDEX)) {
        return filterZodLocalesIndex(code, locales)
      }
    },
  }
}
