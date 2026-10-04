const activeParseGuards = new Set<() => void>()
let reapplyingActiveParseGuards = false

/** Re-apply in-flight parse guards after another side swaps global Zod config (async refinements). */
export function reapplyActiveZodParseGuards(): void {
  if (reapplyingActiveParseGuards) {
    return
  }
  reapplyingActiveParseGuards = true
  try {
    for (const guard of activeParseGuards) {
      guard()
    }
  }
  finally {
    reapplyingActiveParseGuards = false
  }
}

function finalizeGuard<T>(result: T, guard: () => void): T {
  const maybePromise = result as unknown
  if (!maybePromise || typeof (maybePromise as Promise<unknown>).then !== 'function') {
    activeParseGuards.delete(guard)
    return result
  }
  return (maybePromise as Promise<unknown>).finally(() => {
    activeParseGuards.delete(guard)
  }) as T
}

export function invokeWithActiveZodParseGuard<T>(guard: () => void, invoke: () => T): T {
  guard()
  activeParseGuards.add(guard)
  try {
    return finalizeGuard(invoke(), guard)
  }
  catch (error) {
    activeParseGuards.delete(guard)
    throw error
  }
}
