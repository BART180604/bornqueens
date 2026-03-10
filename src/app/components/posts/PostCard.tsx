'use client'
// src/components/posts/PostCard.tsx
// Carte de publication — deux variantes : normale et featured

import Link from 'next/link'
import Image from 'next/image'

export interface PostCardProps {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    region: string | null
    period: string | null
    coverIndex: number
    publishedAt: string
    photos: { path: string; thumbPath: string; alt: string | null; order: number }[]
    categories: { name: string; slug: string; color: string | null }[]
    likesCount: number
    commentsCount: number
  }
  featured?: boolean  // carte agrandie dans la grille
}

export default function PostCard({ post, featured = false }: PostCardProps) {
  const coverPhoto = post.photos[post.coverIndex] || post.photos[0]
  const photoCount = post.photos.length

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="post-card"
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        // Les cartes featured occupent 2 colonnes verticalement
        gridRow: featured ? 'span 2' : 'span 1',
        boxShadow: 'var(--shadow-card)',
        transition: 'box-shadow 0.4s var(--ease-elegant)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-deep)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
      }}
    >
      {/* Image */}
      <div
        className="card-image"
        style={{ height: featured ? '520px' : '280px', position: 'relative' }}
      >
        {coverPhoto ? (
          <Image
            src={coverPhoto.thumbPath || coverPhoto.path}
            alt={coverPhoto.alt || post.title}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--clr-deep)' }} />
        )}

        {/* Overlay gradient */}
        <div className="card-overlay" />

        {/* Badge nombre de photos */}
        {photoCount > 1 && (
          <div className="photo-count">
            ◻ {photoCount}
          </div>
        )}

        {/* Catégorie */}
        {post.categories[0] && (
          <div style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
          }}>
            <span
              className="label-category"
              style={{
                color: 'white',
                background: post.categories[0].color || 'var(--clr-bordeaux)',
                padding: '0.2rem 0.6rem',
                fontSize: '0.6rem',
              }}
            >
              {post.categories[0].name}
            </span>
          </div>
        )}

        {/* Texte superposé sur l'image (visible au hover) */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: '1.5rem',
          zIndex: 1,
        }}>
          <h3
            className={featured ? 'title-section' : 'title-card'}
            style={{
              color: 'var(--clr-creme)',
              marginBottom: '0.5rem',
            }}
          >
            {post.title}
          </h3>

          {featured && post.excerpt && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'rgba(245,237,224,0.75)',
              lineHeight: 1.6,
              marginBottom: '1rem',
            }}
            className="line-clamp-2"
            >
              {post.excerpt}
            </p>
          )}

          {/* Méta */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            {post.region && (
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                color: 'var(--clr-or)',
                textTransform: 'uppercase',
              }}>
                {post.region}
              </span>
            )}
            <span style={{ color: 'rgba(245,237,224,0.4)', fontSize: '0.7rem' }}>
              ♡ {post.likesCount}
            </span>
            <span style={{ color: 'rgba(245,237,224,0.4)', fontSize: '0.7rem' }}>
              ✦ {post.commentsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Corps de carte — visible en mode liste ou petit écran */}
      {!featured && (
        <div style={{ padding: '1.25rem', background: 'white' }}>
          <h3 className="title-card" style={{ color: 'var(--clr-noir)', marginBottom: '0.4rem' }}>
            {post.title}
          </h3>
          {post.excerpt && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.825rem',
              color: 'var(--clr-gris)',
              lineHeight: 1.6,
            }}
            className="line-clamp-2"
            >
              {post.excerpt}
            </p>
          )}
        </div>
      )}
    </Link>
  )
}