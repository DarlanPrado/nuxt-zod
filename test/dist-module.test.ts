import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

function buildModulePackage() {
  const cli = join(repoRoot, 'node_modules', '@nuxt', 'module-builder', 'dist', 'cli.mjs')
  if (!existsSync(cli)) {
    throw new Error(`nuxt-module-build CLI não encontrado em ${cli}`)
  }
  execFileSync(process.execPath, [cli, 'build'], { cwd: repoRoot, stdio: 'inherit' })
}

describe('nuxt-zod (dist entry)', async () => {
  buildModulePackage()

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/dist-module', import.meta.url)),
  })

  it('carrega o módulo a partir de dist/module.mjs (app + plugins)', async () => {
    const html = await $fetch('/')
    expect(html).toContain('dist-module-app-ok')
  })

  it('carrega o módulo a partir de dist/module.mjs (Nitro + useZod)', async () => {
    const data = await $fetch('/api/dist-module-smoke') as { ok?: boolean }
    expect(data.ok).toBe(true)
  })
})
