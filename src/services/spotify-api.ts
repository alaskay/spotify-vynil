import { getValidToken } from '@/services/spotify-auth'

export interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images: { url: string; width: number; height: number }[]
}

export async function fetchCurrentUser(): Promise<SpotifyUser> {
  const token = await getValidToken()
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch user profile')
  return res.json() as Promise<SpotifyUser>
}
