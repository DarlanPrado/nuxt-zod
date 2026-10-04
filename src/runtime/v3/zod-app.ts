import { defaultErrorMap } from 'zod/v3'
import { registerV3DefaultErrorMapRestorer } from '../zod-context-config'

registerV3DefaultErrorMapRestorer((zodNamespace) => {
  const zod = zodNamespace as { setErrorMap?: (map: unknown) => void }
  zod.setErrorMap?.(defaultErrorMap)
})

export { z } from 'zod/v3'
