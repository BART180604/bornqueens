export const dynamic = 'force-dynamic'

// src/app/(site)/posts/[id]/page.tsx
// Page de détail d'une publication — layout éditorial complet

import { notFound }        from 'next/navigation'
import { Metadata }        from 'next'
import Link                from 'next/link'
import { cache }           from 'react'
import { prisma }          from '@/app/lib/prisma'
import Gallery             from '@/app/components/posts/Gallery'
import { LikeButton }      from '@/app/components/interactions/LikeButton'
import ShareButtons        from '@/app/components/interactions/ShareButtons'
import CommentsSection     from '@/app/components/interactions/CommentsSection'
import { SaveButton } from '@/app/components/interactions/SaveButton'
// ─────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────

// Next.js 15 : params est une Promise — il faut l'await avant d'accéder aux propriétés
type Params = { params: Promise<{ id: string }> }

interface Photo {
  id:               string
  path:             string
  thumbPath:        string
  alt:              string | null
  caption:          string | null
  order:            number
  width:            number | null
  height:           number | null
  size:             number | null
  filename:         string
  postId:           string
  createdAt:        Date
  photographerName: string | null
  modelName:        string | null
}

interface Category {
  id:   string
  name: string
  slug: string
}

interface Tag {
  id:   string
  name: string
  slug: string
}

interface Author {
  id:          string
  username:    string
  displayName: string | null
  avatarUrl:   string | null
  bio:         string | null
}

interface Post {
  id:            string
  title:         string
  slug:          string
  excerpt:       string | null
  content:       string
  region:        string | null
  period:        string | null
  coverIndex:    number
  publishedAt:   Date | null
  photos:        Photo[]
  categories:    Category[]
  tags:          Tag[]
  author:        Author
  likesCount:    number
  commentsCount: number
}

interface CommentAuthor {
  id:          string
  username:    string
  displayName: string | null
  avatarUrl:   string | null
}

interface Comment {
  id:        string
  content:   string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  author:    CommentAuthor
  replies:   Comment[]
  _count?:   { replies: number }
}

interface RelatedPost {
  id:         string
  title:      string
  slug:       string
  coverIndex: number
  photos: {
    path:      string
    thumbPath: string
    alt:       string | null
  }[]
  likesCount: number
}

// ─────────────────────────────────────────
// METADATA — Open Graph
// ─────────────────────────────────────────

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)
  if (!post) return { title: 'Publication introuvable — BornQueens' }

  const coverPhoto = post.photos[post.coverIndex] ?? post.photos[0]

  return {
    title:       `${post.title} — BornQueens`,
    description: post.excerpt ?? `${post.title} · Histoire des tresses africaines`,
    openGraph: {
      title:         post.title,
      description:   post.excerpt ?? '',
      images:        coverPhoto ? [{ url: coverPhoto.path, width: 1200, height: 630 }] : [],
      type:          'article',
      publishedTime: post.publishedAt?.toISOString(),
    },
    twitter: {
      card:        'summary_large_image',
      title:       post.title,
      description: post.excerpt ?? '',
      images:      coverPhoto ? [coverPhoto.path] : [],
    },
  }
}

// ─────────────────────────────────────────
// DATA FETCHING
// ─────────────────────────────────────────

// React.cache() déduplique les appels dans le même render tree.
// Le paramètre s'appelle "idOrSlug" : on tente d'abord par id,
// puis par slug si rien n'est trouvé — les URLs /posts/slug fonctionnent.
const getPost = cache(async (idOrSlug: string): Promise<Post | null> => {
  const include = {
    photos:     { orderBy: { order: 'asc' } },
    categories: { include: { category: true } },
    tags:       { include: { tag: true } },
    author: {
      select: {
        id: true, username: true, displayName: true,
        avatarUrl: true, bio: true,
      },
    },
    _count: { select: { likes: true, comments: true } },
  } as const

  // 1ère tentative : par id
  let raw = await prisma.post.findFirst({
    where:   { id: idOrSlug, status: 'PUBLISHED' },
    include,
  })

  // Fallback : par slug (cas des URLs comme /posts/couronne-du-sahel)
  if (!raw) {
    raw = await prisma.post.findFirst({
      where:   { slug: idOrSlug, status: 'PUBLISHED' },
      include,
    })
  }

  if (!raw) return null

  return {
    id:            raw.id,
    title:         raw.title,
    slug:          raw.slug,
    excerpt:       raw.excerpt,
    content:       raw.content,
    region:        raw.region,
    period:        raw.period,
    coverIndex:    raw.coverIndex,
    publishedAt:   raw.publishedAt,
    photos:        raw.photos,
    categories:    raw.categories.map(pc => pc.category),
    tags:          raw.tags.map(pt => pt.tag),
    author:        raw.author,
    likesCount:    raw._count.likes,
    commentsCount: raw._count.comments,
  }
})

async function getComments(postId: string): Promise<Comment[]> {
  const raw = await prisma.comment.findMany({
    where:   { postId, isApproved: true, isDeleted: false, parentId: null },
    orderBy: { createdAt: 'desc' },
    take:    20,
    include: {
      author: {
        select: {
          id: true, username: true, displayName: true, avatarUrl: true,
        },
      },
      replies: {
        where:   { isApproved: true, isDeleted: false },
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: {
              id: true, username: true, displayName: true, avatarUrl: true,
            },
          },
        },
      },
      _count: { select: { replies: true } },
    },
  })

  return raw.map(c => ({
    id:        c.id,
    content:   c.content,
    isDeleted: c.isDeleted,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    author:    c.author,
    _count:    c._count,
    replies:   c.replies.map(r => ({
      id:        r.id,
      content:   r.content,
      isDeleted: r.isDeleted,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      author:    r.author,
      replies:   [],
    })),
  }))
}

async function getRelatedPosts(postId: string, categoryIds: string[]): Promise<RelatedPost[]> {
  const raw = await prisma.post.findMany({
    where: {
      status:     'PUBLISHED',
      id:         { not: postId },
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    take:   3,
    select: {
      id: true, title: true, slug: true, coverIndex: true,
      photos: {
        orderBy: { order: 'asc' },
        take:    1,
        select:  { path: true, thumbPath: true, alt: true },
      },
      _count: { select: { likes: true } },
    },
  })

  return raw.map(r => ({
    id:         r.id,
    title:      r.title,
    slug:       r.slug,
    coverIndex: r.coverIndex,
    photos:     r.photos,
    likesCount: r._count.likes,
  }))
}

// ─────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────

export default async function PostDetailPage({ params }: Params) {
  const { id } = await params
  const post = await getPost(id)
  if (!post) notFound()

  const [comments, related] = await Promise.all([
    getComments(post.id),
    getRelatedPosts(post.id, post.categories.map(c => c.id)),
  ])

  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const postUrl = `${appUrl}/posts/${post.slug}`

  return (
      <main style={{ paddingTop: '5rem' }}>

        {/* ── GALERIE PLEINE LARGEUR ── */}
        <section style={{
          maxWidth: '1400px',
          margin:   '0 auto',
          padding:  '2rem clamp(1rem, 4vw, 3rem)',
        }}>
          <Gallery photos={post.photos} coverIndex={post.coverIndex} />
        </section>

        {/* ── CONTENU ÉDITORIAL ── */}
        <section
            className="detail-grid"
            style={{
              maxWidth:            '1400px',
              margin:              '0 auto',
              padding:             '0 clamp(1rem, 4vw, 3rem) var(--space-section)',
              display:             'grid',
              gridTemplateColumns: '1fr 340px',
              gap:                 '4rem',
              alignItems:          'start',
            }}
        >

          {/* ── COLONNE PRINCIPALE ── */}
          <article>

            {/* Fil d'Ariane */}
            <nav style={{
              display:       'flex',
              alignItems:    'center',
              gap:           '0.5rem',
              fontFamily:    'var(--font-body)',
              fontSize:      '0.7rem',
              letterSpacing: '0.08em',
              color:         'var(--clr-gris)',
              marginBottom:  '2rem',
            }}>
              <Link href="/"      style={{ color: 'var(--clr-gris)', textDecoration: 'none' }}>Accueil</Link>
              <span>›</span>
              <Link href="/posts" style={{ color: 'var(--clr-gris)', textDecoration: 'none' }}>Galerie</Link>
              {post.categories[0] && (
                  <>
                    <span>›</span>
                    <Link
                        href={`/posts?category=${post.categories[0].slug}`}
                        style={{ color: 'var(--clr-bordeaux)', textDecoration: 'none' }}
                    >
                      {post.categories[0].name}
                    </Link>
                  </>
              )}
            </nav>

            {/* Badges catégories */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {post.categories.map(cat => (
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

            {/* Méta — région, période, nb photos, date */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '1.5rem',
              flexWrap:     'wrap',
              padding:      '1rem 0',
              borderTop:    '1px solid rgba(212,168,67,0.3)',
              borderBottom: '1px solid rgba(212,168,67,0.3)',
              marginBottom: '2.5rem',
            }}>
              {post.region && <MetaItem label="Région"  value={post.region} />}
              {post.period && <MetaItem label="Époque"  value={post.period} />}
              <MetaItem label="Photos" value={String(post.photos.length)} />
              <div style={{ marginLeft: 'auto' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--clr-gris)' }}>
                {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                    : ''}
              </span>
              </div>
            </div>

            {/* Corps
              CORRECTION 5 : dangerouslySetInnerHTML est correct UNIQUEMENT si
              post.content est du HTML sanitisé (ex: sortie de remark/rehype).
              Si c'est du Markdown brut, remplacer par ReactMarkdown :
              import ReactMarkdown from 'react-markdown'
              <ReactMarkdown className="prose-editorial">{post.content}</ReactMarkdown>
          */}
            <div
                className="prose-editorial"
                dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags.length > 0 && (
                <div style={{
                  display:    'flex',
                  gap:        '0.5rem',
                  flexWrap:   'wrap',
                  marginTop:  '3rem',
                  paddingTop: '2rem',
                  borderTop:  '1px solid rgba(0,0,0,0.06)',
                }}>
                  {post.tags.map(tag => (
                      <Link key={tag.id} href={`/posts?tag=${tag.slug}`} className="tag"
                            style={{ textDecoration: 'none' }}>
                        #{tag.name}
                      </Link>
                  ))}
                </div>
            )}

            {/* ── INTERACTIONS ── */}
            <div style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              flexWrap:       'wrap',
              gap:            '2rem',
              marginTop:      '3rem',
              padding:        '2rem',
              background:     'white',
              boxShadow:      'var(--shadow-card)',
            }}>
              <LikeButton postId={post.id} initialCount={post.likesCount} />
              <SaveButton postId={post.id} />
              <ShareButtons url={postUrl} title={post.title} />
            </div>

            {/* ── COMMENTAIRES ── */}
            <div style={{ marginTop: '4rem' }}>
              <CommentsSection
                  postId={post.id}
                  initialComments={comments}
                  initialTotal={post.commentsCount}
              />
            </div>
          </article>

          {/* ── COLONNE LATÉRALE ── */}
          <aside style={{ position: 'sticky', top: '6rem' }}>

            {/* Auteur */}
            <div style={{
              background:   'white',
              padding:      '2rem',
              boxShadow:    'var(--shadow-card)',
              marginBottom: '2rem',
            }}>
              <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '1rem' }}>
                ✦ Contributeur
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                {post.author.avatarUrl ? (
                    <img
                        src={post.author.avatarUrl}
                        alt={post.author.username}
                        style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                ) : (
                    <div style={{
                      width:          '52px',
                      height:         '52px',
                      borderRadius:   '50%',
                      background:     'var(--clr-bordeaux)',
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      color:          'white',
                      fontFamily:     'var(--font-display)',
                      fontSize:       '1.4rem',
                    }}>
                      {(post.author.displayName ?? post.author.username)[0].toUpperCase()}
                    </div>
                )}
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--clr-noir)' }}>
                    {post.author.displayName ?? post.author.username}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--clr-gris)', letterSpacing: '0.05em' }}>
                    @{post.author.username}
                  </p>
                </div>
              </div>
              {post.author.bio && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.825rem', color: 'var(--clr-gris)', lineHeight: 1.7 }}>
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
                        <RelatedPostCard key={r.id} post={r} />
                    ))}
                  </div>
                </div>
            )}
          </aside>
        </section>

        <style>{`
        @media (max-width: 1024px) {
          .detail-grid { grid-template-columns: 1fr !important; }
          .detail-grid aside { position: static !important; }
        }
      `}</style>
      </main>
  )
}

// ─────────────────────────────────────────
// SOUS-COMPOSANTS
// ─────────────────────────────────────────

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
      <div>
      <span style={{
        fontFamily:    'var(--font-body)',
        fontSize:      '0.6rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color:         'var(--clr-or)',
        display:       'block',
        marginBottom:  '2px',
      }}>
        {label}
      </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--clr-noir)' }}>
        {value}
      </span>
      </div>
  )
}

function RelatedPostCard({ post }: { post: RelatedPost }) {
  const thumb = post.photos[0]

  return (
      <Link
          // CORRECTION 6 : navigation cohérente par slug (comme partout ailleurs dans ce fichier)
          // Si tu navigues par id ailleurs dans l'app, remplace par post.id
          href={`/posts/${post.slug}`}
          style={{
            display:        'flex',
            gap:            '0.75rem',
            alignItems:     'center',
            textDecoration: 'none',
            color:          'inherit',
            padding:        '0.5rem',
            transition:     'background 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--clr-creme-light)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
      >
        <div style={{ width: '64px', height: '64px', flexShrink: 0, overflow: 'hidden' }}>
          {thumb && (
              <img
                  src={thumb.thumbPath ?? thumb.path}
                  alt={post.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
          )}
        </div>
        <div>
          <p
              className="line-clamp-2"
              style={{
                fontFamily:   'var(--font-display)',
                fontSize:     '0.95rem',
                fontWeight:   600,
                color:        'var(--clr-noir)',
                lineHeight:   1.3,
                marginBottom: '0.25rem',
              }}
          >
            {post.title}
          </p>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'var(--clr-gris)' }}>
          ♡ {post.likesCount}
        </span>
        </div>
      </Link>
  )
}