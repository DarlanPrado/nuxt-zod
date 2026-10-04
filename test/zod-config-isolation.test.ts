import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('zod-config app vs nitro isolation', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/zod-config-isolation', import.meta.url)),
  })

  it('does not leak app $zodConfig into Nitro or back into SSR', async () => {
    const htmlBefore = await $fetch('/')
    expect(htmlBefore).toContain('isolation-app-message')

    const nitro = await $fetch('/api/nitro-default', { method: 'POST' }) as {
      message: string
      configIn: boolean
      configDescriptorType: string
    }
    expect(nitro.message).toBe('isolation-nitro-zod-errors')
    expect(nitro.message).not.toBe('isolation-app-message')
    expect(nitro.configIn).toBe(false)
    expect(nitro.configDescriptorType).toBe('undefined')

    const htmlAfter = await $fetch('/')
    expect(htmlAfter).toContain('isolation-app-message')
  })
})
