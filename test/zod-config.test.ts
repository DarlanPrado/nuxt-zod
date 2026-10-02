import { fileURLToPath } from 'node:url'
import { describe, it, expect, vi } from 'vitest'
import { createAppZodAccessProxy, initAppZodRuntime, sealAppZodRuntime } from '../src/runtime/app-zod-runtime'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import {
  applyZodConfigToNamespace,
  createPublicZodNamespace,
  getNitroConfigGeneration,
  registerInjectedZodConfig,
} from '../src/runtime/zod-config'

describe('zod-config helpers', () => {
  it('omits config on the public namespace', () => {
    const target = { config: () => {}, string: () => 'x' }
    const publicNs = createPublicZodNamespace(target)
    expect(Reflect.get(publicNs, 'config')).toBeUndefined()
    expect('config' in publicNs).toBe(false)
    expect(publicNs.string()).toBe('x')
  })

  it.each(['v3', 'v4', 'mini'] as const)('supports reflection and late configuration for %s', async (version) => {
    const raw = version === 'mini' ? await import('zod/mini') : version === 'v3' ? (await import('zod/v3')).z : (await import('zod/v4')).z
    const restoreConfig = (() => {
      if ('config' in raw) {
        const originalConfig = { ...raw.config() }
        return () => raw.config({ customError: undefined, ...originalConfig })
      }
      const originalErrorMap = raw.getErrorMap()
      return () => raw.setErrorMap(originalErrorMap)
    })()
    try {
      const { useZod } = await import(`../src/runtime/${version}/server/utils/useZod.ts`)
      const { z } = await import(`../src/runtime/${version}/server/public-z.ts`)
      const app: { $zodConfig?: { customError: () => string } } = {}
      initAppZodRuntime(app, raw)
      const appZod = createAppZodAccessProxy<typeof raw>(app)
      for (const namespace of [createPublicZodNamespace(raw), useZod(), z, appZod]) {
        expect(Reflect.get(namespace, 'config')).toBeUndefined()
        expect('config' in namespace).toBe(false)
        expect(Reflect.ownKeys(namespace)).not.toContain('config')
        expect(Object.keys(namespace)).toContain('string')
        expect(Object.getOwnPropertyDescriptor(namespace, 'config')).toBeUndefined()
        expect({ ...namespace }.string).toBe(raw.string)
        const schema = namespace.string()
        expect(schema).toBeInstanceOf('ZodMiniString' in namespace ? namespace.ZodMiniString : namespace.ZodString)
      }

      registerInjectedZodConfig({ customError: () => 'late server config' })
      expect(useZod().string().safeParse(123).error?.issues[0]?.message).toBe('late server config')
      registerInjectedZodConfig({ customError: () => 'updated server config' })
      expect(z.string().safeParse(123).error?.issues[0]?.message).toBe('updated server config')

      app.$zodConfig = { customError: () => 'consumer plugin config' }
      expect(appZod.string().safeParse(123).error?.issues[0]?.message).toBe('consumer plugin config')
      sealAppZodRuntime(app)
      expect(useZod().string().safeParse(123).error?.issues[0]?.message).toBe('updated server config')
      expect(appZod.string().safeParse(123).error?.issues[0]?.message).toBe('consumer plugin config')
    }
    finally {
      registerInjectedZodConfig({})
      restoreConfig()
    }
  })

  it('applies customError via setErrorMap when config() is missing', () => {
    const setErrorMap = vi.fn()
    const zod = { setErrorMap }
    applyZodConfigToNamespace(zod, {
      customError: () => 'mapped',
    })
    expect(setErrorMap).toHaveBeenCalled()
  })

  it('re-applies Nitro config when registerInjectedZodConfig runs again', () => {
    const before = getNitroConfigGeneration()
    registerInjectedZodConfig({ customError: () => 'a' })
    registerInjectedZodConfig({ customError: () => 'b' })
    expect(getNitroConfigGeneration()).toBe(before + 2)
  })
})

describe('nuxt-zod $zodConfig fixture', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/zod-config', import.meta.url)),
  })

  it('applies consumer $zodConfig in the app before publishing $zod', async () => {
    const html = await $fetch('/')
    expect(html).toContain('injected-app-zod-config')
    expect(html).toContain('config-hidden-ok')
  })

  it('applies registerInjectedZodConfig on Nitro before useZod()', async () => {
    const result = await $fetch('/api/zod-config', { method: 'POST' }) as {
      message: string
      configHidden: boolean
    }
    expect(result.message).toBe('injected-nitro-zod-config')
    expect(result.configHidden).toBe(true)
  })

  it('applies config on import { z } from #nuxt-zod/server', async () => {
    const result = await $fetch('/api/virtual-z-import', { method: 'POST' }) as {
      message: string
      configHidden: boolean
    }
    expect(result.message).toBe('injected-nitro-zod-config')
    expect(result.configHidden).toBe(true)
  })

  it('configures an existing schema immediately on virtual registration', async () => {
    const result = await $fetch('/api/virtual-z-registration')
    expect(result).toEqual({ message: 'updated virtual config' })
  })

  it('provides configured $zod during consumer plugin setup', async () => {
    expect(await $fetch('/')).toContain('consumer-plugin-ok')
  })
})
