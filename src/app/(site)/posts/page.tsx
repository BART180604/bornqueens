// src/app/(site)/posts/page.tsx
// Page galerie — liste complète des publications
// Filtres : catégorie, tag, recherche, région
// Rendu hybride : filtres côté client via URL params, données SSR

import { Suspense }    from 'react'
import { Metadata }    from 'next'
import Link            from 'next/link'
import { prisma }      from '@/app/lib/prisma'
import PostCard        from '@/app/components/posts/PostCard'
import GalleryFilters  from '@/app/components/posts/GalleryFilters'

// ─────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────

export const metadata: Metadata = {
    title:       'Galerie — BornQueens',
    description: 'Explorez toutes les publications de BornQueens — histoire et photographie des tresses africaines.',
}

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface SearchParams {
    category?: string
    tag?:      string
    search?:   string
    region?:   string
    page?:     string
}

// ─────────────────────────────────────────
// DATA FETCHING
// ─────────────────────────────────────────

const PAGE_SIZE = 12

async function getPosts(params: SearchParams) {
    const page = Math.max(1, Number.parseInt(params.page || '1'))
    const skip = (page - 1) * PAGE_SIZE

    // Construction dynamique du filtre WHERE
    const where:Record<string,unknown> = { status: 'PUBLISHED' }

    if (params.search) {
        where.OR = [
            { title:   { contains: params.search, mode: 'insensitive' } },
            { excerpt: { contains: params.search, mode: 'insensitive' } },
            { content: { contains: params.search, mode: 'insensitive' } },
        ]
    }

    if (params.category) {
        where.categories = { some: { category: { slug: params.category } } }
    }

    if (params.tag) {
        where.tags = { some: { tag: { slug: params.tag } } }
    }

    if (params.region) {
        where.region = { contains: params.region, mode: 'insensitive' }
    }

    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where,
            orderBy: { publishedAt: 'desc' },
            skip,
            take: PAGE_SIZE,
            select: {
                id: true, title: true, slug: true,
                excerpt: true, region: true, period: true,
                coverIndex: true, publishedAt: true,
                photos: {
                    orderBy: { order: 'asc' },
                    take: 1,
                    select: { path: true, thumbPath: true, alt: true, order: true },
                },
                categories: {
                    select: { category: { select: { name: true, slug: true } } }
                },
                _count: { select: { likes: true, comments: true } },
            },
        }),
        prisma.post.count({ where }),
    ])

    return {
        posts: posts.map(p => ({
            ...p,
            categories:    p.categories.map(pc => pc.category),
            likesCount:    p._count.likes,
            commentsCount: p._count.comments,
            publishedAt:   p.publishedAt?.toISOString() ?? null,
        })),
        total,
        page,
        totalPages: Math.ceil(total / PAGE_SIZE),
    }
}

async function getFiltersData() {
    const [categories, regions] = await Promise.all([
        prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { posts: true } } },
        }),
        // Récupérer les régions distinctes
        prisma.post.findMany({
            where:    { status: 'PUBLISHED', region: { not: null } },
            select:   { region: true },
            distinct: ['region'],
            orderBy:  { region: 'asc' },
        }),
    ])

    return {
        categories,
        regions: regions.map(p => p.region).filter(Boolean) as string[],
    }
}

// ─────────────────────────────────────────
// PAGE COMPONENT (Server Component)
// ─────────────────────────────────────────

export default async function PostsPage({
                                            searchParams,
                                        }: Readonly<{
    searchParams:Promise< SearchParams>
}>) {
    const resolvedParams= await searchParams
    const [{ posts, total, page, totalPages }, { categories, regions }] =
        await Promise.all([getPosts(resolvedParams), getFiltersData()])

    const hasFilters = !!(resolvedParams.category ||resolvedParams.tag || resolvedParams.search || resolvedParams.region)

    return (
        <main style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--clr-creme-light)' }}>

            {/* ── EN-TÊTE DE PAGE ── */}
            <section style={{
                background: 'var(--clr-noir)',
                padding: 'clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 5rem)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Motif décoratif */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(139,26,74,0.15) 0%, transparent 60%),
                            radial-gradient(circle at 80% 20%, rgba(212,168,67,0.08) 0%, transparent 50%)`,
                    pointerEvents: 'none',
                }} />

                <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    {/* Fil d'Ariane */}
                    <nav style={{
                        display: 'flex', gap: '0.5rem', alignItems: 'center',
                        marginBottom: '1.5rem',
                        fontFamily: 'var(--font-body)', fontSize: '0.7rem',
                        letterSpacing: '0.08em',
                    }}>
                        <Link
                            href="/"
                            style={{ color: 'rgba(245,237,224,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}

                        >
                            Accueil
                        </Link>
                        <span style={{ color: 'rgba(245,237,224,0.25)' }}>›</span>
                        <span style={{ color: 'var(--clr-or)' }}>Galerie</span>
                    </nav>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <div>
                            <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '0.75rem' }}>
                                ✦ Toutes les publications
                            </p>
                            <h1 className="title-section" style={{ color: 'var(--clr-creme)', marginBottom: '0.5rem' }}>
                                {hasFilters
                                    ? resolvedParams.search
                                        ? `"${resolvedParams.search}"`
                                        : resolvedParams.category || resolvedParams.region || 'Filtré'
                                    : 'Galerie'}
                            </h1>
                            <p style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.875rem',
                                color: 'rgba(245,237,224,0.5)',
                            }}>
                                {total} publication{total > 1 ? 's' : ''}
                                {hasFilters && (
                                    <Link href="/posts" style={{ marginLeft: '1rem', color: 'var(--clr-or)', fontSize: '0.75rem', textDecoration: 'none' }}>
                                        ✕ Effacer les filtres
                                    </Link>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CONTENU PRINCIPAL ── */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem clamp(1.5rem, 5vw, 5rem)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '3rem', alignItems: 'start' }}
                     className="gallery-layout">

                    {/* ── SIDEBAR FILTRES ── */}
                    <aside style={{ position: 'sticky', top: '6rem' }}>
                        <Suspense fallback={<FiltersSkeleton />}>
                            <GalleryFilters
                                categories={categories}
                                regions={regions}
                                activeCategory={resolvedParams.category}
                                activeRegion={resolvedParams.region}
                                activeSearch={resolvedParams.search}
                            />
                        </Suspense>
                    </aside>

                    {/* ── GRILLE DES PUBLICATIONS ── */}
                    <div>
                        {posts.length === 0 ? (
                            <EmptyState hasFilters={hasFilters} />
                        ) : (
                            <>
                                {/* Grille */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '1.5rem',
                                    marginBottom: '3rem',
                                }} className="posts-grid">
                                    {posts.map((post, i) => (
                                        <div
                                            key={post.id}
                                            className="animate-fade-up"
                                            style={{ animationDelay: `${(i % 6) * 0.06}s` }}
                                        >
                                            <PostCard post={post} />
                                        </div>
                                    ))}
                                </div>

                                {/* ── PAGINATION ── */}
                                {totalPages > 1 && (
                                    <Pagination
                                        page={page}
                                        totalPages={totalPages}
                                        resolvedParams={resolvedParams}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        @media (max-width: 1024px) {
          .gallery-layout { grid-template-columns: 1fr !important; }
          .gallery-layout aside { position: static !important; }
        }
        @media (max-width: 700px) {
          .posts-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .posts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
        </main>
    )
}

// ─────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────

function Pagination({ page, totalPages, resolvedParams }: {
    page:         number
    totalPages:   number
    resolvedParams: SearchParams
}) {
    function buildHref(p: number) {
        const params = new URLSearchParams()
        if (resolvedParams.category) params.set('category', resolvedParams.category)
        if (resolvedParams.tag)      params.set('tag',      resolvedParams.tag)
        if (resolvedParams.search)   params.set('search',   resolvedParams.search)
        if (resolvedParams.region)   params.set('region',   resolvedParams.region)
        params.set('page', String(p))
        return `/posts?${params.toString()}`
    }

    // Générer les numéros de page visibles (max 7 éléments)
    function getPageNumbers(): (number | '...')[] {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

        const pages: (number | '...')[] = [1]
        if (page > 3)           pages.push('...')
        for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
            pages.push(p)
        }
        if (page < totalPages - 2) pages.push('...')
        pages.push(totalPages)
        return pages
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
        }}>
            {/* Précédent */}
            {page > 1 && (
                <Link href={buildHref(page - 1)} style={paginationLinkStyle(false)}>
                    ←
                </Link>
            )}

            {getPageNumbers().map((p, i) =>
                    p === '...' ? (
                        <span key={`dots-${i}`} style={{ padding: '0 0.5rem', color: 'var(--clr-gris)', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>
            …
          </span>
                    ) : (
                        <Link key={p} href={buildHref(p as number)} style={paginationLinkStyle(p === page)}>
                            {p}
                        </Link>
                    )
            )}

            {/* Suivant */}
            {page < totalPages && (
                <Link href={buildHref(page + 1)} style={paginationLinkStyle(false)}>
                    →
                </Link>
            )}
        </div>
    )
}

function paginationLinkStyle(isActive: boolean): React.CSSProperties {
    return {
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          '40px',
        height:         '40px',
        fontFamily:     'var(--font-body)',
        fontSize:       '0.875rem',
        textDecoration: 'none',
        background:     isActive ? 'var(--clr-bordeaux)' : 'white',
        color:          isActive ? 'white' : 'var(--clr-noir)',
        border:         `1px solid ${isActive ? 'var(--clr-bordeaux)' : 'rgba(0,0,0,0.1)'}`,
        transition:     'all 0.2s var(--ease-elegant)',
        fontWeight:     isActive ? 600 : 400,
    }
}

// ─────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
    return (
        <div style={{
            textAlign: 'center',
            padding: '5rem 2rem',
            background: 'white',
            border: '1px dashed rgba(0,0,0,0.1)',
        }}>
            <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: '3rem',
                color: 'rgba(0,0,0,0.1)',
                marginBottom: '1rem',
            }}>
                ✦
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.925rem', color: 'var(--clr-gris)', marginBottom: '1.5rem' }}>
                {hasFilters
                    ? 'Aucune publication ne correspond à ces critères.'
                    : 'Aucune publication pour l\'instant.'}
            </p>
            {hasFilters && (
                <Link href="/posts" className="btn-ghost">
                    Effacer les filtres
                </Link>
            )}
        </div>
    )
}

// ─────────────────────────────────────────
// SKELETON LOADER
// ─────────────────────────────────────────

function FiltersSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[140, 100, 120, 90, 110].map((w, i) => (
                <div key={i} style={{
                    height: '16px',
                    width: `${w}px`,
                    background: 'rgba(0,0,0,0.07)',
                    borderRadius: '3px',
                    animation: `pulse 1.4s ease ${i * 0.1}s infinite`,
                }} />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
        </div>
    )
}