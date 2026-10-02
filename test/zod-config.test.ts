import { fileURLToPath } from 'node:url'
import { describe, it, expect, vi } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import {
  applyZodConfigToNamespace,
  omitZodConfigMethod,
} from '../src/runtime/zod-config'

describe('zod-config helpers', () => {
  it('omits config on the public namespace', () => {
    const target = { config: () => {}, string: () => 'x' }
    const publicNs = omitZodConfigMethod(target)
    expect(publicNs.config).toBeUndefined()
    expect('config' in publicNs).toBe(false)
    expect(publicNs.string()).toBe('x')
  })

  it('applies customError via setErrorMap when config() is missing', () => {
    const setErrorMap = vi.fn()
    const zod = { setErrorMap }
    applyZodConfigToNamespace(zod, {
      customError: () => 'mapped',
    })
    expect(setErrorMap).toHaveBeenCalled()
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
})
