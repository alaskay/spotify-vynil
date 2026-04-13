const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string
const REDIRECT_URI = `${window.location.origin}/callback`
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-library-read',
  'user-modify-playback-state',
  'user-read-playback-state',
].join(' ')

const VERIFIER_KEY = 'vs_pkce_verifier'

const KEYS = {
  access: 'vs_access_token',
  refresh: 'vs_refresh_token',
  expiry: 'vs_token_expiry',
}

// ── PKCE helpers ────────────────────────────────────────────────────────────

function generateCodeVerifier(): string {
  const array = new Uint8Array(48) // 48 bytes → 64 base64url chars
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
    .slice(0, 64)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ── Token storage ────────────────────────────────────────────────────────────

function saveTokens(data: { access_token: string; refresh_token?: string; expires_in: number }) {
  localStorage.setItem(KEYS.access, data.access_token)
  if (data.refresh_token) {
    localStorage.setItem(KEYS.refresh, data.refresh_token)
  }
  localStorage.setItem(KEYS.expiry, String(Date.now() + data.expires_in * 1000))
}

// ── Public API ───────────────────────────────────────────────────────────────

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(KEYS.access)
}

export function logout(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  window.location.href = '/login'
}

export async function redirectToSpotifyAuth(): Promise<void> {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  sessionStorage.setItem(VERIFIER_KEY, verifier)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params}`
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  if (!verifier) throw new Error('Missing PKCE verifier — please try signing in again.')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error_description?: string }).error_description ?? 'Token exchange failed')
  }

  const data = await res.json()
  sessionStorage.removeItem(VERIFIER_KEY)
  saveTokens(data as { access_token: string; refresh_token?: string; expires_in: number })
}

export async function getValidToken(): Promise<string> {
  const access = localStorage.getItem(KEYS.access)
  const expiry = Number(localStorage.getItem(KEYS.expiry) ?? 0)

  if (access && Date.now() < expiry) return access

  // Token expired — try to refresh
  const refresh = localStorage.getItem(KEYS.refresh)
  if (!refresh) {
    logout()
    throw new Error('No refresh token available.')
  }

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refresh,
    }),
  })

  if (!res.ok) {
    logout()
    throw new Error('Session expired. Please sign in again.')
  }

  const data = await res.json()
  saveTokens(data as { access_token: string; refresh_token?: string; expires_in: number })
  return (data as { access_token: string }).access_token
}
