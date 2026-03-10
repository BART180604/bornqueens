// src/app/(site)/posts/[slug]/page.tsx
// Page de détail d'une publication — layout éditorial complet

import { notFound }  from 'next/navigation'
import { Metadata }  from 'next'
import Link          from 'next/link'
import { prisma }    from '@/app/lib/prisma'
import Gallery       from '@/app/components/posts/Gallery'
import { LikeButton }    from '@/app/components/interactions/LikeBouton'
import { ShareButtons }  from '@/app/components/interactions/ShareBouton'
import CommentList       from '@/app/components/interactions/CommentList'

// ─────────────────────────────────────────
// METADATA — Open Graph pour le partage social
// ─────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: 'Publication introuvable — BornQueens' }

  const coverPhoto = post.photos[post.coverIndex] || post.photos[0]

  return {
    title:       `${post.title} — BornQueens`,
    description: post.excerpt || `${post.title} · Histoire des tresses africaines`,
    openGraph: {
      title:       post.title,
      description: post.excerpt || '',
      images:      coverPhoto ? [{ url: coverPhoto.path, width: 1200, height: 630 }] : [],
      type:        'article',
      publishedTime: post.publishedAt?.toISOString(),
    },
    twitter: {
      card:        'summary_large_image',
      title:       post.title,
      description: post.excerpt || '',
      images:      coverPhoto ? [coverPhoto.path] : [],
    }
  }
}

// ─────────────────────────────────────────
// DATA FETCHING
// ─────────────────────────────────────────

async function getPost(slug: string) {
  return prisma.post.findFirst({
    where:   { slug, status: 'PUBLISHED' },
    include: {
      photos:     { orderBy: { order: 'asc' } },
      categories: { include: { category: true } },
      tags:       { include: { tag: true } },
      author:     { select: { id: true, username: true, displayName: true, avatar: true, bio: true } },
      _count:     { select: { likes: true, comments: true } },
    }
  })
}

async function getComments(postId: string) {
  return prisma.comment.findMany({
    where:   { postId, isApproved: true, isDeleted: false, parentId: null },
    orderBy: { createdAt: 'desc' },
    take:    20,
    include: {
      author:  { select: { id: true, username: true, displayName: true, avatar: true } },
      replies: {
        where:   { isApproved: true, isDeleted: false },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, username: true, displayName: true, avatar: true } } }
      }
    }
  })
}

async function getRelatedPosts(postId: string, categoryIds: string[]) {
  return prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      id:     { not: postId },
      categories: { some: { categoryId: { in: categoryIds } } }
    },
    take: 3,
    select: {
      id: true, title: true, slug: true, coverIndex: true,
      photos: { orderBy: { order: 'asc' }, take: 1,
                select: { path: true, thumbPath: true, alt: true, order: true } },
      _count: { select: { likes: true } }
    }
  })
}

// ─────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────

export default async function PostDetailPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  const categoryIds = post.categories.map(pc => pc.categoryId)
  const [comments, related] = await Promise.all([
    getComments(post.id),
    getRelatedPosts(post.id, categoryIds),
  ])

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL || ''
  const postUrl    = `${appUrl}/posts/${post.slug}`
  const categories = post.categories.map(pc => pc.category)
  const tags       = post.tags.map(pt => pt.tag)

  return (
    <main style={{ paddingTop: '5rem' }}>

      {/* ── GALERIE PLEINE LARGEUR ── */}
      <section style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem clamp(1rem, 4vw, 3rem)',
      }}>
        <Gallery photos={post.photos} coverIndex={post.coverIndex} />
      </section>

      {/* ── CONTENU ÉDITORIAL ── */}
      <section style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 clamp(1rem, 4vw, 3rem) var(--space-section)',
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '4rem',
        alignItems: 'start',
      }} className="detail-grid">

        {/* ── COLONNE PRINCIPALE ── */}
        <article>

          {/* Fil d'Ariane */}
          <nav style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.7rem',
            letterSpacing: '0.08em',
            color: 'var(--clr-gris)',
            marginBottom: '2rem',
          }}>
            <Link href="/"     style={{ color: 'var(--clr-gris)', textDecoration: 'none' }}>Accueil</Link>
            <span>›</span>
            <Link href="/posts" style={{ color: 'var(--clr-gris)', textDecoration: 'none' }}>Galerie</Link>
            {categories[0] && (
              <>
                <span>›</span>
                <Link
                  href={`/posts?category=${categories[0].slug}`}
                  style={{ color: 'var(--clr-bordeaux)', textDecoration: 'none' }}
                >
                  {categories[0].name}
                </Link>
              </>
            )}
          </nav>

          {/* Catégories */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {categories.map(cat => (
              <Link key={cat.id} href={`/posts?category=${cat.slug}`} className="tag"
                    style={{ textDecoration: 'none' }}>
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Titre */}
          <h1
            className="title-section animate-fade-up text-balance"
            style={{ color: 'var(--clr-noir)', marginBottom: '1rem' }}
          >
            {post.title}
          </h1>

          {/* Méta — région, période, date */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1.5rem',
            flexWrap: 'wrap',
            padding: '1rem 0',
            borderTop: '1px solid rgba(212,168,67,0.3)',
            borderBottom: '1px solid rgba(212,168,67,0.3)',
            marginBottom: '2.5rem',
          }}>
            {post.region && (
              <div>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--clr-or)',
                  display: 'block',
                  marginBottom: '2px',
                }}>Région</span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  color: 'var(--clr-noir)',
                }}>
                  {post.region}
                </span>
              </div>
            )}
            {post.period && (
              <div>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--clr-or)',
                  display: 'block',
                  marginBottom: '2px',
                }}>Époque</span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  color: 'var(--clr-noir)',
                }}>
                  {post.period}
                </span>
              </div>
            )}
            <div>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.6rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--clr-or)',
                display: 'block',
                marginBottom: '2px',
              }}>Photos</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                color: 'var(--clr-noir)',
              }}>
                {post.photos.length}
              </span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.7rem',
                color: 'var(--clr-gris)',
              }}>
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })
                  : ''}
              </span>
            </div>
          </div>

          {/* Corps éditorial */}
          <div
            className="prose-editorial"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          {/* Note : en production, utiliser react-markdown au lieu de dangerouslySetInnerHTML */}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{
              display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(0,0,0,0.06)',
            }}>
              {tags.map(tag => (
                <Link key={tag.id} href={`/posts?tag=${tag.slug}`} className="tag"
                      style={{ textDecoration: 'none' }}>
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* ── INTERACTIONS ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '2rem',
            marginTop: '3rem',
            padding: '2rem',
            background: 'white',
            boxShadow: 'var(--shadow-card)',
          }}>
            <LikeButton
              postId={post.id}
              initialCount={post._count.likes}
            />
            <ShareButtons url={postUrl} title={post.title} />
          </div>

          {/* ── COMMENTAIRES ── */}
          <div style={{ marginTop: '4rem' }}>
            <CommentList
              postId={post.id}
              comments={comments }
              total={post._count.comments}
              onCommentAdded={() => {}}
            />
          </div>
        </article>

        {/* ── COLONNE LATÉRALE ── */}
        <aside style={{ position: 'sticky', top: '6rem' }}>

          {/* Auteur */}
          <div style={{
            background: 'white',
            padding: '2rem',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '2rem',
          }}>
            <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '1rem' }}>
              ✦ Contributeur
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.username}
                  style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'var(--clr-bordeaux)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.4rem',
                }}>
                  {(post.author.displayName || post.author.username)[0].toUpperCase()}
                </div>
              )}
              <div>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--clr-noir)',
                }}>
                  {post.author.displayName || post.author.username}
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.7rem',
                  color: 'var(--clr-gris)',
                  letterSpacing: '0.05em',
                }}>
                  @{post.author.username}
                </p>
              </div>
            </div>
            {post.author.bio && (
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.825rem',
                color: 'var(--clr-gris)',
                lineHeight: 1.7,
              }}>
                {post.author.bio}
              </p>
            )}
          </div>

          {/* Publications liées */}
          {related.length > 0 && (
            <div style={{ background: 'white', padding: '2rem', boxShadow: 'var(--shadow-card)' }}>
              <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '1.5rem' }}>
                ✦ Dans la même veine
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {related.map(r => (
                  <Link
                    key={r.id}
                    href={`/posts/${r.slug}`}
                    style={{
                      display: 'flex', gap: '0.75rem', alignItems: 'center',
                      textDecoration: 'none', color: 'inherit',
                      padding: '0.5rem',
                      transition: 'background 0.2s',
                      borderRadius: '4px',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--clr-creme-light)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
                  >
                    <div style={{
                      width: '64px', height: '64px', flexShrink: 0,
                      overflow: 'hidden', position: 'relative',
                    }}>
                      {r.photos[0] && (
                        <img
                          src={r.photos[0].thumbPath || r.photos[0].path}
                          alt={r.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                    <div>
                      <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: 'var(--clr-noir)',
                        lineHeight: 1.3,
                        marginBottom: '0.25rem',
                      }}
                      className="line-clamp-2"
                      >
                        {r.title}
                      </p>
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.65rem',
                        color: 'var(--clr-gris)',
                      }}>
                        ♡ {r._count.likes}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>

      {/* ── Responsive ── */}
      <style>{`
        @media (max-width: 1024px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
          }
          .detail-grid aside {
            position: static !important;
          }
        }
      `}</style>
    </main>
  )
}