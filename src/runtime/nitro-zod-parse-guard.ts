import { useEvent } from 'nitropack/runtime'
import { prepareNitroZodConfig } from './zod-config'

const nitroParseGuard: { run: () => void } = {
  run: () => {},
}

export function updateNitroZodParseGuard(zodNamespace: unknown): void {
  nitroParseGuard.run = () => {
    let requestContext: object | undefined
    try {
      requestContext = useEvent().context
    }
    catch {
      requestContext = undefined
    }
    prepareNitroZodConfig(zodNamespace, undefined, requestContext)
  }
}

export function runNitroZodBeforeParse(): void {
  nitroParseGuard.run()
}
