<template>
  <main class="page">
    <header class="hero">
      <p class="eyebrow">
        nuxt-zod playground
      </p>
      <h1>
        <code>event.validate()</code>
      </h1>
      <p>
        Test Nitro request validation: edit JSON body and query, then send success or intentional failure.
      </p>
      <NuxtLink
        class="back"
        to="/"
      >
        Back to home
      </NuxtLink>
    </header>

    <section class="card">
      <h2>Request</h2>
      <p class="hint">
        Schema: <code>body.name</code> (string, min 1) · <code>query.page</code> (optional number, coerced)
      </p>

      <label class="block">
        Query string (appended to URL, e.g. <code>?page=2</code>)
        <input
          v-model="queryString"
          type="text"
          placeholder="?page=2 or page=2"
        >
      </label>

      <label class="block">
        JSON body
        <textarea
          v-model="bodyJson"
          rows="8"
          spellcheck="false"
        />
      </label>

      <div class="actions">
        <button
          type="button"
          @click="applyPreset('ok')"
        >
          Preset: valid
        </button>
        <button
          type="button"
          @click="applyPreset('bad')"
        >
          Preset: invalid name
        </button>
        <button
          type="button"
          class="primary"
          @click="send"
        >
          POST /api/validate-test
        </button>
      </div>
    </section>

    <section class="card">
      <h2>Response</h2>
      <p
        v-if="statusLabel"
        class="status"
      >
        HTTP {{ statusLabel }}
      </p>
      <pre class="result">{{ display }}</pre>
    </section>
  </main>
</template>

<script setup lang="ts">
const queryString = ref('page=2')
const bodyJson = ref(JSON.stringify({ name: 'nuxt-zod' }, null, 2))

const statusLabel = ref('')
const lastJson = ref<Record<string, unknown> | null>(null)
const lastText = ref('')

const display = computed(() => {
  if (lastJson.value)
    return JSON.stringify(lastJson.value, null, 2)
  return lastText.value
})

function applyPreset(kind: 'ok' | 'bad') {
  if (kind === 'ok') {
    bodyJson.value = JSON.stringify({ name: 'nuxt-zod' }, null, 2)
    queryString.value = 'page=2'
  }
  else {
    bodyJson.value = JSON.stringify({ name: '' }, null, 2)
    queryString.value = 'page=not-a-number'
  }
}

function buildQueryPart() {
  const q = queryString.value.trim()
  if (!q)
    return ''
  return q.startsWith('?') ? q : `?${q}`
}

async function send() {
  statusLabel.value = ''
  lastJson.value = null
  lastText.value = ''
  let body: unknown
  try {
    body = JSON.parse(bodyJson.value)
  }
  catch {
    lastText.value = 'Invalid JSON in body field'
    return
  }
  const path = `/api/validate-test${buildQueryPart()}`
  try {
    const res = await $fetch<Record<string, unknown>>(path, {
      method: 'POST',
      body: body as Record<string, unknown>,
    })
    lastJson.value = { success: true, data: res }
    statusLabel.value = '200'
  }
  catch (e: unknown) {
    const err = e as {
      statusCode?: number
      data?: { data?: unknown, message?: string, statusMessage?: string }
      message?: string
    }
    statusLabel.value = String(err.statusCode ?? 'error')
    if (err.data && typeof err.data === 'object') {
      const detail = 'data' in err.data && err.data.data !== undefined
        ? err.data.data
        : err.data
      lastJson.value = { success: false, error: detail }
    }
    else {
      lastText.value = err.message ?? String(e)
    }
  }
}
</script>

<style scoped>
.page {
  max-width: 52rem;
  margin: 0 auto;
  padding: 2rem 1.25rem 3rem;
  font-family: system-ui, sans-serif;
  color: #0f172a;
}

.hero h1 {
  font-size: 1.75rem;
  margin: 0.25rem 0 0.5rem;
}

.hero p {
  margin: 0 0 0.75rem;
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
  margin-top: 0.5rem;
  color: #c2410c;
  font-weight: 600;
  text-decoration: none;
}
.back:hover {
  text-decoration: underline;
}

.card {
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: #fff;
  padding: 1.1rem;
  margin-top: 1.25rem;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
}
.card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}
.hint {
  margin: 0 0 0.75rem;
  font-size: 0.88rem;
  color: #475569;
}
.block {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}
input,
textarea {
  font: inherit;
  font-weight: 400;
  border: 1px solid #94a3b8;
  border-radius: 10px;
  padding: 0.5rem 0.6rem;
  width: 100%;
  box-sizing: border-box;
}
textarea {
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
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
button.primary {
  background: linear-gradient(120deg, #ea580c, #f59e0b);
  color: #fff;
}
button:hover {
  filter: brightness(0.98);
}
.status {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.5rem;
}
.result {
  margin: 0;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 0.8rem;
  min-height: 120px;
  overflow: auto;
  padding: 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
}
code {
  font-size: 0.9em;
  background: #f1f5f9;
  padding: 0.1rem 0.25rem;
  border-radius: 4px;
}
</style>
