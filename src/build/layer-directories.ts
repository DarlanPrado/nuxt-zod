import { join, resolve } from 'node:path'
import type { Nuxt } from '@nuxt/schema'
import { resolveAlias } from '@nuxt/kit'
import * as nuxtKit from '@nuxt/kit'

export interface NuxtZodLayerDirectories {
  /** Layer rootDir (trailing slash optional; callers should normalize). */
  root: string
  /** Layer srcDir / app directory. */
  app: string
  /** Resolved shared directory for the layer. */
  shared: string
}

type GetLayerDirectories = (nuxt?: Nuxt) => Array<{
  root: string
  app: string
  shared: string
}>

type KitWithLayers = typeof nuxtKit & {
  getLayerDirectories?: GetLayerDirectories
}

/** Plain path fields only — avoid assigning full `NuxtOptions` (TS deep instantiation). */
interface LayerPathFields {
  rootDir?: string
  srcDir?: string
  dir?: { shared?: string }
}

function stripTrailingSlash(path: string): string {
  return path.replace(/[/\\]+$/, '')
}

function defaultGetLayerDirectories(): GetLayerDirectories | false {
  const fromKit = (nuxtKit as KitWithLayers).getLayerDirectories
  return typeof fromKit === 'function' ? fromKit : false
}

/**
 * Build `{ root, app, shared }` like Kit `getLayerDirectories`:
 * `shared = resolve(root, resolveAlias(dir.shared || 'shared', alias))`.
 */
function toLayerDirectories(
  paths: LayerPathFields,
  cwd: string,
  alias: Record<string, string> | undefined,
): NuxtZodLayerDirectories {
  const root = stripTrailingSlash(paths.rootDir || cwd)
  const app = stripTrailingSlash(paths.srcDir || cwd)
  const sharedAlias = paths.dir?.shared || 'shared'
  const shared = stripTrailingSlash(
    resolve(root, resolveAlias(sharedAlias, alias)),
  )
  return { root, app, shared }
}

/**
 * Preferred path: Nuxt Kit `getLayerDirectories` (Nuxt 4 / recent Kit).
 */
function mapKitLayerDirectories(
  nuxt: Nuxt,
  getLayerDirectories: GetLayerDirectories,
): NuxtZodLayerDirectories[] {
  return getLayerDirectories(nuxt).map(dirs => ({
    root: stripTrailingSlash(dirs.root),
    app: stripTrailingSlash(dirs.app),
    shared: stripTrailingSlash(dirs.shared),
  }))
}

/**
 * Nuxt 3 compatibility when Kit lacks `getLayerDirectories`.
 * Same shape from private `nuxt.options._layers`, with `resolveAlias` for `dir.shared`.
 */
function listLayerDirectoriesNuxt3Fallback(nuxt: Nuxt): NuxtZodLayerDirectories[] {
  const projectRoot = stripTrailingSlash(nuxt.options.rootDir)
  const layers = nuxt.options._layers || []
  const alias = nuxt.options.alias as Record<string, string> | undefined

  return layers.map((layer) => {
    const config = layer.config as LayerPathFields
    const layerRoot = stripTrailingSlash(config.rootDir || layer.cwd)

    // Root project: use resolved `nuxt.options` (not the raw layer config).
    if (layerRoot === projectRoot) {
      return toLayerDirectories({
        rootDir: nuxt.options.rootDir,
        srcDir: nuxt.options.srcDir,
        dir: nuxt.options.dir as LayerPathFields['dir'],
      }, layer.cwd, alias)
    }

    return toLayerDirectories(config, layer.cwd, alias)
  })
}

/**
 * Layer directories ordered by Nuxt priority (index 0 = highest / project).
 *
 * - **Nuxt 4+:** Kit `getLayerDirectories`
 * - **Nuxt 3:** {@link listLayerDirectoriesNuxt3Fallback} when Kit lacks that API
 *
 * @param nuxt Nuxt instance
 * @param getLayerDirectories Pass `false` to force the Nuxt 3 `_layers` fallback (tests).
 */
export function listNuxtZodLayerDirectories(
  nuxt: Nuxt,
  getLayerDirectories: GetLayerDirectories | false = defaultGetLayerDirectories(),
): NuxtZodLayerDirectories[] {
  if (getLayerDirectories !== false)
    return mapKitLayerDirectories(nuxt, getLayerDirectories)

  return listLayerDirectoriesNuxt3Fallback(nuxt)
}

/**
 * Resolve `nuxtZod.schemas.dir` for a layer.
 * Paths under `shared/` use the layer's resolved `shared` directory (respects `dir.shared`).
 */
export function resolveLayerSchemasDir(
  layer: NuxtZodLayerDirectories,
  schemasDirRelative: string,
): string {
  const relativeDir = schemasDirRelative.replace(/\\/g, '/').replace(/\/+$/, '')

  // `shared` / `shared/...` → respect the layer's resolved `dir.shared`
  if (relativeDir === 'shared')
    return layer.shared

  if (relativeDir.startsWith('shared/')) {
    const underShared = relativeDir.slice('shared/'.length)
    return join(layer.shared, underShared)
  }

  return join(layer.root, relativeDir)
}
