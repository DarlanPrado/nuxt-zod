import { describe, it, expect } from 'vitest'
import { getNuxtZodTypeTemplateContents } from '../src/build/nuxt-zod-type-template'

describe('getNuxtZodTypeTemplateContents', () => {
  it('emits H3Event.validate when serverEnabled is true', () => {
    const contents = getNuxtZodTypeTemplateContents({
      zodSpecifier: 'zod/v4',
      zodVersion: 'v4',
      serverEnabled: true,
    })
    expect(contents).toContain('declare module \'h3\'')
    expect(contents).toContain('validate:')
    expect(contents).toContain('$zod: typeof z')
    expect(contents).toContain('declare module \'#nuxt-zod/server\'')
    expect(contents).toContain('ValidationSchemaInput')
  })

  it('omits H3Event.validate when serverEnabled is false', () => {
    const contents = getNuxtZodTypeTemplateContents({
      zodSpecifier: 'zod/v4',
      zodVersion: 'v4',
      serverEnabled: false,
    })
    expect(contents).not.toContain('declare module \'h3\'')
    expect(contents).not.toContain('validate:')
    expect(contents).toContain('$zod: typeof z')
    expect(contents).toContain('declare module \'#nuxt-zod/server\'')
    expect(contents).toContain('ZodErrorMessages')
  })
})
