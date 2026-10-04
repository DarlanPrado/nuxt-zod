<template>
  <main class="page">
    <header class="hero">
      <p class="eyebrow">
        nuxt-zod playground
      </p>
      <h1>
        <code>useZodSchemas()</code>
      </h1>
      <p>
        Exercise the generated schema registry on Nitro via
        <code>shared/schemas/session.ts</code> (no <code>event.validate</code> on this route).
      </p>
      <NuxtLink
        class="back"
        to="/"
      >
        Back to home
      </NuxtLink>
    </header>

    <section class="card">
      <h2>Server registry</h2>
      <p class="hint">
        <code>POST /api/schemas-session-test</code> calls <code>useZodSchemas()</code> and returns
        registered keys (expects <code>session</code> from the shared schema file).
      </p>

      <div class="actions">
        <button
          type="button"
          class="primary"
          @click="send"
        >
          POST /api/schemas-session-test
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
const statusLabel = ref('')
const lastJson = ref<Record<string, unknown> | null>(null)
const lastText = ref('')

const display = computed(() => {
  if (lastJson.value)
    return JSON.stringify(lastJson.value, null, 2)
  return lastText.value
})

async function send() {
  statusLabel.value = ''
  lastJson.value = null
  lastText.value = ''
  try {
    const res = await $fetch<Record<string, unknown>>('/api/schemas-session-test', {
      method: 'POST',
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
