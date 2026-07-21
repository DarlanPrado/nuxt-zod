<template>
  <main class="page">
    <header class="hero">
      <p class="eyebrow">
        nuxt-zod · Zod Mini
      </p>
      <h1>Playground Mini</h1>
      <p>
        Dedicated app with <code>zodVersion: 'mini'</code>. Classic playground stays on port 3000.
      </p>
    </header>

    <section class="grid">
      <article class="card">
        <h2>Provider</h2>
        <p>
          <code>useZod()</code> / <code>$zod</code>: <strong>{{ providerLabel }}</strong>
        </p>
        <p>
          Nitro <code>/api/provider</code>: <strong>{{ serverProvider }}</strong>
        </p>
      </article>

      <article class="card">
        <h2>Client parse (useZod)</h2>
        <label>
          Name
          <input
            v-model.trim="name"
            type="text"
            placeholder="min 2 chars"
          >
        </label>
        <p
          v-if="clientError"
          class="error"
        >
          {{ clientError }}
        </p>
        <button
          type="button"
          @click="parseClient"
        >
          safeParse
        </button>
        <pre class="result">{{ clientResult }}</pre>
      </article>

      <article class="card">
        <h2>Shared schemas</h2>
        <p>
          <code>useZodSchemas().user.create</code>
        </p>
        <pre class="result">{{ schemasResult }}</pre>
      </article>

      <article class="card">
        <h2>event.validate() (Nitro)</h2>
        <label>
          JSON body
          <textarea
            v-model="bodyJson"
            rows="5"
            spellcheck="false"
          />
        </label>
        <div class="actions">
          <button
            type="button"
            @click="bodyJson = JSON.stringify({ name: 'nuxt-zod' }, null, 2)"
          >
            Valid
          </button>
          <button
            type="button"
            @click="bodyJson = JSON.stringify({ name: '' }, null, 2)"
          >
            Invalid
          </button>
          <button
            type="button"
            class="primary"
            @click="sendValidate"
          >
            POST /api/validate-body
          </button>
        </div>
        <p
          v-if="httpStatus"
          class="status"
        >
          HTTP {{ httpStatus }}
        </p>
        <pre class="result">{{ serverResult }}</pre>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
const z = useZod()
const { $zod } = useNuxtApp()
const { user } = useZodSchemas()

const providerLabel = typeof (z as { minLength?: unknown }).minLength === 'function'
  && typeof ($zod as { minLength?: unknown }).minLength === 'function'
  ? 'mini'
  : 'unknown'

const serverProvider = ref('…')
const name = ref('')
const clientError = ref('')
const clientResult = ref('Parse a name to see output.')
const schemasResult = ref(
  user.create.safeParse({ name: 'playground' }).success
    ? 'use-zod-schemas-ok'
    : 'use-zod-schemas-fail',
)
const bodyJson = ref(JSON.stringify({ name: 'nuxt-zod' }, null, 2))
const httpStatus = ref('')
const serverResult = ref('Send a request to see the response.')

const nameSchema = z.string().check(z.minLength(2, 'Name must have at least 2 characters.'))

onMounted(async () => {
  try {
    const res = await $fetch<{ providerId: string }>('/api/provider')
    serverProvider.value = res.providerId
  }
  catch {
    serverProvider.value = 'error'
  }
})

function parseClient() {
  const parsed = nameSchema.safeParse(name.value)
  if (!parsed.success) {
    clientError.value = parsed.error.issues[0]?.message ?? 'Invalid input'
    clientResult.value = 'Validation failed.'
    return
  }
  clientError.value = ''
  clientResult.value = JSON.stringify(parsed.data, null, 2)
}

async function sendValidate() {
  httpStatus.value = ''
  let body: unknown
  try {
    body = JSON.parse(bodyJson.value)
  }
  catch {
    serverResult.value = 'Body is not valid JSON.'
    return
  }

  try {
    const res = await $fetch('/api/validate-body', {
      method: 'POST',
      body,
    })
    httpStatus.value = '200'
    serverResult.value = JSON.stringify(res, null, 2)
  }
  catch (err: unknown) {
    const e = err as {
      statusCode?: number
      statusMessage?: string
      data?: unknown
      response?: { status?: number, _data?: unknown }
    }
    httpStatus.value = String(e.statusCode ?? e.response?.status ?? 'error')
    serverResult.value = JSON.stringify(e.data ?? e.response?._data ?? e, null, 2)
  }
}
</script>

<style scoped>
:global(body) {
  margin: 0;
  background:
    radial-gradient(circle at 15% 0%, #d1fae5 0%, transparent 40%),
    radial-gradient(circle at 90% 20%, #e0e7ff 0%, transparent 35%),
    linear-gradient(165deg, #f8fafc 0%, #ecfdf5 50%, #f1f5f9 100%);
  color: #0f172a;
  font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
}

.page {
  margin: 0 auto;
  max-width: 960px;
  padding: 2rem 1.25rem 3rem;
}

.hero {
  margin-bottom: 1.5rem;
}

.hero h1 {
  margin: 0.25rem 0 0.5rem;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
}

.hero p {
  margin: 0;
  color: #334155;
}

.eyebrow {
  margin: 0;
  color: #047857;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.grid {
  display: grid;
  gap: 1rem;
}

.card {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 1rem 1.1rem 1.2rem;
}

.card h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}

label {
  display: grid;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

input,
textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #94a3b8;
  border-radius: 8px;
  padding: 0.55rem 0.65rem;
  font: inherit;
  background: #fff;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

button {
  border: 1px solid #64748b;
  background: #fff;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  font: inherit;
  cursor: pointer;
}

button.primary {
  background: #047857;
  border-color: #047857;
  color: #fff;
}

.error {
  color: #b91c1c;
  margin: 0 0 0.5rem;
}

.status {
  margin: 0 0 0.35rem;
  font-weight: 600;
}

.result {
  margin: 0.75rem 0 0;
  padding: 0.75rem;
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  overflow: auto;
  font-size: 0.85rem;
}

code {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 0.92em;
}
</style>
