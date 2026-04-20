import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('nuxt-zod', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  describe('app-side', () => {
    it('useZod() composable validates schema successfully', async () => {
      const html = await $fetch('/')
      expect(html).toContain('composable-ok')
    })

    it('$zod injection validates schema successfully', async () => {
      const html = await $fetch('/')
      expect(html).toContain('injection-ok')
    })
  })

  describe('nitro-side', () => {
    it('useZod() auto-import validates a correct payload', async () => {
      const result = await $fetch('/api/validate', {
        method: 'POST',
        body: { name: 'nuxt-zod' },
      })
      expect(result.success).toBe(true)
    })

    it('useZod() auto-import rejects an invalid payload', async () => {
      const result = await $fetch('/api/validate', {
        method: 'POST',
        body: { name: 123 },
      })
      expect(result.success).toBe(false)
    })
  })
})
