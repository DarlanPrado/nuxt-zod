import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch as testFetch } from '@nuxt/test-utils/e2e'

async function isZodMiniAvailable(): Promise<boolean> {
  try {
    await import('zod/mini')
    return true
  }
  catch {
    return false
  }
}

const hasMini = await isZodMiniAvailable()

describe.runIf(hasMini)('nuxt-zod mini', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/mini', import.meta.url)),
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

    it('applies global zod errors from app.config in app runtime', async () => {
      const html = await $fetch('/')
      expect(html).toContain('nao é um texto')
    })

    it('keeps schema-level message priority in app runtime', async () => {
      const html = await $fetch('/')
      expect(html).toContain('schema-level-priority')
    })

    it('useZodSchemas() aggregates shared/schemas with nested namespaces', async () => {
      const html = await $fetch('/')
      expect(html).toContain('use-zod-schemas-ok')
    })
  })

  describe('nitro-side', () => {
    it('useZod() exposes the Zod Mini namespace', async () => {
      const result = await $fetch('/api/provider') as { providerId: string }
      expect(result.providerId).toBe('mini')
    })

    it('useZod() auto-import validates a correct payload', async () => {
      const result = await $fetch('/api/use-zod', {
        method: 'POST',
        body: { name: 'nuxt-zod' },
      }) as { success: boolean }
      expect(result.success).toBe(true)
    })

    it('useZod() auto-import rejects an invalid payload', async () => {
      const result = await $fetch('/api/use-zod', {
        method: 'POST',
        body: { name: 123 },
      }) as { success: boolean }
      expect(result.success).toBe(false)
    })

    it('useZodSchemas() works with event.validate on Nitro', async () => {
      const result = await $fetch('/api/zod-schemas-test', {
        method: 'POST',
        body: { token: 'nitro-token' },
      }) as { ok: boolean, token?: string }
      expect(result.ok).toBe(true)
      expect(result.token).toBe('nitro-token')
    })

    it('applies global zod errors in nitro runtime', async () => {
      const result = await $fetch('/api/validate-global-error', {
        method: 'POST',
        body: { name: 123 },
      }) as { ok: boolean, message?: string }
      expect(result.ok).toBe(false)
      expect(result.message).toBe('nao é um texto')
    })

    it('keeps schema-level message priority in nitro runtime', async () => {
      const result = await $fetch('/api/validate-global-error', {
        method: 'POST',
        body: { mode: 'schema', name: 'a' },
      }) as { ok: boolean, message?: string }
      expect(result.ok).toBe(false)
      expect(result.message).toBe('schema-level-priority')
    })
  })

  describe('event.validate()', () => {
    it('validates body only', async () => {
      const result = await $fetch('/api/validate-body', {
        method: 'POST',
        body: { name: 'nuxt-zod' },
      }) as { ok: boolean, body: { name: string } }
      expect(result.ok).toBe(true)
      expect(result.body.name).toBe('nuxt-zod')
    })

    it('rejects invalid body with 422 and issues', async () => {
      const res = await testFetch('/api/validate-body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 123 }),
      })
      expect(res.status).toBe(422)
      const payload = await res.json() as {
        statusMessage?: string
        data?: { validation?: boolean, issues?: { body?: unknown[] } }
      }
      expect(payload.statusMessage).toBe('Validation failed')
      expect(payload.data?.validation).toBe(true)
      expect(payload.data?.issues?.body?.length).toBeGreaterThan(0)
    })
  })
})

describe.runIf(!hasMini)('nuxt-zod mini (skipped — zod/mini unavailable)', () => {
  it('skips when peer Zod does not export zod/mini', () => {
    expect(hasMini).toBe(false)
  })
})
