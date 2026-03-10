'use client'
// src/components/interactions/LikeButton.tsx

import { useEffect, useState } from 'react'
import { useLike } from '@/app/hooks/usePost'
import { useAuth } from '@/app/hooks/useAuth'

interface LikeButtonProps {
  postId:        string
  initialCount:  number
  initialLiked?: boolean
}

export function LikeButton({ postId, initialCount, initialLiked = false }: LikeButtonProps) {
  const { isAuthenticated } = useAuth()
  const { liked, count, toggleLike, isLoading } = useLike(postId, initialCount, initialLiked)
  const [animate, setAnimate] = useState(false)

  async function handleClick() {
    if (!isAuthenticated) return
    setAnimate(true)
    await toggleLike()
    setTimeout(() => setAnimate(false), 600)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        onClick={handleClick}
        disabled={isLoading || !isAuthenticated}
        title={isAuthenticated ? (liked ? 'Retirer le like' : 'Liker cette publication') : 'Connectez-vous pour liker'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: liked ? 'var(--clr-bordeaux)' : 'transparent',
          border: `1px solid ${liked ? 'var(--clr-bordeaux)' : 'rgba(139,26,74,0.3)'}`,
          color: liked ? 'white' : 'var(--clr-bordeaux)',
          padding: '0.6rem 1.25rem',
          cursor: isAuthenticated ? 'pointer' : 'not-allowed',
          opacity: isAuthenticated ? 1 : 0.5,
          transition: 'all 0.3s var(--ease-elegant)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.8rem',
          letterSpacing: '0.05em',
        }}
      >
        {/* Cœur avec animation */}
        <span style={{
          fontSize: '1.1rem',
          display: 'inline-block',
          animation: animate ? 'heartPulse 0.6s var(--ease-spring)' : 'none',
          transition: 'transform 0.2s var(--ease-spring)',
          lineHeight: 1,
        }}>
          {liked ? '♥' : '♡'}
        </span>
        <span>{count}</span>
      </button>

      {!isAuthenticated && (
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.7rem',
          color: 'var(--clr-gris)',
        }}>
          — <a href="/login" style={{ color: 'var(--clr-bordeaux)', textDecoration: 'underline' }}>
            Connectez-vous
          </a> pour liker
        </span>
      )}
    </div>
  )
}


// ─────────────────────────────────────────
// src/components/interactions/ShareButtons.tsx
// ─────────────────────────────────────────

interface ShareButtonsProps {
  url:   string
  title: string
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const encoded = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const platforms = [
    {
      name:  'Facebook',
      icon:  'f',
      color: '#1877F2',
      href:  `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    },
    {
      name:  'Twitter / X',
      icon:  '𝕏',
      color: '#000000',
      href:  `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
    },
    {
      name:  'WhatsApp',
      icon:  '✆',
      color: '#25D366',
      href:  `https://wa.me/?text=${encodedTitle}%20${encoded}`,
    },
    {
      name:  'Pinterest',
      icon:  '𝗣',
      color: '#E60023',
      href:  `https://pinterest.com/pin/create/button/?url=${encoded}&description=${encodedTitle}`,
    },
  ]

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.65rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--clr-gris)',
      }}>
        ✦ Partager cette publication
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {platforms.map(p => (
          <a
            key={p.name}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            title={`Partager sur ${p.name}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'white',
              border: '1px solid rgba(0,0,0,0.1)',
              color: p.color,
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none',
              transition: 'all 0.25s var(--ease-elegant)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = p.color
              el.style.color = 'white'
              el.style.transform = 'translateY(-2px)'
              el.style.boxShadow = `0 4px 12px ${p.color}40`
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = 'white'
              el.style.color = p.color
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
            }}
          >
            {p.icon}
          </a>
        ))}

        {/* Copier le lien */}
        <button
          onClick={copyLink}
          title="Copier le lien"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0 1rem',
            height: '40px',
            background: copied ? 'var(--clr-bordeaux)' : 'white',
            border: `1px solid ${copied ? 'var(--clr-bordeaux)' : 'rgba(0,0,0,0.1)'}`,
            color: copied ? 'white' : 'var(--clr-noir)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
            transition: 'all 0.3s var(--ease-elegant)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          {copied ? '✓ Copié !' : '⎘ Lien'}
        </button>
      </div>
    </div>
  )
}