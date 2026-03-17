'use client'
// src/app/dashboard/comments/page.tsx
// Interface de modération des commentaires

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/hooks/useAuth'

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

type FilterType = 'pending' | 'approved' | 'all'

export interface Comment {
  id:         string
  content:    string
  isApproved: boolean
  isDeleted:  boolean
  createdAt:  string
  author: { id: string; username: string; displayName: string | null }
  post:   { id: string; title: string; slug: string }
}

// ─────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────

export default function CommentsPage() {
  const { token }  = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [filter,   setFilter]   = useState<FilterType>('pending')
  const [isLoading, setIsLoading] = useState(true)
  const [selected,  setSelected]  = useState<Set<string>>(new Set())
  const [page,      setPage]      = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search,    setSearch]    = useState('')

  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (filter !== 'all') params.set('filter', filter)
      if (search)           params.set('search', search)

      const res  = await fetch(`/api/comments/admin?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setComments(data.comments)
        setTotalPages(data.pagination.totalPages)
      }
    } finally {
      setIsLoading(false)
    }
  }, [token, filter, page, search])

  useEffect(() => { fetchComments() }, [fetchComments])

  // ── Réinitialiser la page quand le filtre change ──
  useEffect(() => { setPage(1); setSelected(new Set()) }, [filter, search])

  // ── Approuver / Rejeter un commentaire ──
  async function moderate(id: string, approved: boolean) {
    await fetch(`/api/comments/${id}/approve`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ approved }),
    })
    // Recharger depuis l'API
    await fetchComments()
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  async function deleteComment(id: string) {
    if (!confirm('Supprimer définitivement ce commentaire ?')) return
    await fetch(`/api/comments/${id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    await fetchComments()
  }

  // ── Actions en masse ──
  async function bulkAction(action: 'approve' | 'reject' | 'delete') {
    const ids = Array.from(selected)
    if (!ids.length) return

    const confirmMsg = action === 'delete'
      ? `Supprimer ${ids.length} commentaire(s) ?`
      : `${action === 'approve' ? 'Approuver' : 'Rejeter'} ${ids.length} commentaire(s) ?`
    if (!confirm(confirmMsg)) return

    await Promise.all(ids.map(id => {
      if (action === 'delete') return deleteComment(id)
      return moderate(id, action === 'approve')
    }))
    setSelected(new Set())
    fetchComments()
  }

  // ── Toggle sélection ──
  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function toggleSelectAll() {
    if (selected.size === comments.length) setSelected(new Set())
    else setSelected(new Set(comments.map(c => c.id)))
  }

  function timeAgo(dateStr: string): string {
    const diff  = Date.now() - new Date(dateStr).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins  < 1)  return 'À l\'instant'
    if (mins  < 60) return `${mins} min`
    if (hours < 24) return `${hours}h`
    return `${days}j`
  }

  const pendingCount = comments.filter(c => !c.isApproved).length

  return (
    <div style={{ maxWidth: '1000px' }}>

      {/* En-tête */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--clr-noir)', marginBottom: '0.25rem' }}>
          Commentaires
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--clr-gris)' }}>
          Modération et gestion des commentaires
        </p>
      </div>

      {/* Alerte commentaires en attente */}
      {filter !== 'pending' && pendingCount > 0 && (
        <div style={{
          padding: '0.875rem 1.25rem',
          background: '#FEF3C7', border: '1px solid #FDE68A',
          marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.825rem', color: '#92400E' }}>
            ⚠ {pendingCount} commentaire(s) en attente de modération
          </span>
          <button onClick={() => setFilter('pending')}
            style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#B45309', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Voir maintenant
          </button>
        </div>
      )}

      {/* Barre d'outils */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>

        {/* Filtres */}
        <div style={{ display: 'flex', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {([
            { value: 'pending',  label: 'En attente' },
            { value: 'approved', label: 'Approuvés' },
            { value: 'all',      label: 'Tous' },
          ] as { value: FilterType; label: string }[]).map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              style={{
                padding: '0.5rem 1rem',
                fontFamily: 'var(--font-body)', fontSize: '0.75rem',
                background: filter === f.value ? 'var(--clr-bordeaux)' : 'white',
                color:      filter === f.value ? 'white' : 'var(--clr-gris)',
                border: 'none', cursor: 'pointer',
                borderRight: '1px solid rgba(0,0,0,0.1)',
                transition: 'all 0.15s',
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Recherche */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          style={{
            padding: '0.5rem 0.875rem',
            fontFamily: 'var(--font-body)', fontSize: '0.8rem',
            border: '1px solid rgba(0,0,0,0.1)', outline: 'none',
            flex: 1, minWidth: '180px',
          }}
        />

        {/* Actions en masse */}
        {selected.size > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--clr-gris)' }}>
              {selected.size} sélectionné(s)
            </span>
            <button onClick={() => bulkAction('approve')} style={{ ...bulkBtnStyle, background: '#059669', color: 'white' }}>✓ Approuver</button>
            <button onClick={() => bulkAction('reject')}  style={{ ...bulkBtnStyle, background: '#D97706', color: 'white' }}>✗ Rejeter</button>
            <button onClick={() => bulkAction('delete')}  style={{ ...bulkBtnStyle, background: '#DC2626', color: 'white' }}>⊗ Supprimer</button>
          </div>
        )}
      </div>

      {/* Liste des commentaires */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--clr-gris)' }}>
          Chargement...
        </div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'white', border: '1px dashed rgba(0,0,0,0.1)' }}>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--clr-gris)', fontSize: '0.875rem' }}>
            {filter === 'pending' ? '✓ Aucun commentaire en attente' : 'Aucun commentaire trouvé'}
          </p>
        </div>
      ) : (
        <>
          {/* Sélectionner tout */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.5rem 1rem',
            background: 'white', borderBottom: '1px solid rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <input type="checkbox"
              checked={selected.size === comments.length && comments.length > 0}
              onChange={toggleSelectAll}
              style={{ accentColor: 'var(--clr-bordeaux)', width: '14px', height: '14px' }}
            />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--clr-gris)' }}>
              Sélectionner tout ({comments.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {comments.map(comment => (
              <CommentRow
                key={comment.id}
                comment={comment}
                isSelected={selected.has(comment.id)}
                onSelect={() => toggleSelect(comment.id)}
                onApprove={() => moderate(comment.id, true)}
                onReject={()  => moderate(comment.id, false)}
                onDelete={() => deleteComment(comment.id)}
                timeAgo={timeAgo(comment.createdAt)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{
                    width: '36px', height: '36px',
                    fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                    background: p === page ? 'var(--clr-bordeaux)' : 'white',
                    color:      p === page ? 'white' : 'var(--clr-noir)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    cursor: 'pointer', transition: 'all 0.15s',
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
// SOUS-COMPOSANT — Ligne de commentaire
// ─────────────────────────────────────────

function CommentRow({ comment, isSelected, onSelect, onApprove, onReject, onDelete, timeAgo }: {
  comment:    Comment
  isSelected: boolean
  onSelect:   () => void
  onApprove:  () => void
  onReject:   () => void
  onDelete:   () => void
  timeAgo:    string
}) {
  const [expanded, setExpanded] = useState(false)
  const isLong = comment.content.length > 180

  return (
    <div style={{
      display: 'flex', gap: '0.875rem',
      padding: '1rem 1rem',
      background: isSelected ? 'rgba(139,26,74,0.03)' : 'white',
      border: '1px solid rgba(0,0,0,0.06)',
      borderTop: 'none',
      transition: 'background 0.15s',
    }}>
      {/* Checkbox */}
      <div style={{ paddingTop: '2px', flexShrink: 0 }}>
        <input type="checkbox" checked={isSelected} onChange={onSelect}
          style={{ accentColor: 'var(--clr-bordeaux)', width: '14px', height: '14px' }} />
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--clr-noir)' }}>
            {comment.author.displayName || comment.author.username}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--clr-gris)' }}>
            sur
          </span>
          <a href={`/posts/${comment.post.slug}`} target="_blank" rel="noreferrer"
            style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--clr-bordeaux)', textDecoration: 'none' }}>
            {comment.post.title.length > 40 ? comment.post.title.substring(0, 40) + '…' : comment.post.title}
          </a>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'rgba(0,0,0,0.3)', marginLeft: 'auto' }}>
            {timeAgo}
          </span>
        </div>

        {/* Contenu du commentaire */}
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '0.825rem',
          color: 'var(--clr-gris)', lineHeight: 1.6,
        }}>
          {isLong && !expanded ? comment.content.substring(0, 180) + '…' : comment.content}
          {isLong && (
            <button onClick={() => setExpanded(!expanded)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-bordeaux)', fontSize: '0.75rem', marginLeft: '4px' }}>
              {expanded ? 'Moins' : 'Plus'}
            </button>
          )}
        </p>

        {/* Statut */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.625rem' }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: '0.6rem',
            padding: '0.15rem 0.5rem', borderRadius: '999px',
            background: comment.isApproved ? '#D1FAE5' : '#FEF3C7',
            color:      comment.isApproved ? '#065F46' : '#92400E',
          }}>
            {comment.isApproved ? '✓ Approuvé' : '⏳ En attente'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
        {!comment.isApproved && (
          <button onClick={onApprove}
            style={{ ...actionBtnStyle, background: '#059669', color: 'white' }}>
            ✓
          </button>
        )}
        {comment.isApproved && (
          <button onClick={onReject}
            style={{ ...actionBtnStyle, background: '#D97706', color: 'white' }}>
            ✗
          </button>
        )}
        <button onClick={onDelete}
          style={{ ...actionBtnStyle, background: 'white', color: '#DC2626', border: '1px solid #FCA5A5' }}>
          ⊗
        </button>
      </div>
    </div>
  )
}

// Styles partagés
const actionBtnStyle: React.CSSProperties = {
  width: '32px', height: '32px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: 'none', cursor: 'pointer', fontSize: '0.85rem',
  transition: 'all 0.15s', borderRadius: 0,
}

const bulkBtnStyle: React.CSSProperties = {
  padding: '0.4rem 0.875rem',
  fontFamily: 'var(--font-body)', fontSize: '0.72rem',
  border: 'none', cursor: 'pointer',
  transition: 'opacity 0.15s',
  letterSpacing: '0.03em',
}