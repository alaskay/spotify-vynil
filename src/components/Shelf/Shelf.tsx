import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Disc from '@/components/Disc'
import { useAppStore } from '@/store/useAppStore'

const DISCS_PER_ROW = 8
const PLANK_GRADIENT = 'linear-gradient(180deg, #D4B896 0%, #B8936A 35%, #9A7A52 70%, #8B6F47 100%)'
const SUPPORT_GRADIENT = 'linear-gradient(90deg, #7A6040 0%, #C4A07A 45%, #A88050 100%)'

type AnimState = 'adding' | 'returning'

interface ShelfAlbum {
  id: string
  name: string
  artist: string
  coverUrl: string
}

interface ShelfProps {
  albums: ShelfAlbum[]
  onAddClick: () => void
}

interface ShelfRowProps {
  discs: ShelfAlbum[]
  activeAlbumId: string | null
  animating: Record<string, AnimState>
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

function Support({ height }: { height: number }) {
  return (
    <div style={{
      width: '22px', height,
      background: SUPPORT_GRADIENT,
      borderRadius: '3px 3px 0 0',
      flexShrink: 0,
      boxShadow: '1px 0 3px rgba(0,0,0,0.25), -1px 0 3px rgba(0,0,0,0.15)',
    }} />
  )
}

function Plank() {
  return (
    <div style={{
      height: '16px',
      background: PLANK_GRADIENT,
      borderRadius: '2px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.2)',
    }}>
      <div style={{
        height: '100%', borderRadius: '2px',
        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.04) 8px, rgba(0,0,0,0.04) 9px)`,
      }} />
    </div>
  )
}

function ShelfRow({ discs, activeAlbumId, animating }: ShelfRowProps) {
  const DISC_H = 120
  const PADDING_TOP = 24
  const SUPPORT_H = DISC_H + PADDING_TOP

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <Support height={SUPPORT_H} />
        <div style={{
          flex: 1, display: 'flex', alignItems: 'flex-end',
          gap: '16px', paddingTop: PADDING_TOP, paddingLeft: '16px', paddingRight: '16px',
        }}>
          {discs.map((album) => {
            const isPlaying = album.id === activeAlbumId
            const animType: AnimState | undefined = animating[album.id]

            return (
              // Fixed-size slot — layout never shifts when disc is absent
              <div key={album.id} style={{ position: 'relative', width: DISC_H, height: DISC_H, flexShrink: 0 }}>

                {/* Dashed placeholder — visible while disc is on the turntable */}
                <AnimatePresence>
                  {isPlaying && (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        position: 'absolute', inset: 0,
                        borderRadius: '50%',
                        border: '2px dashed rgba(154,128,96,0.45)',
                        background: 'rgba(154,128,96,0.07)',
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Disc — exits when playing, enters with spring when returning or adding */}
                <AnimatePresence>
                  {!isPlaying && (
                    <motion.div
                      key="disc"
                      initial={
                        animType === 'adding'
                          ? { y: 60, opacity: 0 }
                          : animType === 'returning'
                          ? { y: -20, scale: 0.95, opacity: 0.6 }
                          : false
                      }
                      animate={{ y: 0, scale: 1, opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.9, y: -8, transition: { duration: 0.18 } }}
                      transition={
                        animType === 'adding'
                          ? { type: 'spring', stiffness: 280, damping: 22 }
                          : animType === 'returning'
                          ? { type: 'spring', stiffness: 350, damping: 26 }
                          : { duration: 0 }
                      }
                      style={{ position: 'absolute', top: 0, left: 0 }}
                    >
                      <Disc albumName={album.name} artist={album.artist} coverUrl={album.coverUrl} />
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            )
          })}
        </div>
        <Support height={SUPPORT_H} />
      </div>
      <Plank />
    </div>
  )
}

function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  const SUPPORT_H = 100
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: '80px' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Support height={SUPPORT_H} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: SUPPORT_H, gap: '14px' }}>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '13px', color: '#9A8060', letterSpacing: '0.05em', margin: 0 }}>
              Your shelf is empty
            </p>
            <button
              onClick={onAddClick}
              style={{
                fontFamily: "'Space Mono', monospace", fontSize: '11px',
                color: '#FF4D8F', background: 'transparent',
                border: '1px solid rgba(255,77,143,0.35)', borderRadius: '20px',
                padding: '8px 22px', cursor: 'pointer', letterSpacing: '0.05em',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,77,143,0.06)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              + Add your first record
            </button>
          </div>
          <Support height={SUPPORT_H} />
        </div>
        <Plank />
      </div>
    </div>
  )
}

export default function Shelf({ albums, onAddClick }: ShelfProps) {
  const activeAlbum = useAppStore((s) => s.activeAlbum)
  const [animating, setAnimating] = useState<Record<string, AnimState>>({})

  // Initialise with current IDs so pre-existing albums don't spring-in on mount
  const prevAlbumIds = useRef<Set<string>>(new Set(albums.map((a) => a.id)))
  const prevActiveId = useRef<string | null>(null)

  // Detect newly added albums → 'adding' spring from below
  useEffect(() => {
    const currentIds = new Set(albums.map((a) => a.id))
    const added = albums.filter((a) => !prevAlbumIds.current.has(a.id)).map((a) => a.id)
    prevAlbumIds.current = currentIds

    if (added.length === 0) return

    setAnimating((prev) => {
      const next = { ...prev }
      added.forEach((id) => { next[id] = 'adding' })
      return next
    })

    const timer = setTimeout(() => {
      setAnimating((prev) => {
        const next = { ...prev }
        added.forEach((id) => { delete next[id] })
        return next
      })
    }, 900)

    return () => clearTimeout(timer)
  }, [albums])

  // Detect when active album changes → 'returning' spring for previous disc
  useEffect(() => {
    const prevId = prevActiveId.current
    const currId = activeAlbum?.id ?? null
    prevActiveId.current = currId

    if (!prevId || prevId === currId) return

    setAnimating((prev) => ({ ...prev, [prevId]: 'returning' }))

    const timer = setTimeout(() => {
      setAnimating((prev) => {
        const next = { ...prev }
        delete next[prevId]
        return next
      })
    }, 800)

    return () => clearTimeout(timer)
  }, [activeAlbum])

  if (albums.length === 0) return <EmptyState onAddClick={onAddClick} />

  const rows = chunkArray(albums, DISCS_PER_ROW)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', width: '100%' }}>
      {rows.map((row, i) => (
        <ShelfRow
          key={i}
          discs={row}
          activeAlbumId={activeAlbum?.id ?? null}
          animating={animating}
        />
      ))}
    </div>
  )
}
