import { captureNitroZodGlobalBaseline } from '../zod-context-config'

captureNitroZodGlobalBaseline()

/** Nitro Zod namespace — configured via `registerInjectedZodConfig` (separate from app `$zodConfig`). */
export { z } from 'zod/v4'
