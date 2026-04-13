import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SpotifyUser } from '@/services/spotify-api'

interface ShelfAlbum {
  id: string
  name: string
  artist: string
  coverUrl: string
  addedAt: number
  uri: string
}

interface AppStore {
  token: string | null
  spotifyUser: SpotifyUser | null
  activeAlbum: ShelfAlbum | null
  shelfAlbums: ShelfAlbum[]
  setToken: (token: string | null) => void
  setSpotifyUser: (user: SpotifyUser | null) => void
  setActiveAlbum: (album: ShelfAlbum | null) => void
  addToShelf: (album: ShelfAlbum) => void
  removeFromShelf: (id: string) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      token: null,
      spotifyUser: null,
      activeAlbum: null,
      shelfAlbums: [],
      setToken: (token) => set({ token }),
      setSpotifyUser: (user) => set({ spotifyUser: user }),
      setActiveAlbum: (album) => set({ activeAlbum: album }),
      addToShelf: (album) =>
        set((s) => ({ shelfAlbums: [album, ...s.shelfAlbums] })),
      removeFromShelf: (id) =>
        set((s) => ({ shelfAlbums: s.shelfAlbums.filter((a) => a.id !== id) })),
    }),
    { name: 'vs_shelf' }
  )
)