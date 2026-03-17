'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/app/hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Post {
    id: string
    title: string
    slug: string
    status: 'DRAFT' | 'PUBLISHED'
    publishedAt: string | null
    createdAt: string
    photos: { thumbPath: string; path: string }[]
    _count: { likes: number; comments: number }
}

export default function StudioPostsPage() {
    const { token } = useAuth()
    const router = useRouter()

    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchPosts = useCallback(async () => {
        if (!token) return

        setIsLoading(true)

        try {
            const res = await fetch(`/api/studio/posts?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            const data = await res.json()

            if (data.success) {
                setPosts(data.posts)
                setTotalPages(data.pagination.totalPages)
            }
        } finally {
            setIsLoading(false)
        }
    }, [token, page])

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    async function handleDelete(id: string) {
        if (!confirm('Supprimer cette publication ?')) return

        await fetch(`/api/posts/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        })

        fetchPosts()
    }

    return (
        <div style={{ maxWidth: '900px' }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '2rem',
                }}
            >
                <div>
                    <h1
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '2rem',
                            fontWeight: 600,
                            color: 'var(--clr-noir)',
                            marginBottom: '0.25rem',
                        }}
                    >
                        Mes publications
                    </h1>
                </div>

                <Link
                    href="/studio/posts/new"
                    className="btn-primary"
                    style={{ textDecoration: 'none' }}
                >
                    <span>+ Nouvelle</span>
                </Link>
            </div>

            {/* Loading */}
            {isLoading ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '4rem',
                        color: 'var(--clr-gris)',
                        fontFamily: 'var(--font-body)',
                    }}
                >
                    Chargement...
                </div>
            ) : posts.length === 0 ? (
                /* Empty state */
                <div
                    style={{
                        textAlign: 'center',
                        padding: '4rem',
                        background: 'white',
                        border: '1px dashed rgba(0,0,0,0.1)',
                    }}
                >
                    <p
                        style={{
                            fontFamily: 'var(--font-body)',
                            color: 'var(--clr-gris)',
                            marginBottom: '1.5rem',
                        }}
                    >
                        Vous n&apos;avez pas encore de publications
                    </p>

                    <Link
                        href="/studio/posts/new"
                        className="btn-primary"
                        style={{ textDecoration: 'none' }}
                    >
                        <span>Créer ma première publication</span>
                    </Link>
                </div>
            ) : (
                /* Posts list */
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1px',
                        background: 'rgba(0,0,0,0.06)',
                    }}
                >
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem 1.25rem',
                                background: 'white',
                            }}
                        >
                            {/* Thumbnail */}
                            <div
                                style={{
                                    width: '56px',
                                    height: '56px',
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                    background: 'var(--clr-deep)',
                                }}
                            >
                                {post.photos[0] && (
                                    <img
                                        src={post.photos[0].thumbPath || post.photos[0].path}
                                        alt={post.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                )}
                            </div>

                            {/* Infos */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        color: 'var(--clr-noir)',
                                        marginBottom: '0.25rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {post.title}
                                </p>

                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span
                      style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.6rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          background:
                              post.status === 'PUBLISHED' ? '#D1FAE5' : '#FEF3C7',
                          color:
                              post.status === 'PUBLISHED' ? '#065F46' : '#92400E',
                          fontWeight: 500,
                      }}
                  >
                    {post.status === 'PUBLISHED'
                        ? '✓ Publié'
                        : '⏳ Brouillon'}
                  </span>

                                    <span
                                        style={{
                                            fontFamily: 'var(--font-body)',
                                            fontSize: '0.7rem',
                                            color: 'var(--clr-gris)',
                                        }}
                                    >
                    ♡ {post._count.likes} · ✉ {post._count.comments}
                  </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                {post.status === 'PUBLISHED' && (
                                    <Link
                                        href={`/posts/${post.slug}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            padding: '0.35rem 0.75rem',
                                            fontFamily: 'var(--font-body)',
                                            fontSize: '0.72rem',
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            background: 'white',
                                            color: 'var(--clr-gris)',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        ↗ Voir
                                    </Link>
                                )}

                                <button
                                    onClick={() =>
                                        router.push(`/studio/posts/${post.id}/edit`)
                                    }
                                    style={{
                                        padding: '0.35rem 0.75rem',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '0.72rem',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        background: 'white',
                                        color: 'var(--clr-noir)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Modifier
                                </button>

                                <button
                                    onClick={() => handleDelete(post.id)}
                                    style={{
                                        padding: '0.35rem 0.75rem',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '0.72rem',
                                        border: '1px solid #FCA5A5',
                                        background: 'white',
                                        color: '#DC2626',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginTop: '1.5rem',
                    }}
                >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            style={{
                                width: '36px',
                                height: '36px',
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.8rem',
                                background:
                                    p === page ? 'var(--clr-bordeaux)' : 'white',
                                color:
                                    p === page ? 'white' : 'var(--clr-noir)',
                                border: '1px solid rgba(0,0,0,0.1)',
                                cursor: 'pointer',
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}