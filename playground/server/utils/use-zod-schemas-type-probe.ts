import type { z } from 'zod'

/**
 * Compile-time guard: fails `vue-tsc -p server/tsconfig.json` when `useZodSchemas()` is untyped (`any`).
 */
export function _useZodSchemasTypeProbe() {
  const { session: _session } = useZodSchemas()
  type Login = typeof _session.login
  type LoginBody = z.infer<Login>
  // @ts-expect-error password is required on session.login
  const _incomplete: LoginBody = { email: 'you@example.com' }
  return _incomplete
}
