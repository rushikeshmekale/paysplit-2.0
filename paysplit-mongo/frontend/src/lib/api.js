// All API calls go to the Express + MongoDB backend
// Token is stored in localStorage

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ── Helper: get stored token ────────────────────────────────────
export const getToken = () => localStorage.getItem('paysplit_token')

// ── Helper: authenticated fetch ────────────────────────────────
const authFetch = async (url, options = {}) => {
  const token = getToken()
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

// ─── AUTH ──────────────────────────────────────────────────────

export const authRegister = async (email, password, name) => {
  const data = await authFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
  localStorage.setItem('paysplit_token', data.token)
  return data
}

export const authLogin = async (email, password) => {
  const data = await authFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  localStorage.setItem('paysplit_token', data.token)
  return data
}

export const authLogout = () => {
  localStorage.removeItem('paysplit_token')
}

export const getMe = () => authFetch('/api/auth/me')

// ─── EXPENSES ──────────────────────────────────────────────────

export const createExpense = (body) =>
  authFetch('/api/expenses', { method: 'POST', body: JSON.stringify(body) })

export const getExpenses = () => authFetch('/api/expenses')

export const deleteExpense = (id) =>
  authFetch(`/api/expenses/${id}`, { method: 'DELETE' })

// ─── BALANCE ───────────────────────────────────────────────────

export const getBalance = () => authFetch('/api/balance')

export const getStats = () => authFetch('/api/balance/stats')

// ─── FRIENDS ───────────────────────────────────────────────────

export const getFriends = () => authFetch('/api/friends')

export const settleWithFriend = (name) =>
  authFetch(`/api/friends/${encodeURIComponent(name)}/settle`, { method: 'POST' })
