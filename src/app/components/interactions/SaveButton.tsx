'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface SaveButtonProps {
    postId: string
}

export function SaveButton({ postId }: SaveButtonProps) {
    const { token, isAuthenticated } = useAuth()
    const router = useRouter()
    const [saved,    setSaved]    = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Vérifier l'état initial
    useEffect(() => {
        if (!token) return
        fetch(`/api/posts/${postId}/save`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(d => { if (d.success) setSaved(d.saved) })
            .catch(() => {})
    }, [postId, token])

    async function handleToggle() {
        if (!isAuthenticated) {
            router.push('/login')
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch(`/api/posts/${postId}/save`, {
                method:  saved ? 'DELETE' : 'POST',
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await res.json()
            if (data.success) setSaved(data.saved)
        } catch {
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleToggle}
            disabled={isLoading}
            title={saved ? 'Retirer des favoris' : 'Sauvegarder'}
            style={{
                display:     'flex',
                alignItems:  'center',
                gap:         '0.5rem',
                padding:     '0.625rem 1.25rem',
                fontFamily:  'var(--font-body)',
                fontSize:    '0.75rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background:  saved ? 'var(--clr-bordeaux)' : 'transparent',
                color:       saved ? 'white' : 'var(--clr-gris)',
                border:      `1px solid ${saved ? 'var(--clr-bordeaux)' : 'rgba(0,0,0,0.15)'}`,
                cursor:      isLoading ? 'wait' : 'pointer',
                transition:  'all 0.2s',
                opacity:     isLoading ? 0.6 : 1,
            }}
        >
            <span style={{ fontSize: '1rem' }}>{saved ? '♥' : '♡'}</span>
            <span>{saved ? 'Sauvegardé' : 'Sauvegarder'}</span>
        </button>
    )
}