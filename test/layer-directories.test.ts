import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Nuxt } from '@nuxt/schema'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { listNuxtZodLayerDirectories } from '../src/build/layer-directories'

const tempDirs: string[] = []

function makeTempRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), 'nuxt-zod-layers-'))
  tempDirs.push(dir)
  return dir
}

afterEach(() => {
  while (tempDirs.length) {
    const dir = tempDirs.pop()!
    rmSync(dir, { recursive: true, force: true })
  }
})

function mockNuxt(root: string, overrides?: {
  sharedDir?: string
  alias?: Record<string, string>
  layerSharedDir?: string
}): Nuxt {
  const sharedDir = overrides?.sharedDir ?? 'shared'
  const layerRoot = join(root, 'base-layer')
  return {
    options: {
      rootDir: root,
      srcDir: join(root, 'app'),
      dir: { shared: sharedDir },
      alias: overrides?.alias ?? {},
      _layers: [
        {
          cwd: root,
          config: {
            rootDir: root,
            srcDir: join(root, 'app'),
            dir: { shared: sharedDir },
          },
        },
        {
          cwd: layerRoot,
          config: {
            rootDir: layerRoot,
            srcDir: layerRoot,
            dir: { shared: overrides?.layerSharedDir ?? 'shared' },
          },
        },
      ],
    },
  } as unknown as Nuxt
}

describe('listNuxtZodLayerDirectories', () => {
  it('uses Kit getLayerDirectories when provided (Kit-present branch)', () => {
    const root = makeTempRoot()
    const nuxt = mockNuxt(root)
    const getLayerDirectories = vi.fn(() => [
      {
        root: `${root}/`,
        app: `${join(root, 'app')}/`,
        shared: `${join(root, 'from-kit')}/`,
      },
    ])

    const dirs = listNuxtZodLayerDirectories(nuxt, getLayerDirectories)

    expect(getLayerDirectories).toHaveBeenCalledWith(nuxt)
    expect(dirs).toEqual([{
      root,
      app: join(root, 'app'),
      shared: join(root, 'from-kit'),
    }])
  })

  it('uses _layers fallback when Kit API is forced off (Kit-absent branch)', () => {
    const root = makeTempRoot()
    const nuxt = mockNuxt(root)
    const dirs = listNuxtZodLayerDirectories(nuxt, false)

    expect(dirs).toHaveLength(2)
    expect(dirs[0]).toEqual({
      root,
      app: join(root, 'app'),
      shared: join(root, 'shared'),
    })
    expect(dirs[1]).toEqual({
      root: join(root, 'base-layer'),
      app: join(root, 'base-layer'),
      shared: join(root, 'base-layer', 'shared'),
    })
  })

  it('resolves dir.shared through resolveAlias in the Nuxt 3 fallback', () => {
    const root = makeTempRoot()
    const lib = join(root, 'lib')
    const nuxt = mockNuxt(root, {
      sharedDir: '#lib',
      alias: { '#lib': lib },
      layerSharedDir: '#lib',
    })

    const dirs = listNuxtZodLayerDirectories(nuxt, false)

    expect(dirs[0]!.shared).toBe(lib)
    // Layer alias resolves relative to that layer root when alias value is absolute — here #lib is absolute.
    expect(dirs[1]!.shared).toBe(lib)
  })
})
