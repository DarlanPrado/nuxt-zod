import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { createPublicZodNamespace } from '../src/runtime/zod-config'
import {
  prepareAppZodConfig,
  prepareNitroZodConfig,
  resetZodConfigContextState,
} from '../src/runtime/zod-context-config'

describe('zod-config helpers', () => {
  it('omits config on the public namespace without inconsistent traps', () => {
    const target = { config: () => {}, string: () => 'x' }
    const publicNs = createPublicZodNamespace(target)
    expect(publicNs.config).toBeUndefined()
    expect('config' in publicNs).toBe(false)
    expect(Object.getOwnPropertyDescriptor(publicNs, 'config')).toBeUndefined()
    expect(publicNs.string()).toBe('x')
  })

  it('hides non-configurable config on real Zod namespace', async () => {
    const { z } = await import('zod/v4')
    const publicNs = createPublicZodNamespace(z)
    expect(publicNs.config).toBeUndefined()
    expect('config' in publicNs).toBe(false)
    expect(Object.getOwnPropertyDescriptor(publicNs, 'config')).toBeUndefined()
    expect(publicNs.string().safeParse(1).success).toBe(false)
  })

  it('switches app and nitro config without leaking customError', async () => {
    resetZodConfigContextState()
    const { z } = await import('zod/v4')

    prepareAppZodConfig(z, { customError: () => 'app-only' })
    expect(z.string().safeParse(1).error?.issues[0]?.message).toBe('app-only')

    prepareNitroZodConfig(z, undefined)
    const nitroMessage = z.string().safeParse(1).error?.issues[0]?.message
    expect(nitroMessage).not.toBe('app-only')

    prepareAppZodConfig(z, { customError: () => 'app-again' })
    expect(z.string().safeParse(1).error?.issues[0]?.message).toBe('app-again')
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
})
