// src/app/dashboard/posts/page.tsx
// Liste de toutes les publications — tableau admin avec actions

import Link   from 'next/link'
import Image  from 'next/image'
import { prisma } from '@/app/lib/prisma'
import DashboardPostsClient from '@/app/components/dashboard/DashboardPostsClient'

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface SearchParams {
    status?: string
    search?: string
    page?:   string
}

// ─────────────────────────────────────────
// DATA FETCHING (Server Component)
// ─────────────────────────────────────────

const PAGE_SIZE = 15

async function getPosts(params: SearchParams) {
    const page = Math.max(1, parseInt(params.page || '1'))
    const skip = (page - 1) * PAGE_SIZE

    const where: any = {}

    if (params.status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(params.status)) {
        where.status = params.status
    }
    if (params.search) {
        where.OR = [
            { title:   { contains: params.search, mode: 'insensitive' } },
            { region:  { contains: params.search, mode: 'insensitive' } },
        ]
    }

    const [posts, total, counts] = await Promise.all([
        prisma.post.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: PAGE_SIZE,
            select: {
                id: true, title: true, slug: true, status: true,
                region: true, period: true, coverIndex: true,
                createdAt: true, publishedAt: true,
                photos:  { take: 1, orderBy: { order: 'asc' }, select: { thumbPath: true, path: true, alt: true } },
                author:  { select: { username: true, displayName: true } },
                _count:  { select: { likes: true, comments: true, photos: true } },
            }
        }),
        prisma.post.count({ where }),
        // Compteurs par statut pour les onglets
        Promise.all([
            prisma.post.count(),
            prisma.post.count({ where: { status: 'PUBLISHED' } }),
            prisma.post.count({ where: { status: 'DRAFT' } }),
            prisma.post.count({ where: { status: 'ARCHIVED' } }),
        ])
    ])

    return {
        posts: posts.map(p => ({
            ...p,
            createdAt:   p.createdAt.toISOString(),
            publishedAt: p.publishedAt?.toISOString() ?? null,
        })),
        total,
        page,
        totalPages: Math.ceil(total / PAGE_SIZE),
        statusCounts: {
            all:       counts[0],
            published: counts[1],
            draft:     counts[2],
            archived:  counts[3],
        }
    }
}

// ─────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────

export default async function DashboardPostsPage({ searchParams }: Readonly<{ searchParams: SearchParams }>) {
    const { posts, total, page, totalPages, statusCounts } = await getPosts(searchParams)

    return (
        <div style={{ maxWidth: '1100px' }}>

            {/* En-tête */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--clr-noir)', marginBottom: '0.25rem' }}>
                        Publications
                    </h1>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--clr-gris)' }}>
                        {total} publication{total > 1 ? 's' : ''} au total
                    </p>
                </div>
                <Link href="/dashboard/posts/new" className="btn-primary" style={{ flexShrink: 0 }}>
                    <span>+ Nouvelle publication</span>
                </Link>
            </div>

            {/* Onglets statut */}
            <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.08)', overflowX: 'auto' }}>
                {[
                    { value: undefined,    label: 'Toutes',    count: statusCounts.all },
                    { value: 'PUBLISHED',  label: 'Publiées',  count: statusCounts.published },
                    { value: 'DRAFT',      label: 'Brouillons', count: statusCounts.draft },
                    { value: 'ARCHIVED',   label: 'Archivées', count: statusCounts.archived },
                ].map(tab => {
                    const isActive = (searchParams.status || undefined) === tab.value
                    const href = tab.value
                        ? `/dashboard/posts?status=${tab.value}`
                        : '/dashboard/posts'

                    return (
                        <Link key={tab.label} href={href} style={{
                            display:      'flex',
                            alignItems:   'center',
                            gap:          '0.4rem',
                            padding:      '0.75rem 1.25rem',
                            fontFamily:   'var(--font-body)',
                            fontSize:     '0.8rem',
                            fontWeight:   isActive ? 600 : 400,
                            color:        isActive ? 'var(--clr-bordeaux)' : 'var(--clr-gris)',
                            textDecoration: 'none',
                            borderBottom: isActive ? '2px solid var(--clr-bordeaux)' : '2px solid transparent',
                            marginBottom: '-1px',
                            whiteSpace:   'nowrap',
                            transition:   'all 0.15s',
                        }}>
                            {tab.label}
                            <span style={{
                                padding:    '0.1rem 0.4rem',
                                background: isActive ? 'rgba(139,26,74,0.1)' : 'rgba(0,0,0,0.06)',
                                color:      isActive ? 'var(--clr-bordeaux)' : 'var(--clr-gris)',
                                fontSize:   '0.65rem',
                                fontWeight: 600,
                                borderRadius: '999px',
                            }}>
                {tab.count}
              </span>
                        </Link>
                    )
                })}
            </div>

            {/* Composant client pour recherche + actions + tableau */}
            <DashboardPostsClient
                posts={posts}
                total={total}
                page={page}
                totalPages={totalPages}
                activeSearch={searchParams.search}
                activeStatus={searchParams.status}
            />
        </div>
    )
}