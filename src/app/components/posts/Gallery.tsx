'use client'
// src/components/posts/Gallery.tsx
// Galerie photos avec lightbox — swipe mobile, navigation clavier

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Photo {
  id: string
  path: string
  thumbPath: string
  alt: string | null
  caption: string | null
  photographerName: string | null
  modelName: string | null
  width: number | null
  height: number | null
  order: number
}

interface GalleryProps {
  photos:     Photo[]
  coverIndex: number
}

export default function Gallery({ photos, coverIndex }: GalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [touchStart,    setTouchStart]    = useState<number | null>(null)
  const [isLoading,     setIsLoading]     = useState(false)

  const isOpen = lightboxIndex !== null
  const current = lightboxIndex !== null ? photos[lightboxIndex] : null

  // ── Navigation lightbox ──
  const goTo = useCallback((index: number) => {
    setIsLoading(true)
    setLightboxIndex((index + photos.length) % photos.length)
  }, [photos.length])

  const close = useCallback(() => setLightboxIndex(null), [])
  const prev  = useCallback(() => lightboxIndex !== null && goTo(lightboxIndex - 1), [lightboxIndex, goTo])
  const next  = useCallback(() => lightboxIndex !== null && goTo(lightboxIndex + 1), [lightboxIndex, goTo])

  // ── Clavier ──
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, prev, next, close])

  // ── Bloquer le scroll quand la lightbox est ouverte ──
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // ── Touch swipe mobile ──
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX)
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
    setTouchStart(null)
  }

  return (
    <>
      {/* ── GRILLE MINIATURES ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: photos.length === 1 ? '1fr' : photos.length === 2 ? '1fr 1fr' : 'repeat(3, 1fr)',
        gap: '4px',
      }}>
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setLightboxIndex(i)}
            style={{
              position: 'relative',
              // Première photo toujours plus grande si plusieurs photos
              gridColumn: i === 0 && photos.length > 3 ? 'span 2' : 'span 1',
              aspectRatio: i === 0 && photos.length > 3 ? '16/9' : '1/1',
              overflow: 'hidden',
              cursor: 'pointer',
              background: 'var(--clr-deep)',
              border: 'none',
              padding: 0,
            }}
          >
            <Image
              src={photo.thumbPath || photo.path}
              alt={photo.alt || `Photo ${i + 1}`}
              fill
              sizes="(max-width: 600px) 50vw, 33vw"
              style={{
                objectFit: 'cover',
                transition: 'transform 0.6s var(--ease-elegant)',
              }}
              onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.05)' }}
              onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)' }}
            />

            {/* Overlay hover */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(13,10,11,0)',
              transition: 'background 0.3s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(13,10,11,0.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(13,10,11,0)' }}
            >
              <span style={{ color: 'white', fontSize: '1.5rem', opacity: 0 }}
                    className="expand-icon">⤢</span>
            </div>

            {/* Badge couverture */}
            {i === coverIndex && (
              <div style={{
                position: 'absolute', bottom: '0.5rem', left: '0.5rem',
                background: 'var(--clr-or)',
                color: 'var(--clr-noir)',
                fontSize: '0.55rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0.15rem 0.5rem',
              }}>
                Couverture
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ── LIGHTBOX ── */}
      {isOpen && current && (
        <div
          className="lightbox-overlay"
          onClick={close}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Bouton fermer */}
          <button
            onClick={close}
            style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'white', fontSize: '1.5rem', zIndex: 10,
              opacity: 0.7, transition: 'opacity 0.2s',
              width: '44px', height: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7' }}
          >
            ✕
          </button>

          {/* Navigation précédent */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              style={{
                position: 'absolute', left: '1.5rem', top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white', cursor: 'pointer',
                width: '48px', height: '48px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
                fontSize: '1.2rem',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,168,67,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
            >
              ←
            </button>
          )}

          {/* Image principale */}
          <div
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={current.path}
              alt={current.alt || `Photo ${(lightboxIndex ?? 0) + 1}`}
              width={current.width  || 1200}
              height={current.height || 800}
              className="lightbox-img"
              style={{ display: 'block' }}
              priority
              onLoad={() => setIsLoading(false)}
            />

            {/* Spinner chargement */}
            {isLoading && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: '32px', height: '32px',
                  border: '2px solid rgba(212,168,67,0.3)',
                  borderTop: '2px solid var(--clr-or)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
              </div>
            )}
          </div>

          {/* Navigation suivant */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); next() }}
              style={{
                position: 'absolute', right: '1.5rem', top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white', cursor: 'pointer',
                width: '48px', height: '48px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
                fontSize: '1.2rem',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,168,67,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
            >
              →
            </button>
          )}

          {/* Bas de lightbox — légende + compteur + crédits */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '2rem',
            background: 'linear-gradient(to top, rgba(13,10,11,0.9), transparent)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          }}
          onClick={e => e.stopPropagation()}
          >
            <div>
              {current.caption && (
                <p style={{
                  fontFamily: 'var(--font-accent)',
                  fontStyle: 'italic',
                  color: 'var(--clr-creme)',
                  fontSize: '0.9rem',
                  marginBottom: '0.25rem',
                }}>
                  {current.caption}
                </p>
              )}
              {(current.photographerName || current.modelName) && (
                <p style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--clr-or)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.08em',
                }}>
                  {current.photographerName && `Photo : ${current.photographerName}`}
                  {current.photographerName && current.modelName && ' · '}
                  {current.modelName && `Modèle : ${current.modelName}`}
                </p>
              )}
            </div>

            {/* Compteur de progression */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <span style={{
                fontFamily: 'var(--font-body)',
                color: 'rgba(245,237,224,0.6)',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
              }}>
                {(lightboxIndex ?? 0) + 1} / {photos.length}
              </span>
              {/* Barre de progression */}
              <div style={{ display: 'flex', gap: '3px' }}>
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    style={{
                      width: i === lightboxIndex ? '20px' : '6px',
                      height: '3px',
                      background: i === lightboxIndex ? 'var(--clr-or)' : 'rgba(255,255,255,0.3)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s var(--ease-elegant)',
                      borderRadius: '2px',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .post-card:hover .expand-icon { opacity: 1 !important; }
      `}</style>
    </>
  )
}