import { fileURLToPath } from 'node:url'
import { describe, it, expect, vi } from 'vitest'
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
    expect(publicNs.config).toBeUndefined()
    expect('config' in publicNs).toBe(false)
    expect(publicNs.string()).toBe('x')
  })

  it('hides non-configurable config on real Zod namespace', async () => {
    const { z } = await import('zod/v4')
    const publicNs = createPublicZodNamespace(z)
    expect(publicNs.config).toBeUndefined()
    expect(publicNs.string().safeParse(1).success).toBe(false)
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
})
