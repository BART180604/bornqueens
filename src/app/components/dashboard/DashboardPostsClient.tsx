'use client'
// src/components/dashboard/DashboardPostsClient.tsx
// Partie interactive de la liste des publications :
// - Barre de recherche (modifie l'URL)
// - Tableau avec actions (modifier, archiver, supprimer)
// - Pagination URL-based

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link   from 'next/link'
import Image  from 'next/image'
import { useAuth } from '@/app/hooks/useAuth'

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface Post {
    id:          string
    title:       string
    slug:        string
    status:      string
    region:      string | null
    period:      string | null
    createdAt:   string
    publishedAt: string | null
    photos:      { thumbPath: string; path: string; alt: string | null }[]
    author:      { username: string; displayName: string | null }
    _count:      { likes: number; comments: number; photos: number }
}

interface Props {
    posts:        Post[]
    total:        number
    page:         number
    totalPages:   number
    activeSearch?: string
    activeStatus?: string
}

// ─────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
    PUBLISHED: { label: 'Publié',    bg: '#D1FAE5', color: '#065F46' },
    DRAFT:     { label: 'Brouillon', bg: '#FEF3C7', color: '#92400E' },
    ARCHIVED:  { label: 'Archivé',   bg: '#F3F4F6', color: '#6B7280' },
}

// ─────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────

export default function DashboardPostsClient({ posts: initialPosts, total, page, totalPages, activeSearch, activeStatus }: Readonly<Props>) {
    const router       = useRouter()
    const pathname     = usePathname()
    const searchParams = useSearchParams()
    const { token }    = useAuth()

    const [posts,       setPosts]       = useState<Post[]>(initialPosts)
    const [searchInput, setSearchInput] = useState(activeSearch || '')
    const [deletingId,  setDeletingId]  = useState<string | null>(null)
    const [isPending,   startTransition] = useTransition()

    // ── Navigation URL ──
    function buildURL(updates: Record<string, string | undefined>) {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(updates).forEach(([k, v]) => v ? params.set(k, v) : params.delete(k))
        params.delete('page')
        return `${pathname}?${params.toString()}`
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        startTransition(() => {
            router.push(buildURL({ search: searchInput.trim() || undefined }))
        })
    }

    // ── Changer le statut d'une publication ──
    async function changeStatus(postId: string, newStatus: string) {
        const res  = await fetch(`/api/posts/${postId}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body:    JSON.stringify({ status: newStatus }),
        })
        const data = await res.json()
        if (data.success) {
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, status: newStatus } : p
            ))
        }
    }

    // ── Supprimer une publication ──
    async function deletePost(postId: string, title: string) {
        if (!confirm(`Supprimer "${title}" ?\n\nCette action est irréversible — les photos associées seront aussi supprimées.`)) return

        setDeletingId(postId)
        try {
            const res  = await fetch(`/api/posts/${postId}`, {
                method:  'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await res.json()
            if (data.success) {
                setPosts(prev => prev.filter(p => p.id !== postId))
            } else {
                alert(data.message || 'Erreur lors de la suppression')
            }
        } finally {
            setDeletingId(null)
        }
    }

    // ─────────────────────────────────────────
    // RENDU
    // ─────────────────────────────────────────

    return (
        <div>

            {/* Barre de recherche */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Rechercher par titre ou région..."
                        style={{
                            width: '100%',
                            padding: '0.65rem 0.875rem 0.65rem 2.5rem',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.825rem',
                            color: 'var(--clr-noir)',
                            background: 'white',
                            border: '1px solid rgba(0,0,0,0.1)',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            borderRadius: 0,
                        }}
                        onFocus={e => { e.target.style.borderColor = 'var(--clr-bordeaux)' }}
                        onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.1)' }}
                    />
                    <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-gris)', fontSize: '0.9rem' }}>
            ⌕
          </span>
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.25rem', flexShrink: 0 }}>
                    <span>Rechercher</span>
                </button>
                {(activeSearch || activeStatus) && (
                    <Link href="/dashboard/posts" className="btn-ghost" style={{ padding: '0.65rem 1rem', flexShrink: 0 }}>
                        ✕ Réinitialiser
                    </Link>
                )}
            </form>

            {/* Tableau */}
            {posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'white', border: '1px dashed rgba(0,0,0,0.1)' }}>
                    <p style={{ fontFamily: 'var(--font-body)', color: 'var(--clr-gris)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                        {activeSearch ? `Aucun résultat pour "${activeSearch}"` : 'Aucune publication'}
                    </p>
                    <Link href="/dashboard/posts/new" className="btn-primary">
                        <span>Créer la première publication</span>
                    </Link>
                </div>
            ) : (
                <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>

                    {/* En-tête du tableau */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '48px 1fr 100px 80px 80px 140px',
                        gap: '1rem',
                        padding: '0.625rem 1rem',
                        background: '#F9F7F5',
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}>
                        {['', 'Publication', 'Statut', 'Likes', 'Photos', 'Actions'].map((h, i) => (
                            <span key={i} style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: 'var(--clr-gris)',
                            }}>
                {h}
              </span>
                        ))}
                    </div>

                    {/* Lignes */}
                    {posts.map((post, i) => (
                        <PostRow
                            key={post.id}
                            post={post}
                            isLast={i === posts.length - 1}
                            isDeleting={deletingId === post.id}
                            onChangeStatus={changeStatus}
                            onDelete={deletePost}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--clr-gris)' }}>
                        Page {page} sur {totalPages} · {total} publications
                    </p>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                        {page > 1 && (
                            <Link href={buildURL({ page: String(page - 1) })} style={pagBtnStyle(false)}>← Précédente</Link>
                        )}
                        {page < totalPages && (
                            <Link href={buildURL({ page: String(page + 1) })} style={pagBtnStyle(true)}>Suivante →</Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────
// LIGNE DU TABLEAU
// ─────────────────────────────────────────

function PostRow({ post, isLast, isDeleting, onChangeStatus, onDelete }: {
    post:           Post
    isLast:         boolean
    isDeleting:     boolean
    onChangeStatus: (id: string, status: string) => void
    onDelete:       (id: string, title: string) => void
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const s = STATUS[post.status] || STATUS.DRAFT
    const thumb = post.photos[0]

    function formatDate(dateStr: string | null) {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '48px 1fr 100px 80px 80px 140px',
            gap: '1rem',
            padding: '0.875rem 1rem',
            alignItems: 'center',
            borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.05)',
            opacity: isDeleting ? 0.4 : 1,
            transition: 'opacity 0.2s, background 0.15s',
            background: 'white',
        }}
             onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#FDFAF8' }}
             onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'white' }}
        >
            {/* Miniature */}
            <div style={{ width: '48px', height: '48px', overflow: 'hidden', flexShrink: 0, background: '#F3F4F6' }}>
                {thumb ? (
                    <Image
                        src={thumb.thumbPath || thumb.path}
                        alt={thumb.alt || post.title}
                        width={48} height={48}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--clr-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '1.2rem' }}>
                        ✦
                    </div>
                )}
            </div>

            {/* Titre + méta */}
            <div style={{ minWidth: 0 }}>
                <p style={{
                    fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                    fontWeight: 500, color: 'var(--clr-noir)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: '0.2rem',
                }}>
                    {post.title}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'var(--clr-gris)' }}>
                    {post.region && <span style={{ marginRight: '0.5rem' }}>📍 {post.region}</span>}
                    {post.status === 'PUBLISHED'
                        ? `Publié le ${formatDate(post.publishedAt)}`
                        : `Créé le ${formatDate(post.createdAt)}`}
                    <span style={{ marginLeft: '0.5rem', color: 'rgba(0,0,0,0.3)' }}>· @{post.author.displayName || post.author.username}</span>
                </p>
            </div>

            {/* Statut */}
            <div>
        <span style={{
            display: 'inline-block',
            padding: '0.2rem 0.6rem',
            background: s.bg, color: s.color,
            fontFamily: 'var(--font-body)', fontSize: '0.65rem',
            fontWeight: 600, letterSpacing: '0.05em',
            borderRadius: '999px',
        }}>
          {s.label}
        </span>
            </div>

            {/* Likes */}
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--clr-gris)' }}>
                <span style={{ color: 'var(--clr-bordeaux)', marginRight: '2px' }}>♥</span>
                {post._count.likes}
                <br />
                <span style={{ fontSize: '0.65rem' }}>
          <span style={{ marginRight: '2px' }}>✉</span>{post._count.comments}
        </span>
            </div>

            {/* Nb photos */}
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--clr-gris)' }}>
                ◻ {post._count.photos}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' }}>

                {/* Modifier */}
                <Link href={`/dashboard/posts/${post.id}/edit`}
                      title="Modifier"
                      style={{
                          padding: '0.375rem 0.625rem',
                          fontFamily: 'var(--font-body)', fontSize: '0.7rem',
                          color: 'var(--clr-bordeaux)',
                          border: '1px solid rgba(139,26,74,0.3)',
                          textDecoration: 'none',
                          transition: 'all 0.15s',
                          whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'var(--clr-bordeaux)'; el.style.color = 'white' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'transparent'; el.style.color = 'var(--clr-bordeaux)' }}
                >
                    Modifier
                </Link>

                {/* Menu contextuel ⋮ */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{
                            padding: '0.375rem 0.5rem',
                            background: 'white', border: '1px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer', fontSize: '1rem', color: 'var(--clr-gris)',
                            transition: 'all 0.15s', lineHeight: 1,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white' }}
                    >
                        ⋮
                    </button>

                    {menuOpen && (
                        <>
                            {/* Overlay pour fermer au clic dehors */}
                            <div
                                style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                                onClick={() => setMenuOpen(false)}
                            />
                            <div style={{
                                position: 'absolute', right: 0, top: 'calc(100% + 4px)',
                                background: 'white',
                                border: '1px solid rgba(0,0,0,0.1)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                zIndex: 10,
                                minWidth: '170px',
                                animation: 'scaleIn 0.15s var(--ease-spring)',
                            }}>
                                {/* Voir sur le site */}
                                {post.status === 'PUBLISHED' && (
                                    <a href={`/posts/${post.slug}`} target="_blank" rel="noopener noreferrer"
                                       style={menuItemStyle}
                                       onClick={() => setMenuOpen(false)}>
                                        <span>↗</span> Voir sur le site
                                    </a>
                                )}

                                {/* Changer de statut */}
                                {post.status !== 'PUBLISHED' && (
                                    <button style={menuItemStyle} onClick={() => { onChangeStatus(post.id, 'PUBLISHED'); setMenuOpen(false) }}>
                                        <span style={{ color: '#059669' }}>✓</span> Publier
                                    </button>
                                )}
                                {post.status === 'PUBLISHED' && (
                                    <button style={menuItemStyle} onClick={() => { onChangeStatus(post.id, 'DRAFT'); setMenuOpen(false) }}>
                                        <span style={{ color: '#D97706' }}>◎</span> Repasser en brouillon
                                    </button>
                                )}
                                {post.status !== 'ARCHIVED' && (
                                    <button style={menuItemStyle} onClick={() => { onChangeStatus(post.id, 'ARCHIVED'); setMenuOpen(false) }}>
                                        <span style={{ color: '#6B7280' }}>⊘</span> Archiver
                                    </button>
                                )}

                                {/* Séparateur */}
                                <div style={{ height: '1px', background: 'rgba(0,0,0,0.07)', margin: '4px 0' }} />

                                {/* Supprimer */}
                                <button
                                    style={{ ...menuItemStyle, color: '#DC2626' }}
                                    onClick={() => { onDelete(post.id, post.title); setMenuOpen(false) }}
                                    disabled={isDeleting}
                                >
                                    <span>⊗</span> {isDeleting ? 'Suppression...' : 'Supprimer'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const menuItemStyle: React.CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    gap:            '0.625rem',
    width:          '100%',
    padding:        '0.625rem 1rem',
    fontFamily:     'var(--font-body)',
    fontSize:       '0.8rem',
    color:          'var(--clr-noir)',
    background:     'none',
    border:         'none',
    cursor:         'pointer',
    textAlign:      'left',
    textDecoration: 'none',
    transition:     'background 0.1s',
}

const pagBtnStyle = (isPrimary: boolean): React.CSSProperties => ({
    padding:        '0.5rem 1rem',
    fontFamily:     'var(--font-body)',
    fontSize:       '0.775rem',
    textDecoration: 'none',
    background:     isPrimary ? 'var(--clr-bordeaux)' : 'white',
    color:          isPrimary ? 'white' : 'var(--clr-noir)',
    border:         `1px solid ${isPrimary ? 'var(--clr-bordeaux)' : 'rgba(0,0,0,0.1)'}`,
    transition:     'all 0.15s',
})