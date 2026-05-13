import { defineNitroPlugin } from 'nitropack/runtime'
import { runEventValidation } from './utils/validation'
import type { H3Event } from 'h3'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const h3Event = event as H3Event
    h3Event.validate = (schema, options) => {
      return runEventValidation(h3Event, schema, options)
    }
  })
})
