## v1.3.1

[compare changes](https://github.com/DarlanPrado/nuxt-zod/compare/v1.3.0...v1.3.1)

### 🩹 Fixes

- **runtime:** Annotate plugin provide type to fix TS2883 on TypeScript 6 ([d27d12b](https://github.com/DarlanPrado/nuxt-zod/commit/d27d12b))
- **lint:** Add missing newline at end of plugin files ([4d9b6ae](https://github.com/DarlanPrado/nuxt-zod/commit/4d9b6ae))

### ❤️ Contributors

- DarlanPrado <darlandoprado2014@gmail.com>

## v1.3.0

[compare changes](https://github.com/DarlanPrado/nuxt-zod/compare/v1.2.0...v1.3.0)

### 🚀 Enhancements

- Update README with zodVersion option details, remove unused v4-mini plugin, and add dual-dispatch validation tests for Zod v3 and v4 ([1f995a2](https://github.com/DarlanPrado/nuxt-zod/commit/1f995a2))

### 🏡 Chore

- Update changelog for breaking changes and enhancements, including removal of `zod-provider` and addition of `zodVersion` option ([11d055d](https://github.com/DarlanPrado/nuxt-zod/commit/11d055d))
- Downgrade actions/checkout and actions/setup-node to v4, update node version to 22, and adjust pnpm command for workspace installation ([e603fd7](https://github.com/DarlanPrado/nuxt-zod/commit/e603fd7))
- Sync pnpm-lock.yaml after peerDependencies update ([8d06395](https://github.com/DarlanPrado/nuxt-zod/commit/8d06395))

### ❤️ Contributors

- DarlanPrado <darlandoprado2014@gmail.com>

## Unreleased

### ⚠️ Breaking changes

- Remove the `nuxt-zod/runtime/zod-provider` npm subpath and the internal `zod-provider.ts` shim. `#nuxt-zod/server` and runtime plugins/composables import `z` directly from `zod/v3` or `zod/v4` according to `nuxtZod.zodVersion`.

### Enhancements

- Add `nuxtZod.zodVersion` (`'v3' | 'v4'`, default `'v3'`) and split runtime adapters so `v3` builds omit `zod/v4` from the validation/error-map graph (tree-shaking). `v4` exposes Zod 4 Classic via `useZod` / `#nuxt-zod/server` and keeps dual `event.validate()` for v3 + v4 schemas.
- Vite `optimizeDeps.include` lists only `zod/v3` (and `zod/v4` + `zod/v4/core` when `zodVersion: 'v4'`), not the bare `zod` entry, so dev/client graphs are less likely to pull the whole package (e.g. every locale) from pre-bundling.
- Generated `types/nuxt-zod.d.ts` imports `ZodErrorMessages` from `nuxt-zod` instead of duplicating the full `app.config` error-map shape inline (smaller file, single source of truth with runtime).
- `v4/zod-adapter` imports `safeParseAsync` by name from `zod/v4/core` instead of `import *`, so Nitro/Rollup can tree-shake more of `@zod/core`.


[compare changes](https://github.com/DarlanPrado/nuxt-zod/compare/v1.1.2...v1.2.0)

### 🚀 Enhancements

- Introduce event validation with `event.validate()` in Nitro, enhancing request handling with typed results and configurable error responses ([67f1d2c](https://github.com/DarlanPrado/nuxt-zod/commit/67f1d2c))
- Add pull request templates for feature, bug, and documentation to streamline contributions ([e99cce3](https://github.com/DarlanPrado/nuxt-zod/commit/e99cce3))
- Implement global Zod error messages configuration and apply in both Nuxt and Nitro runtimes ([ef56ac8](https://github.com/DarlanPrado/nuxt-zod/commit/ef56ac8))
- Add `useZodSchemas()` for auto-discovery of shared Zod schemas and enhance README documentation ([7d6d5c8](https://github.com/DarlanPrado/nuxt-zod/commit/7d6d5c8))

### 🩹 Fixes

- Update email and website validation in schemas to use string methods for improved type safety ([771b042](https://github.com/DarlanPrado/nuxt-zod/commit/771b042))

### 📖 Documentation

- Add project governance rules and module architecture guidelines ([2ffc15a](https://github.com/DarlanPrado/nuxt-zod/commit/2ffc15a))
- Update README for compatibility notes and enhance CI workflow with matrix testing for Nuxt and Zod ([f6c86f6](https://github.com/DarlanPrado/nuxt-zod/commit/f6c86f6))
- Update README to clarify global Zod error messages configuration and resolution order ([8a208e0](https://github.com/DarlanPrado/nuxt-zod/commit/8a208e0))

### 🏡 Chore

- **release:** V1.1.2 ([ad40549](https://github.com/DarlanPrado/nuxt-zod/commit/ad40549))
- Enhance CI workflow by adding pnpm cache and updating corepack setup for improved dependency management ([e48f420](https://github.com/DarlanPrado/nuxt-zod/commit/e48f420))
- Update dependencies to latest versions, including Nuxt and Zod, and enhance README with compatibility notes for library authors ([cfe297c](https://github.com/DarlanPrado/nuxt-zod/commit/cfe297c))

### ❤️ Contributors

- DarlanPrado <darlandoprado2014@gmail.com>

## v1.1.2

[compare changes](https://github.com/DarlanPrado/nuxt-zod/compare/v1.1.1...v1.1.2)

### 🩹 Fixes

- Add default export to package.json ([eb8d2bf](https://github.com/DarlanPrado/nuxt-zod/commit/eb8d2bf))

### ❤️ Contributors

- DarlanPrado <darlandoprado2014@gmail.com>

## v1.1.1

[compare changes](https://github.com/DarlanPrado/nuxt-zod/compare/v1.1.0...v1.1.1)

## v1.1.0


### 🚀 Enhancements

- Integrate zod for schema validation with auto-imports and plugin support ([6c4c736](https://github.com/DarlanPrado/nuxt-zod/commit/6c4c736))

### 🩹 Fixes

- Update zod version in dependencies and peerDependencies ([839f9a2](https://github.com/DarlanPrado/nuxt-zod/commit/839f9a2))

### 📖 Documentation

- Update README.md to reflect module name and features of nuxt-zod ([d185b69](https://github.com/DarlanPrado/nuxt-zod/commit/d185b69))

### 🏡 Chore

- Update package.json with detailed module description and repository info ([088dd78](https://github.com/DarlanPrado/nuxt-zod/commit/088dd78))

### 🎨 Styles

- Format template for better readability in app.vue ([25fc2f1](https://github.com/DarlanPrado/nuxt-zod/commit/25fc2f1))

### ❤️ Contributors

- DarlanPrado <darlandoprado2014@gmail.com>

