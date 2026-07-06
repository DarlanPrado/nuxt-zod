<template>
  <main class="page">
    <header class="hero">
      <p class="eyebrow">
        nuxt-zod playground
      </p>
      <h1>Locale test</h1>
      <p>
        Default: <strong>{{ defaultLocale }}</strong> · bundled:
        <code>{{ bundledLocales.join(', ') }}</code>
      </p>
      <NuxtLink
        class="back"
        to="/"
      >
        Back to home
      </NuxtLink>
    </header>

    <section class="card">
      <h2>Active locale</h2>
      <div class="actions">
        <button
          v-for="code in bundledLocales"
          :key="code"
          type="button"
          :class="{ active: activeLocale === code }"
          @click="setLocale(code)"
        >
          {{ code }}
        </button>
      </div>
      <p class="hint">
        Validates <code>z.string().min(5)</code> with value <code>"a"</code>
      </p>
      <button
        type="button"
        class="primary"
        @click="runValidation"
      >
        Run validation
      </button>
      <p
        v-if="message"
        class="error"
      >
        {{ message }}
      </p>
      <pre class="result">{{ result }}</pre>
    </section>
  </main>
</template>

<script setup lang="ts">
const defaultLocale = 'pt'
const bundledLocales = ['pt', 'es', 'fr'] as const

type LocaleCode = (typeof bundledLocales)[number]

const { $zod: z } = useNuxtApp()
const activeLocale = ref<LocaleCode>(defaultLocale)
const message = ref('')
const result = ref('Click a locale, then run validation.')

function localeFactory(code: LocaleCode) {
  const factories = z.locales as Record<string, () => ReturnType<typeof z.locales.pt>>
  const factory = factories[code]
  if (!factory) {
    throw new Error(`Locale "${code}" is not in z.locales (check nuxtZod.locale.locales)`)
  }
  return factory()
}

function setLocale(code: LocaleCode) {
  activeLocale.value = code
  z.config(localeFactory(code))
  message.value = ''
  result.value = `Active locale set to "${code}". Run validation to see error messages.`
}

function runValidation() {
  z.config(localeFactory(activeLocale.value))
  const parsed = z.string().min(5).safeParse('a')
  if (!parsed.success) {
    message.value = parsed.error.issues[0]?.message ?? 'Validation failed'
    result.value = JSON.stringify(parsed.error.issues, null, 2)
    return
  }
  message.value = ''
  result.value = 'Unexpected: validation passed.'
}

onMounted(() => {
  setLocale(defaultLocale)
})
</script>

<style scoped>
.page {
  max-width: 36rem;
  margin: 0 auto;
  padding: 2rem 1.25rem 3rem;
  font-family: system-ui, sans-serif;
  color: #0f172a;
}

.hero h1 {
  margin: 0.25rem 0 0.5rem;
}

.hero p {
  margin: 0;
  color: #334155;
  line-height: 1.5;
}

.eyebrow {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
}

.back {
  display: inline-block;
  margin-top: 0.75rem;
  color: #c2410c;
  font-weight: 600;
  text-decoration: none;
}

.card {
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: #fff;
  padding: 1.1rem;
  margin-top: 1.25rem;
}

.card h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}

.hint {
  margin: 0.75rem 0;
  font-size: 0.88rem;
  color: #475569;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

button {
  border: 0;
  border-radius: 10px;
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}

button.active {
  background: #fed7aa;
  outline: 2px solid #ea580c;
}

button.primary {
  background: linear-gradient(120deg, #ea580c, #f59e0b);
  color: #fff;
}

.error {
  margin: 0.75rem 0 0;
  color: #dc2626;
  font-size: 0.9rem;
  font-weight: 600;
}

.result {
  margin: 0.75rem 0 0;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 0.8rem;
  min-height: 80px;
  overflow: auto;
  padding: 0.75rem;
}

code {
  font-size: 0.9em;
  background: #f1f5f9;
  padding: 0.1rem 0.25rem;
  border-radius: 4px;
}
</style>
