<template>
  <main class="page">
    <header class="hero">
      <p class="eyebrow">
        nuxt-zod playground
      </p>
      <h1>Hands-on Zod forms</h1>
      <p>
        Test real validation flows with <strong>useZod()</strong> and <strong>$zod</strong>.
      </p>
      <p class="subnav">
        <NuxtLink to="/validate">
          Try <code>event.validate()</code> on Nitro
        </NuxtLink>
      </p>
    </header>

    <section class="grid">
      <article class="card">
        <h2>Account form (useZod)</h2>
        <form
          class="form"
          @submit.prevent="submitAccount"
        >
          <label>
            Email
            <input
              v-model.trim="accountForm.email"
              type="email"
              placeholder="you@example.com"
            >
          </label>
          <p
            v-if="accountErrors.email"
            class="error"
          >
            {{ accountErrors.email }}
          </p>

          <label>
            Password
            <input
              v-model="accountForm.password"
              type="password"
              placeholder="At least 8 chars"
            >
          </label>
          <p
            v-if="accountErrors.password"
            class="error"
          >
            {{ accountErrors.password }}
          </p>

          <label>
            Confirm password
            <input
              v-model="accountForm.confirmPassword"
              type="password"
              placeholder="Repeat password"
            >
          </label>
          <p
            v-if="accountErrors.confirmPassword"
            class="error"
          >
            {{ accountErrors.confirmPassword }}
          </p>

          <label class="checkbox">
            <input
              v-model="accountForm.acceptTerms"
              type="checkbox"
            >
            I accept the terms
          </label>
          <p
            v-if="accountErrors.acceptTerms"
            class="error"
          >
            {{ accountErrors.acceptTerms }}
          </p>

          <button type="submit">
            Validate account
          </button>
        </form>

        <pre class="result">{{ accountResult }}</pre>
      </article>

      <article class="card">
        <h2>Profile form (useZod + preprocess)</h2>
        <form
          class="form"
          @submit.prevent="submitProfile"
        >
          <label>
            Display name
            <input
              v-model.trim="profileForm.displayName"
              type="text"
              placeholder="Jane Doe"
            >
          </label>
          <p
            v-if="profileErrors.displayName"
            class="error"
          >
            {{ profileErrors.displayName }}
          </p>

          <label>
            Age
            <input
              v-model.trim="profileForm.age"
              type="text"
              placeholder="18"
            >
          </label>
          <p
            v-if="profileErrors.age"
            class="error"
          >
            {{ profileErrors.age }}
          </p>

          <label>
            Website (optional)
            <input
              v-model.trim="profileForm.website"
              type="url"
              placeholder="https://example.com"
            >
          </label>
          <p
            v-if="profileErrors.website"
            class="error"
          >
            {{ profileErrors.website }}
          </p>

          <label>
            Interests (comma-separated)
            <input
              v-model="profileForm.interestsInput"
              type="text"
              placeholder="nuxt, zod, typescript"
            >
          </label>
          <p
            v-if="profileErrors.interests"
            class="error"
          >
            {{ profileErrors.interests }}
          </p>

          <button type="submit">
            Validate profile
          </button>
        </form>

        <pre class="result">{{ profileResult }}</pre>
      </article>

      <article class="card">
        <h2>Checkout form ($zod)</h2>
        <form
          class="form"
          @submit.prevent="submitCheckout"
        >
          <label>
            Price
            <input
              v-model.trim="checkoutForm.price"
              type="text"
              placeholder="100"
            >
          </label>
          <p
            v-if="checkoutErrors.price"
            class="error"
          >
            {{ checkoutErrors.price }}
          </p>

          <label>
            Discount percentage
            <input
              v-model.trim="checkoutForm.discount"
              type="text"
              placeholder="15"
            >
          </label>
          <p
            v-if="checkoutErrors.discount"
            class="error"
          >
            {{ checkoutErrors.discount }}
          </p>

          <label>
            Coupon code (optional)
            <input
              v-model.trim="checkoutForm.coupon"
              type="text"
              placeholder="SAVE15"
            >
          </label>
          <p
            v-if="checkoutErrors.coupon"
            class="error"
          >
            {{ checkoutErrors.coupon }}
          </p>

          <button type="submit">
            Validate checkout
          </button>
        </form>

        <pre class="result">{{ checkoutResult }}</pre>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { ZodError } from 'zod'

const z = useZod()
const { $zod } = useNuxtApp()

type FormErrors = Record<string, string>

const accountForm = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
})
const accountErrors = reactive<FormErrors>({})
const accountResult = ref('Submit the form to see parsed output.')

const accountSchema = z.object({
  email: z.email('Provide a valid email.'),
  password: z.string().min(8, 'Password must have at least 8 characters.'),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, { message: 'You must accept the terms.' }),
}).superRefine((data: { password: string, confirmPassword: string }, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirmPassword'],
      message: 'Passwords must match.',
    })
  }
})

const profileForm = reactive({
  displayName: '',
  age: '',
  website: '',
  interestsInput: '',
})
const profileErrors = reactive<FormErrors>({})
const profileResult = ref('Submit the form to see parsed output.')

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must have at least 2 characters.'),
  age: z.preprocess((value: unknown) => Number(value), z.number().int().min(13).max(120)),
  website: z.union([
    z.literal(''),
    z.url('Website must be a valid URL.'),
  ]),
  interests: z.array(z.string().min(2)).min(1, 'Add at least one interest.').max(5),
})

const checkoutForm = reactive({
  price: '',
  discount: '',
  coupon: '',
})
const checkoutErrors = reactive<FormErrors>({})
const checkoutResult = ref('Submit the form to see parsed output.')

const checkoutSchema = $zod.object({
  price: $zod.preprocess((value: unknown) => Number(value), $zod.number().positive('Price must be > 0.')),
  discount: $zod.preprocess((value: unknown) => Number(value), $zod.number().min(0).max(95)),
  coupon: $zod.union([
    $zod.literal(''),
    $zod.string().min(5, 'Coupon must have at least 5 characters.'),
  ]),
}).superRefine((data, ctx) => {
  if (data.discount >= 20 && data.coupon === '') {
    ctx.addIssue({
      code: 'custom',
      path: ['coupon'],
      message: 'Coupon is required when discount is 20% or more.',
    })
  }
})

function clearErrors(state: FormErrors) {
  for (const key of Object.keys(state)) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete state[key]
  }
}

function assignFirstErrors(state: FormErrors, error: ZodError) {
  clearErrors(state)
  for (const issue of error.issues) {
    const path = issue.path[0]?.toString() || 'form'
    if (!state[path]) {
      state[path] = issue.message
    }
  }
}

function submitAccount() {
  const parsed = accountSchema.safeParse(accountForm)
  if (!parsed.success) {
    assignFirstErrors(accountErrors, parsed.error)
    accountResult.value = 'Validation failed.'
    return
  }

  clearErrors(accountErrors)
  accountResult.value = JSON.stringify(parsed.data, null, 2)
}

function submitProfile() {
  const interests = profileForm.interestsInput
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  const parsed = profileSchema.safeParse({
    displayName: profileForm.displayName,
    age: profileForm.age,
    website: profileForm.website,
    interests,
  })

  if (!parsed.success) {
    assignFirstErrors(profileErrors, parsed.error)
    profileResult.value = 'Validation failed.'
    return
  }

  clearErrors(profileErrors)
  profileResult.value = JSON.stringify(parsed.data, null, 2)
}

function submitCheckout() {
  const parsed = checkoutSchema.safeParse(checkoutForm)
  if (!parsed.success) {
    assignFirstErrors(checkoutErrors, parsed.error)
    checkoutResult.value = 'Validation failed.'
    return
  }

  clearErrors(checkoutErrors)
  checkoutResult.value = JSON.stringify(parsed.data, null, 2)
}
</script>

<style scoped>
:global(body) {
  margin: 0;
  background:
    radial-gradient(circle at 10% 10%, #ffe5c2 0%, transparent 35%),
    radial-gradient(circle at 80% 0%, #cce5ff 0%, transparent 30%),
    linear-gradient(160deg, #f8f9fb 0%, #ecf3ff 45%, #f6f7f1 100%);
  color: #1a2533;
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
}

.page {
  margin: 0 auto;
  max-width: 1100px;
  padding: 2rem 1.25rem 3rem;
}

.hero {
  margin-bottom: 1.5rem;
}

.hero h1 {
  margin: 0.25rem 0 0.6rem;
  font-size: clamp(1.8rem, 3vw, 2.7rem);
  line-height: 1.05;
}

.hero p {
  margin: 0;
  color: #3f4d60;
}

.hero .subnav {
  margin-top: 0.75rem;
}

.hero .subnav a {
  color: #c2410c;
  font-weight: 600;
  text-decoration: none;
}

.hero .subnav a:hover {
  text-decoration: underline;
}

.hero .subnav code {
  font-size: 0.95em;
}

.eyebrow {
  margin: 0;
  color: #b45309;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.card {
  border: 1px solid #cfd9e7;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  box-shadow: 0 12px 35px rgba(36, 67, 103, 0.08);
  padding: 1rem;
}

.card h2 {
  margin: 0 0 0.8rem;
  font-size: 1rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: #2d3a4d;
}

input {
  border: 1px solid #afbdd1;
  border-radius: 10px;
  background: #fbfdff;
  padding: 0.55rem 0.65rem;
  color: #1f2a38;
}

input:focus {
  border-color: #fb923c;
  box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.2);
  outline: none;
}

.checkbox {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.6rem;
}

.checkbox input {
  width: 1rem;
  height: 1rem;
  padding: 0;
}

button {
  margin-top: 0.25rem;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(120deg, #ea580c, #f59e0b);
  color: #fff;
  font-weight: 700;
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(245, 158, 11, 0.28);
}

.error {
  margin: 0;
  color: #dc2626;
  font-size: 0.8rem;
}

.result {
  margin: 0.8rem 0 0;
  border-radius: 10px;
  background: #0f172a;
  color: #dbeafe;
  font-size: 0.78rem;
  min-height: 70px;
  overflow: auto;
  padding: 0.7rem;
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
