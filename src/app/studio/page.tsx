'use client'

import { useEffect, useState } from 'react'
import { useAuth }             from '@/app/hooks/useAuth'
import Link                    from 'next/link'

interface Stats {
    totalPosts:     number
    publishedPosts: number
    draftPosts:     number
    totalLikes:     number
    totalComments:  number
}

export default function StudioPage() {
    const { token, user } = useAuth()
    const [stats, setStats] = useState<Stats | null>(null)

    useEffect(() => {
        if (!token) return
        fetch('/api/studio/stats', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(d => { if (d.success) setStats(d.stats) })
            .catch(() => {})
    }, [token])

    return (
        <div style={{ maxWidth: '900px' }}>
    <div style={{ marginBottom: '2.5rem' }}>
    <h1 style={{
        fontFamily: 'var(--font-display)',
            fontSize:   '2rem',
            fontWeight: 600,
            color:      'var(--clr-noir)',
            marginBottom: '0.25rem',
    }}>
    Bonjour, {user?.displayName || user?.username} ✦
                </h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--clr-gris)' }}>
    Votre espace de création BornQueens
    </p>
    </div>

    {/* Stats */}
    <div style={{
        display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap:                 '1.5rem',
            marginBottom:        '3rem',
    }}>
    {[
        { label: 'Publications',  value: stats?.totalPosts     ?? '—', color: 'var(--clr-bordeaux)' },
        { label: 'Publiées',      value: stats?.publishedPosts ?? '—', color: '#059669' },
        { label: 'Brouillons',    value: stats?.draftPosts     ?? '—', color: '#D97706' },
        { label: 'Likes reçus',   value: stats?.totalLikes     ?? '—', color: 'var(--clr-or)' },
        { label: 'Commentaires',  value: stats?.totalComments  ?? '—', color: 'var(--clr-gris)' },
    ].map(s => (
        <div key={s.label} style={{
        background: 'white',
            padding:    '1.5rem',
            boxShadow:  '0 1px 4px rgba(0,0,0,0.06)',
    }}>
        <p style={{
        fontFamily: 'var(--font-display)',
            fontSize:   '2.5rem',
            fontWeight: 700,
            color:      s.color,
            lineHeight: 1,
            marginBottom: '0.5rem',
    }}>
        {s.value}
        </p>
        <p style={{
        fontFamily:    'var(--font-body)',
            fontSize:      '0.7rem',
            color:         'var(--clr-gris)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
    }}>
        {s.label}
        </p>
        </div>
    ))}
    </div>

    {/* Actions rapides */}
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
    <Link href="/studio/posts/new" className="btn-primary" style={{ textDecoration: 'none' }}>
    <span>+ Nouvelle publication</span>
    </Link>
    <Link href="/studio/posts" className="btn-outline" style={{ textDecoration: 'none' }}>
    <span>Mes publications</span>
    </Link>
    </div>
    </div>
)
}