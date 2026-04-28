import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch as testFetch } from '@nuxt/test-utils/e2e'

type ErrorPayload = {
  statusCode?: number
  statusMessage?: string
  data?: {
    validation?: boolean
    issues?: {
      body?: Array<{ code?: string, message?: string }>
      query?: Array<{ code?: string, message?: string }>
      params?: Array<{ code?: string, message?: string }>
    }
  }
}

async function postJson(path: string, body: unknown) {
  return await testFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function readErrorPayload(res: Response) {
  return await res.json() as ErrorPayload
}

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
      }) as { success: boolean }
      expect(result.success).toBe(true)
    })

    it('useZod() auto-import rejects an invalid payload', async () => {
      const result = await $fetch('/api/validate', {
        method: 'POST',
        body: { name: 123 },
      }) as { success: boolean }
      expect(result.success).toBe(false)
    })
  })

  describe('event.validate() matrix', () => {
    it('validates body only', async () => {
      const result = await $fetch('/api/validate-body', {
        method: 'POST',
        body: { name: 'nuxt-zod' },
      }) as { ok: boolean, body: { name: string } }
      expect(result.ok).toBe(true)
      expect(result.body.name).toBe('nuxt-zod')
    })

    it('validates query only', async () => {
      const result = await $fetch('/api/validate-query?page=3') as {
        ok: boolean
        query: { page: number }
      }
      expect(result.ok).toBe(true)
      expect(result.query.page).toBe(3)
    })

    it('validates params only', async () => {
      const result = await $fetch('/api/validate-params/slug-ok') as {
        ok: boolean
        params: { slug: string }
      }
      expect(result.ok).toBe(true)
      expect(result.params.slug).toBe('slug-ok')
    })

    it('validates body + query', async () => {
      const result = await $fetch('/api/validate-event?page=2', {
        method: 'POST',
        body: { name: 'nuxt-zod' },
      }) as { ok: boolean, body: { name: string }, query: { page?: number } }
      expect(result.ok).toBe(true)
      expect(result.body.name).toBe('nuxt-zod')
      expect(result.query.page).toBe(2)
    })

    it('validates body + params', async () => {
      const result = await $fetch('/api/validate-body-params/9', {
        method: 'POST',
        body: { name: 'nuxt-zod' },
      }) as { ok: boolean, body: { name: string }, params: { id: number } }
      expect(result.ok).toBe(true)
      expect(result.params.id).toBe(9)
      expect(result.body.name).toBe('nuxt-zod')
    })

    it('validates query + params', async () => {
      const result = await $fetch('/api/validate-query-params/7?page=4') as {
        ok: boolean
        query: { page: number }
        params: { id: number }
      }
      expect(result.ok).toBe(true)
      expect(result.query.page).toBe(4)
      expect(result.params.id).toBe(7)
    })

    it('validates body + query + params', async () => {
      const result = await $fetch('/api/validate-all/11?page=5', {
        method: 'POST',
        body: { name: 'nuxt-zod' },
      }) as {
        ok: boolean
        body: { name: string }
        query: { page: number }
        params: { id: number }
      }
      expect(result.ok).toBe(true)
      expect(result.body.name).toBe('nuxt-zod')
      expect(result.query.page).toBe(5)
      expect(result.params.id).toBe(11)
    })
  })

  describe('event.validate() errors and config', () => {
    it('applies global validation defaults from nuxt.config', async () => {
      const res = await postJson('/api/validate-event', { name: 123 })
      expect(res.status).toBe(409)
      expect(res.statusText).toBe('Global validation failed')

      const payload = await readErrorPayload(res)
      expect(payload.data?.validation).toBe(true)
      expect(Array.isArray(payload.data?.issues?.body)).toBe(true)
      expect(payload.data?.issues?.body?.length).toBeGreaterThan(0)
      expect(payload.data?.issues?.body?.[0]?.code).toBeTruthy()
      expect(payload.data?.issues?.body?.[0]?.message).toBeTruthy()
    })

    it('returns grouped issues when multiple sources fail together', async () => {
      const res = await postJson('/api/validate-multi-errors/0?page=oops', { name: 'x' })
      expect(res.status).toBe(409)

      const payload = await readErrorPayload(res)
      expect(payload.data?.validation).toBe(true)
      expect(Array.isArray(payload.data?.issues?.body)).toBe(true)
      expect(Array.isArray(payload.data?.issues?.query)).toBe(true)
      expect(Array.isArray(payload.data?.issues?.params)).toBe(true)
      expect(payload.data?.issues?.body?.length).toBeGreaterThan(0)
      expect(payload.data?.issues?.query?.length).toBeGreaterThan(0)
      expect(payload.data?.issues?.params?.length).toBeGreaterThan(0)
    })

    it('allows local status override', async () => {
      const res = await postJson('/api/validate-local-status', { name: 123 })
      expect(res.status).toBe(422)
      expect(res.statusText).toBe('Local status override')

      const payload = await readErrorPayload(res)
      expect(payload.data?.validation).toBe(true)
      expect(Array.isArray(payload.data?.issues?.body)).toBe(true)
    })

    it('omits issues when includeIssues is false in local options', async () => {
      const res = await postJson('/api/validate-event-noissues', { name: 123 })
      expect(res.status).toBe(422)
      expect(res.statusText).toBe('Bad input')

      const payload = await readErrorPayload(res)
      expect(payload.data?.validation).toBe(true)
      expect(payload.data?.issues).toBeUndefined()
    })
  })
})
