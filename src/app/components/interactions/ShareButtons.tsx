'use client'
// src/components/interactions/ShareButtons.tsx
// Boutons de partage multi-réseaux + copie de lien

import { useState } from 'react'

interface ShareButtonsProps {
  url:   string   // URL complète de la publication
  title: string   // Titre de la publication
}

// ─────────────────────────────────────────
// CONFIG DES PLATEFORMES
// ─────────────────────────────────────────

function getPlatforms(url: string, title: string) {
  const encoded      = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  return [
    {
      name:  'Facebook',
      icon:  'f',
      color: '#1877F2',
      href:  `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    },
    {
      name:  'X / Twitter',
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
}

// ─────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────

export default function ShareButtons({ url, title }: Readonly<ShareButtonsProps>) {
  const [copied,  setCopied]  = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  const platforms = getPlatforms(url, title)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback pour les navigateurs sans Clipboard API
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

        {/* Label */}
        <p style={{
          fontFamily:    'var(--font-body)',
          fontSize:      '0.65rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color:         'var(--clr-gris)',
          margin:        0,
        }}>
          ✦ Partager
        </p>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Plateformes sociales */}
          {platforms.map(p => (
              <a
                  key={p.name}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Partager sur ${p.name}`}
                  onMouseEnter={() => setHovered(p.name)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    width:          '40px',
                    height:         '40px',
                    background:     hovered === p.name ? p.color : 'white',
                    color:          hovered === p.name ? 'white'  : p.color,
                    border:         '1px solid rgba(0,0,0,0.1)',
                    fontWeight:     700,
                    fontSize:       '0.9rem',
                    textDecoration: 'none',
                    transition:     'all 0.25s var(--ease-elegant)',
                    boxShadow:      hovered === p.name
                        ? `0 4px 12px ${p.color}40`
                        : '0 1px 3px rgba(0,0,0,0.06)',
                    transform:      hovered === p.name ? 'translateY(-2px)' : 'translateY(0)',
                    flexShrink:     0,
                  }}
              >
                {p.icon}
              </a>
          ))}

          {/* Séparateur vertical */}
          <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />

          {/* Copier le lien */}
          <button
              onClick={copyLink}
              title="Copier le lien"
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '0.4rem',
                padding:        '0 1rem',
                height:         '40px',
                background:     copied ? 'var(--clr-bordeaux)' : 'white',
                border:         `1px solid ${copied ? 'var(--clr-bordeaux)' : 'rgba(0,0,0,0.1)'}`,
                color:          copied ? 'white' : 'var(--clr-noir)',
                cursor:         'pointer',
                fontFamily:     'var(--font-body)',
                fontSize:       '0.72rem',
                letterSpacing:  '0.04em',
                transition:     'all 0.3s var(--ease-elegant)',
                boxShadow:      '0 1px 3px rgba(0,0,0,0.06)',
                whiteSpace:     'nowrap',
                flexShrink:     0,
              }}
          >
            {/* Icône */}
            <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>
            {copied ? '✓' : '⎘'}
          </span>
            {copied ? 'Lien copié !' : 'Copier le lien'}
          </button>
        </div>
      </div>
  )
}