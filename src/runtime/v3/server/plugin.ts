import { defineNitroPlugin } from 'nitropack/runtime'
import { runEventValidation, type ValidationSchemaInput } from './utils/validation'
import type { H3Event } from 'h3'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const h3Event = event as H3Event
    // `H3Event.validate` is augmented from `v4/validation-types` (wider schema union);
    // v3 runtime only accepts Zod 3 schemas — narrow at the boundary.
    h3Event.validate = ((schema, options) =>
      runEventValidation(h3Event, schema as ValidationSchemaInput, options)) as H3Event['validate']
  })
})
