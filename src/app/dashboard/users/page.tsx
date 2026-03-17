'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/hooks/useAuth'

type RoleFilter = 'all' | 'VISITOR' | 'CONTRIBUTOR' | 'ADMIN'

interface User {
    id:          string
    username:    string
    displayName: string | null
    email:       string
    role:        'VISITOR' | 'CONTRIBUTOR' | 'ADMIN'
    isActive:    boolean
    avatarUrl:   string | null
    createdAt:   string
    _count:      { posts: number; comments: number }
}

const ROLE_LABELS: Record<string, string> = {
    VISITOR:     'Visiteur',
    CONTRIBUTOR: 'Contributeur',
    ADMIN:       'Admin',
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    VISITOR:     { bg: '#F3F4F6', color: '#6B7280' },
    CONTRIBUTOR: { bg: 'rgba(212,168,67,0.15)', color: '#92640A' },
    ADMIN:       { bg: 'rgba(139,26,74,0.12)', color: '#8B1A4A' },
}

export default function UsersPage() {
    const { token } = useAuth()
    const [users,      setUsers]      = useState<User[]>([])
    const [filter,     setFilter]     = useState<RoleFilter>('all')
    const [search,     setSearch]     = useState('')
    const [isLoading,  setIsLoading]  = useState(true)
    const [page,       setPage]       = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total,      setTotal]      = useState(0)

    const fetchUsers = useCallback(async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' })
            if (filter !== 'all') params.set('role', filter)
            if (search)           params.set('search', search)

            const res  = await fetch(`/api/users/admin?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setUsers(data.users)
                setTotalPages(data.pagination.totalPages)
                setTotal(data.pagination.total)
            }
        } finally {
            setIsLoading(false)
        }
    }, [token, filter, page, search])

    useEffect(() => { fetchUsers() }, [fetchUsers])
    useEffect(() => { setPage(1) },  [filter, search])

    async function updateUser(userId: string, data: { role?: string; isActive?: boolean }) {
        const res = await fetch('/api/users/admin', {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body:    JSON.stringify({ userId, ...data }),
        })
        const json = await res.json()
        if (json.success) await fetchUsers()
    }

    return (
        <div style={{ maxWidth: '1000px' }}>

            {/* En-tête */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--clr-noir)', marginBottom: '0.25rem' }}>
                    Utilisateurs
                </h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--clr-gris)' }}>
                    {total} membre{total > 1 ? 's' : ''} au total
                </p>
            </div>

            {/* Barre d'outils */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>

                {/* Filtres rôle */}
                <div style={{ display: 'flex', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {(['all', 'VISITOR', 'CONTRIBUTOR', 'ADMIN'] as RoleFilter[]).map(r => (
                        <button key={r} onClick={() => setFilter(r)}
                                style={{
                                    padding:     '0.5rem 1rem',
                                    fontFamily:  'var(--font-body)', fontSize: '0.75rem',
                                    background:  filter === r ? 'var(--clr-bordeaux)' : 'white',
                                    color:       filter === r ? 'white' : 'var(--clr-gris)',
                                    border:      'none', cursor: 'pointer',
                                    borderRight: '1px solid rgba(0,0,0,0.1)',
                                    transition:  'all 0.15s',
                                }}>
                            {r === 'all' ? 'Tous' : ROLE_LABELS[r]}
                        </button>
                    ))}
                </div>

                {/* Recherche */}
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Nom, email, username..."
                    style={{
                        padding:    '0.5rem 0.875rem',
                        fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                        border:     '1px solid rgba(0,0,0,0.1)', outline: 'none',
                        flex: 1,    minWidth: '180px',
                    }}
                />
            </div>

            {/* Liste */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--clr-gris)' }}>
                    Chargement...
                </div>
            ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'white', border: '1px dashed rgba(0,0,0,0.1)' }}>
                    <p style={{ fontFamily: 'var(--font-body)', color: 'var(--clr-gris)', fontSize: '0.875rem' }}>
                        Aucun utilisateur trouvé
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {users.map(u => (
                            <UserRow key={u.id} user={u} onUpdate={updateUser} />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)}
                                        style={{
                                            width: '36px', height: '36px',
                                            fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                                            background: p === page ? 'var(--clr-bordeaux)' : 'white',
                                            color:      p === page ? 'white' : 'var(--clr-noir)',
                                            border:     '1px solid rgba(0,0,0,0.1)',
                                            cursor:     'pointer', transition: 'all 0.15s',
                                        }}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

// ─────────────────────────────────────────
// SOUS-COMPOSANT — Ligne utilisateur
// ─────────────────────────────────────────

function UserRow({ user, onUpdate }: {
    user:     User
    onUpdate: (userId: string, data: { role?: string; isActive?: boolean }) => Promise<void>
}) {
    const roleStyle = ROLE_COLORS[user.role]

    return (
        <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '1rem',
            padding:      '1rem 1.25rem',
            background:   'white',
            border:       '1px solid rgba(0,0,0,0.06)',
            borderTop:    'none',
            transition:   'background 0.15s',
        }}>

            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username}
                         style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'var(--clr-bordeaux)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.1rem',
                    }}>
                        {(user.displayName ?? user.username)[0].toUpperCase()}
                    </div>
                )}
            </div>

            {/* Infos */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--clr-noir)' }}>
                        {user.displayName ?? user.username}
                    </span>
                    <span style={{
                        fontFamily: 'var(--font-body)', fontSize: '0.6rem',
                        padding: '0.15rem 0.5rem', borderRadius: '999px',
                        background: roleStyle.bg, color: roleStyle.color,
                        fontWeight: 500, letterSpacing: '0.05em',
                    }}>
                        {ROLE_LABELS[user.role]}
                    </span>
                    {!user.isActive && (
                        <span style={{
                            fontFamily: 'var(--font-body)', fontSize: '0.6rem',
                            padding: '0.15rem 0.5rem', borderRadius: '999px',
                            background: '#FEE2E2', color: '#DC2626',
                        }}>
                            Suspendu
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--clr-gris)' }}>
                        @{user.username}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--clr-gris)' }}>
                        {user.email}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--clr-gris)' }}>
                        {user._count.posts} post{user._count.posts > 1 ? 's' : ''} · {user._count.comments} commentaire{user._count.comments > 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>

                {/* Changer le rôle */}
                <select
                    value={user.role}
                    onChange={e => onUpdate(user.id, { role: e.target.value })}
                    style={{
                        padding:    '0.35rem 0.5rem',
                        fontFamily: 'var(--font-body)', fontSize: '0.72rem',
                        border:     '1px solid rgba(0,0,0,0.1)',
                        background: 'white', cursor: 'pointer', outline: 'none',
                        color:      'var(--clr-noir)',
                    }}>
                    <option value="VISITOR">Visiteur</option>
                    <option value="CONTRIBUTOR">Contributeur</option>
                    <option value="ADMIN">Admin</option>
                </select>

                {/* Suspendre / Réactiver */}
                <button
                    onClick={() => onUpdate(user.id, { isActive: !user.isActive })}
                    style={{
                        padding:    '0.35rem 0.75rem',
                        fontFamily: 'var(--font-body)', fontSize: '0.72rem',
                        border:     '1px solid rgba(0,0,0,0.1)',
                        background: user.isActive ? 'white' : '#059669',
                        color:      user.isActive ? '#DC2626' : 'white',
                        cursor:     'pointer', transition: 'all 0.15s',
                    }}>
                    {user.isActive ? 'Suspendre' : 'Réactiver'}
                </button>
            </div>
        </div>
    )
}