import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch as testFetch } from '@nuxt/test-utils/e2e'
import { createPublicZodNamespace } from '../src/runtime/zod-config'
import {
  prepareAppZodConfig,
  prepareNitroZodConfig,
  resetZodConfigContextState,
} from '../src/runtime/zod-context-config'

const noopBeforeParse = () => {}

describe('zod-config helpers', () => {
  it('omits config on the public namespace without inconsistent traps', () => {
    const target = { config: () => {}, string: () => 'x' }
    const publicNs = createPublicZodNamespace(target, { beforeParse: noopBeforeParse })
    expect(publicNs.config).toBeUndefined()
    expect('config' in publicNs).toBe(false)
    expect(Object.getOwnPropertyDescriptor(publicNs, 'config')).toBeUndefined()
    expect(publicNs.string()).toBe('x')
  })

  it('hides non-configurable config on real Zod namespace', async () => {
    const { z } = await import('zod/v4')
    const publicNs = createPublicZodNamespace(z, { beforeParse: noopBeforeParse })
    expect(publicNs.config).toBeUndefined()
    expect('config' in publicNs).toBe(false)
    expect(Object.getOwnPropertyDescriptor(publicNs, 'config')).toBeUndefined()
    expect(Object.keys(publicNs).length).toBeGreaterThan(0)
    expect(publicNs.string().safeParse(1).success).toBe(false)
  })

  it('re-prepares before parse on schemas from non-configurable factories', async () => {
    resetZodConfigContextState()
    const { z } = await import('zod/v4')
    const { registerNitroZodEffectiveBaseline, registerAppZodEffectiveBaseline } = await import('../src/runtime/zod-context-config')
    registerNitroZodEffectiveBaseline(z)
    registerAppZodEffectiveBaseline(z)

    const publicNs = createPublicZodNamespace(z, {
      beforeParse: () => prepareAppZodConfig(z, { customError: () => 'app-stored-schema' }),
    })
    const storedSchema = publicNs.string()
    prepareNitroZodConfig(z, { customError: () => 'nitro-pollution' })
    const message = storedSchema.safeParse(1).error?.issues[0]?.message
    expect(message).toBe('app-stored-schema')
  })

  it('switches app and nitro config without leaking customError', async () => {
    resetZodConfigContextState()
    const { z } = await import('zod/v4')
    const { registerNitroZodEffectiveBaseline, registerAppZodEffectiveBaseline } = await import('../src/runtime/zod-context-config')
    registerNitroZodEffectiveBaseline(z)
    registerAppZodEffectiveBaseline(z)

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
    expect(html).toContain('consumer-plugin-ok')
  })

  it('round-trips distinct app and nitro messages (SSR → Nitro → SSR)', async () => {
    const htmlBefore = await $fetch('/')
    expect(htmlBefore).toContain('injected-app-zod-config')

    const nitro = await $fetch('/api/zod-config', { method: 'POST' }) as {
      message: string
      configHidden: boolean
    }
    expect(nitro.message).toBe('injected-nitro-zod-config')
    expect(nitro.configHidden).toBe(true)

    const htmlAfter = await $fetch('/')
    expect(htmlAfter).toContain('injected-app-zod-config')
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

  it('applies nitro config before parse on module-load schema (virtual-z-registration)', async () => {
    const result = await $fetch('/api/virtual-z-registration') as { message: string }
    expect(result.message).toBe('updated virtual config')
  })

  it('keeps app config when schema is created before await under concurrent work', async () => {
    const htmlPromise = $fetch('/zod-config-schema-before-await')
    await new Promise<void>(resolve => setTimeout(resolve, 10))
    const nitroPromise = $fetch('/api/concurrency-yield', { method: 'POST' })
    const [html, nitro] = await Promise.all([htmlPromise, nitroPromise]) as [
      string,
      { message: string },
    ]

    expect(html).toContain('injected-app-zod-config')
    expect(nitro.message).toBe('injected-nitro-zod-config')
  })

  it('re-prepares nitro config in event.validate after await under concurrent SSR', async () => {
    const htmlPromise = $fetch('/zod-config-schema-before-await')
    await new Promise<void>(resolve => setTimeout(resolve, 10))
    const validatePromise = testFetch('/api/validate-concurrency-yield', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 123 }),
    })
    const [html, validateRes] = await Promise.all([htmlPromise, validatePromise])
    const validatePayload = await validateRes.json() as {
      data?: { issues?: { body?: Array<{ message?: string }> } }
    }

    expect(html).toContain('injected-app-zod-config')
    expect(validateRes.status).toBe(422)
    expect(validatePayload.data?.issues?.body?.[0]?.message).toBe('injected-nitro-zod-config')
  })

  it('keeps app and nitro configs isolated under concurrent SSR and API work', async () => {
    const htmlPromise = $fetch('/zod-config-concurrency')
    await new Promise<void>(resolve => setTimeout(resolve, 10))
    const nitroPromise = $fetch('/api/concurrency-yield', { method: 'POST' })
    const [html, nitro] = await Promise.all([htmlPromise, nitroPromise]) as [
      string,
      { message: string },
    ]

    expect(html).toContain('injected-app-zod-config')
    expect(nitro.message).toBe('injected-nitro-zod-config')
  })
})
