import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('nuxt-zod layers', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/layers', import.meta.url)),
  })

  it('useZodSchemas() merges layer schemas with app override priority', async () => {
    const html = await $fetch('/')
    expect(html).toContain('layers-schemas-ok')
  })

  it('useZodSchemas() on Nitro uses merged registry from layers', async () => {
    const result = await $fetch('/api/zod-schemas-layers', {
      method: 'POST',
      body: { source: 'app-layer' },
    }) as {
      ok: boolean
      source: string
      hasBaseOnly: boolean
      hasAppOnly: boolean
    }
    expect(result.ok).toBe(true)
    expect(result.source).toBe('app-layer')
    expect(result.hasBaseOnly).toBe(true)
    expect(result.hasAppOnly).toBe(true)
  })
})
