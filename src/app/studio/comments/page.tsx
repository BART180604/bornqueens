'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/app/hooks/useAuth'
import Link        from 'next/link'

interface Comment {
    id:        string
    content:   string
    isApproved: boolean
    createdAt: string
    author:    { username: string; displayName: string | null; avatarUrl: string | null }
    post:      { id: string; title: string; slug: string }
}

export default function StudioCommentsPage() {
    const { token }   = useAuth()
    const [comments,   setComments]   = useState<Comment[]>([])
    const [isLoading,  setIsLoading]  = useState(true)
    const [page,       setPage]       = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total,      setTotal]      = useState(0)

    const fetchComments = useCallback(async () => {
        if (!token) return
        setIsLoading(true)
        try {
            const res  = await fetch(`/api/studio/comments?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setComments(data.comments)
                setTotalPages(data.pagination.totalPages)
                setTotal(data.pagination.total)
            }
        } finally {
            setIsLoading(false)
        }
    }, [token, page])

    useEffect(() => { fetchComments() }, [fetchComments])

    function timeAgo(dateStr: string) {
        const diff  = Date.now() - new Date(dateStr).getTime()
        const mins  = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days  = Math.floor(diff / 86400000)
        if (mins  < 1)  return 'À l\'instant'
        if (mins  < 60) return `${mins} min`
        if (hours < 24) return `${hours}h`
        return `${days}j`
    }

    return (
        <div style={{ maxWidth: '900px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--clr-noir)', marginBottom: '0.25rem' }}>
                    Commentaires reçus
                </h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--clr-gris)' }}>
                    {total} commentaire{total > 1 ? 's' : ''} sur vos publications
                </p>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--clr-gris)', fontFamily: 'var(--font-body)' }}>
                    Chargement...
                </div>
            ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'white', border: '1px dashed rgba(0,0,0,0.1)' }}>
                    <p style={{ fontFamily: 'var(--font-body)', color: 'var(--clr-gris)' }}>
                        Aucun commentaire reçu pour l&apos;instant
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(0,0,0,0.06)' }}>
                    {comments.map(c => (
                        <div key={c.id} style={{
                            padding:    '1rem 1.25rem',
                            background: 'white',
                            display:    'flex',
                            gap:        '1rem',
                        }}>
                            {/* Avatar */}
                            <div style={{ flexShrink: 0 }}>
                                {c.author.avatarUrl ? (
                                    <img src={c.author.avatarUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        background: 'var(--clr-bordeaux)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontFamily: 'var(--font-display)', fontSize: '1rem',
                                    }}>
                                        {(c.author.displayName || c.author.username)[0].toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Contenu */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--clr-noir)' }}>
                                        {c.author.displayName || c.author.username}
                                    </span>
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--clr-gris)' }}>
                                        sur
                                    </span>
                                    <Link href={`/posts/${c.post.slug}`} target="_blank" style={{
                                        fontFamily: 'var(--font-body)', fontSize: '0.7rem',
                                        color: 'var(--clr-bordeaux)', textDecoration: 'none',
                                    }}>
                                        {c.post.title.length > 40 ? c.post.title.substring(0, 40) + '…' : c.post.title}
                                    </Link>
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'rgba(0,0,0,0.3)', marginLeft: 'auto' }}>
                                        {timeAgo(c.createdAt)}
                                    </span>
                                </div>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.825rem', color: 'var(--clr-gris)', lineHeight: 1.6 }}>
                                    {c.content}
                                </p>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <span style={{
                                        fontFamily:   'var(--font-body)',
                                        fontSize:     '0.6rem',
                                        padding:      '0.15rem 0.5rem',
                                        borderRadius: '999px',
                                        background:   c.isApproved ? '#D1FAE5' : '#FEF3C7',
                                        color:        c.isApproved ? '#065F46' : '#92400E',
                                    }}>
                                        {c.isApproved ? '✓ Approuvé' : '⏳ En attente'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)} style={{
                            width: '36px', height: '36px',
                            fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                            background: p === page ? 'var(--clr-bordeaux)' : 'white',
                            color:      p === page ? 'white' : 'var(--clr-noir)',
                            border:     '1px solid rgba(0,0,0,0.1)',
                            cursor:     'pointer',
                        }}>
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}