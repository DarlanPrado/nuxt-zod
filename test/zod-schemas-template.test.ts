import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveLayerSchemasDir, type NuxtZodLayerDirectories } from '../src/build/layer-directories'
import {
  absoluteImportSpecifier,
  discoverSchemaFilesFromLayers,
  generateUseZodSchemasSource,
  toImportSpecifier,
} from '../src/build/zod-schemas-template'

const tempDirs: string[] = []

function makeTempRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), 'nuxt-zod-schemas-'))
  tempDirs.push(dir)
  return dir
}

function writeSchema(root: string, relativePath: string, marker: string) {
  const full = join(root, relativePath)
  mkdirSync(join(full, '..'), { recursive: true })
  writeFileSync(full, `export default { marker: '${marker}' }\n`, 'utf8')
}

afterEach(() => {
  while (tempDirs.length) {
    const dir = tempDirs.pop()!
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('discoverSchemaFilesFromLayers', () => {
  it('merges schemas and lets higher-priority layer override the same key', () => {
    const base = makeTempRoot()
    const app = makeTempRoot()
    writeSchema(base, 'shared/schemas/baseOnly.ts', 'base')
    writeSchema(base, 'shared/schemas/sharedKey.ts', 'from-base')
    writeSchema(app, 'shared/schemas/sharedKey.ts', 'from-app')
    writeSchema(app, 'shared/schemas/appOnly.ts', 'app')

    const entries = discoverSchemaFilesFromLayers([
      join(app, 'shared/schemas'),
      join(base, 'shared/schemas'),
    ])

    const byKey = Object.fromEntries(
      entries.map(e => [e.segments.join('.'), e.absolutePath]),
    )
    expect(Object.keys(byKey).sort()).toEqual(['appOnly', 'baseOnly', 'sharedKey'])
    expect(byKey.sharedKey).toBe(join(app, 'shared/schemas/sharedKey.ts'))
    expect(byKey.baseOnly).toBe(join(base, 'shared/schemas/baseOnly.ts'))
    expect(byKey.appOnly).toBe(join(app, 'shared/schemas/appOnly.ts'))
  })

  it('surfaces leaf vs branch key conflict across layers when generating the registry', () => {
    const base = makeTempRoot()
    const app = makeTempRoot()
    // Base: nested branch `auth.login`; app: leaf `auth` — both keys survive merge.
    writeSchema(base, 'shared/schemas/auth/login.ts', 'base')
    writeSchema(app, 'shared/schemas/auth.ts', 'app')

    const entries = discoverSchemaFilesFromLayers([
      join(app, 'shared/schemas'),
      join(base, 'shared/schemas'),
    ])

    expect(() => generateUseZodSchemasSource(entries, {
      srcDir: join(app, 'app'),
      rootDir: app,
      sharedDir: join(app, 'shared'),
    })).toThrow(/cannot register nested schema under "auth"/)
  })
})

describe('toImportSpecifier', () => {
  it('keeps #shared for consumer root schemas', () => {
    const rootDir = makeTempRoot()
    const file = join(rootDir, 'shared/schemas/user.ts')
    writeSchema(rootDir, 'shared/schemas/user.ts', 'x')
    expect(toImportSpecifier({
      srcDir: join(rootDir, 'app'),
      rootDir,
      sharedDir: join(rootDir, 'shared'),
    }, file)).toBe('#shared/schemas/user')
  })

  it('uses absolute path for schemas outside the consumer root', () => {
    const appRoot = makeTempRoot()
    const layerRoot = makeTempRoot()
    const file = join(layerRoot, 'shared/schemas/baseOnly.ts')
    writeSchema(layerRoot, 'shared/schemas/baseOnly.ts', 'base')
    const spec = toImportSpecifier({
      srcDir: join(appRoot, 'app'),
      rootDir: appRoot,
      sharedDir: join(appRoot, 'shared'),
    }, file)
    expect(spec).toBe(absoluteImportSpecifier(file))
    expect(spec.includes('\\')).toBe(false)
  })
})

describe('generateUseZodSchemasSource with layers', () => {
  it('emits absolute imports for overridden layer files', () => {
    const base = makeTempRoot()
    const app = makeTempRoot()
    writeSchema(base, 'shared/schemas/sharedKey.ts', 'from-base')
    writeSchema(app, 'shared/schemas/sharedKey.ts', 'from-app')
    writeSchema(base, 'shared/schemas/baseOnly.ts', 'base')

    const entries = discoverSchemaFilesFromLayers([
      join(app, 'shared/schemas'),
      join(base, 'shared/schemas'),
    ])
    const source = generateUseZodSchemasSource(entries, {
      srcDir: join(app, 'app'),
      rootDir: app,
      sharedDir: join(app, 'shared'),
    })

    expect(source).toContain(`from '#shared/schemas/sharedKey'`)
    expect(source).toContain(`from '${absoluteImportSpecifier(join(base, 'shared/schemas/baseOnly.ts'))}'`)
    expect(source).toContain('sharedKey:')
    expect(source).toContain('baseOnly:')
  })
})

describe('resolveLayerSchemasDir', () => {
  it('resolves shared/schemas via layer.shared', () => {
    const layer: NuxtZodLayerDirectories = {
      root: '/proj',
      app: '/proj/app',
      shared: '/proj/common',
    }
    expect(resolveLayerSchemasDir(layer, 'shared/schemas').replace(/\\/g, '/'))
      .toBe('/proj/common/schemas')
  })

  it('resolves custom dirs from layer.root', () => {
    const layer: NuxtZodLayerDirectories = {
      root: '/proj',
      app: '/proj/app',
      shared: '/proj/shared',
    }
    expect(resolveLayerSchemasDir(layer, 'my-schemas').replace(/\\/g, '/'))
      .toBe('/proj/my-schemas')
  })
})
