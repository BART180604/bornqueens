// src/app/(site)/page.tsx
// Page d'accueil — Grille immersive + Hero éditorial

import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/app/lib/prisma'
import PostCard from '@/app/components/posts/PostCard'

// Fetch côté serveur (SSR) — pas de useEffect, pas de loading
async function getFeaturedPosts() {
  return prisma.post.findMany({
    where:   { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take:    9,
    select: {
      id: true, title: true, slug: true, excerpt: true,
      region: true, period: true, coverIndex: true, publishedAt: true,
      photos: {
        orderBy: { order: 'asc' },
        select: { path: true, alt: true, order: true },
        take: 1,
      },
      categories: { select: { category: { select: { name: true, slug: true} } } },
      _count: { select: { likes: true, comments: true } }
    }
  })
}

async function getCategories() {
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      
      _count: { select: { posts: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export default async function Home() {
  const [posts, categories] = await Promise.all([getFeaturedPosts(), getCategories()])
  const heroPost   = posts[0]
  const gridPosts  = posts.slice(1, 7)
  const latestPost = posts.slice(7)
  
  return (
    <main style={{ paddingTop: '5rem' }}>

      {/* ── HERO ── */}
      {heroPost && (
        <section style={{ position: 'relative', height: '92vh', overflow: 'hidden' }}>
          {/* Image de fond */}
          <Image
            src={heroPost.photos[0]?.path || '/placeholder.jpg'}
            alt={heroPost.photos[0]?.alt || heroPost.title}
            fill
            priority
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
          />

          {/* Gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(13,10,11,0.85) 0%, rgba(13,10,11,0.4) 60%, transparent 100%)',
          }} />

          {/* Contenu hero */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'flex-end',
            padding: 'clamp(2rem, 5vw, 5rem)',
            maxWidth: '1400px', margin: '0 auto', left: 0, right: 0,
          }}>
            <div style={{ maxWidth: '680px' }}>

              {/* Catégories */}
              {heroPost.categories[0] && (
                <div className="animate-fade-up" style={{ marginBottom: '1rem' }}>
                  <span className="label-category" style={{ color: 'var(--clr-or)' }}>
                    ✦ {heroPost.categories[0].category.name}
                  </span>
                </div>
              )}

              {/* Titre */}
              <h1
                className="title-hero animate-fade-up delay-100 text-balance"
                style={{ color: 'var(--clr-creme)', marginBottom: '1.5rem' }}
              >
                {heroPost.title}
              </h1>

              {/* Excerpt */}
              {heroPost.excerpt && (
                <p
                  className="animate-fade-up delay-200"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '1rem',
                    color: 'rgba(245, 237, 224, 0.8)',
                    lineHeight: 1.7,
                    marginBottom: '2rem',
                    maxWidth: '520px',
                  }}
                >
                  {heroPost.excerpt}
                </p>
              )}

              {/* CTA */}
              <div className="animate-fade-up delay-300" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Link href={`/posts/${heroPost.slug}`} className="btn-primary">
                  <span>Découvrir</span>
                </Link>
                <span style={{ color: 'rgba(245,237,224,0.5)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                  {heroPost._count.likes} ♡ · {heroPost._count.comments} commentaires
                </span>
              </div>

            </div>
          </div>

          {/* Indicateur scroll */}
          <div style={{
            position: 'absolute', bottom: '2rem', right: '2rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.6rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(245,237,224,0.5)',
              writingMode: 'vertical-rl',
            }}>
              Défiler
            </span>
            <div style={{
              width: '1px', height: '48px',
              background: 'linear-gradient(to bottom, rgba(212,168,67,0.8), transparent)',
              animation: 'fadeUp 1.5s ease infinite',
            }} />
          </div>
        </section>
      )}

      {/* ── INTRO ÉDITORIALE ── */}
      <section style={{
        padding: 'var(--space-section) clamp(1.5rem, 5vw, 5rem)',
        maxWidth: '1400px', margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center',
      }} className="grid-responsive">
        <div>
          <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '1rem' }}>
            ✦ Notre Mission
          </p>
          <h2 className="title-section" style={{ color: 'var(--clr-bordeaux)', marginBottom: '1.5rem' }}>
            Chaque tresse<br />
            <em style={{ fontStyle: 'italic', fontWeight: 300 }}>raconte une histoire</em>
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--clr-gris)', lineHeight: 1.85, marginBottom: '2rem' }}>
            BornQueens célèbre les tresses africaines comme art vivant, mémoire collective
            et symbole de résistance. Chaque publication est une fenêtre sur une culture,
            une région, une époque.
          </p>
          <Link href="/about" className="btn-ghost">Explorer le projet</Link>
        </div>

        {/* Statistiques */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {[
            { number: posts.length + '+', label: 'Publications' },
            { number: categories.length,  label: 'Régions' },
            { number: '∞',                label: 'Histoires' },
            { number: '♡',                label: 'Partages' },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '2rem',
              borderTop: '2px solid var(--clr-or)',
              background: 'white',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                fontWeight: 600,
                color: 'var(--clr-bordeaux)',
                lineHeight: 1,
                marginBottom: '0.5rem',
              }}>
                {stat.number}
              </div>
              <div className="label-category" style={{ color: 'var(--clr-gris)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── GRILLE PRINCIPALE ── */}
      <section style={{
        padding: '0 clamp(1.5rem, 5vw, 5rem) var(--space-section)',
        maxWidth: '1400px', margin: '0 auto',
      }}>
        {/* En-tête de section */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          marginBottom: '3rem', paddingBottom: '1.5rem',
          borderBottom: '1px solid rgba(212,168,67,0.3)',
        }}>
          <div>
            <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '0.5rem' }}>
              ✦ Publications récentes
            </p>
            <h2 className="title-section" style={{ color: 'var(--clr-noir)' }}>
              Galerie
            </h2>
          </div>
          <Link href="/posts" className="btn-ghost">Tout voir</Link>
        </div>

        {/* Grille asymétrique */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'auto',
          gap: '1.5rem',
        }} className="grid-posts">
          {gridPosts.map((post, i) => (
            
            <PostCard
              key={post.id}
              post={{
                ...post,
                publishedAt: post.publishedAt?.toISOString() || new Date().toISOString(),
                categories: post.categories.map(pc => ({
                  name: pc.category.name,
                  slug: pc.category.slug,
                  
                })),
                likesCount: post._count.likes,
                commentsCount: post._count.comments,
              }}
              // La première et quatrième carte sont plus grandes
              featured={i === 0 || i === 3}
            />
          ))}
        </div>
      </section>

      {/* ── BANDE CATÉGORIES ── */}
      <section style={{
        background: 'var(--clr-noir)',
        padding: 'var(--space-section) clamp(1.5rem, 5vw, 5rem)',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '1rem', textAlign: 'center' }}>
            ✦ Explorer par région
          </p>
          <h2 className="title-section" style={{ color: 'var(--clr-creme)', textAlign: 'center', marginBottom: '3rem' }}>
            L&apos;Afrique à travers ses tresses
          </h2>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/posts?category=${cat.slug}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '1rem 2rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(212,168,67,0.2)',
                  color: 'var(--clr-creme)',
                  textDecoration: 'none',
                  transition: 'all 0.3s var(--ease-elegant)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8rem',
                  letterSpacing: '0.08em',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.background = 'rgba(212,168,67,0.15)'
                  el.style.borderColor = 'var(--clr-or)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.background = 'rgba(255,255,255,0.05)'
                  el.style.borderColor = 'rgba(212,168,67,0.2)'
                }}
              >
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: cat.color || 'var(--clr-or)',
                  flexShrink: 0,
                }} />
                {cat.name}
                <span style={{ color: 'var(--clr-gris)', fontSize: '0.7rem' }}>
                  {cat._count.posts}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Styles responsive */}
      <style>{`
        @media (max-width: 900px) {
          .grid-responsive { grid-template-columns: 1fr !important; }
          .grid-posts { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .grid-posts { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}