'use client'
// src/components/interactions/CommentList.tsx
// Affichage des commentaires avec réponses imbriquées

import { useState } from 'react'
import { useAuth } from '@/app/hooks/useAuth'

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface CommentAuthor {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
}

interface Comment {
  id: string
  content: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  author: CommentAuthor
  replies: Comment[]
  _count?: { replies: number }
}

interface CommentListProps {
  postId:   string
  comments: Comment[]
  total:    number
  onCommentAdded: (comment: Comment) => void
}

// ─────────────────────────────────────────
// SOUS-COMPOSANT — Un commentaire individuel
// ─────────────────────────────────────────

function CommentItem({
  comment,
  postId,
  depth = 0,
  onReplyAdded,
}: {
  comment:      Comment
  postId:       string
  depth?:       number
  onReplyAdded: (reply: Comment, parentId: string) => void
}) {
  const { user, token, isAuthenticated } = useAuth()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isEditing,     setIsEditing]     = useState(false)
  const [editContent,   setEditContent]   = useState(comment.content)
  const [isSubmitting,  setIsSubmitting]  = useState(false)
  const [localContent,  setLocalContent]  = useState(comment.content)

  const isAuthor = user?.id === comment.author.id
  const isAdmin  = user?.role === 'ADMIN'
  const canEdit  = isAuthor && !comment.isDeleted
  const canDelete = (isAuthor || isAdmin) && !comment.isDeleted

  // Format date relative simple
  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins  < 1)  return 'À l\'instant'
    if (mins  < 60) return `Il y a ${mins} min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days  < 30) return `Il y a ${days}j`
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  // ── Modifier un commentaire ──
  async function handleEdit() {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false)
      return
    }
    setIsSubmitting(true)
    try {
      const res  = await fetch(`/api/comments/${comment.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ content: editContent }),
      })
      const data = await res.json()
      if (data.success) {
        setLocalContent(editContent)
        setIsEditing(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Supprimer un commentaire ──
  async function handleDelete() {
    if (!confirm('Supprimer ce commentaire ?')) return
    await fetch(`/api/comments/${comment.id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setLocalContent('[Commentaire supprimé]')
  }

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-10 mt-3' : 'mt-5'}`}>

      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.author.avatarUrl ? (
          <img
            src={comment.author.avatarUrl}
            alt={comment.author.username}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#8B1A4A] flex items-center justify-center text-white text-sm font-bold">
            {(comment.author.displayName || comment.author.username)[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Corps du commentaire */}
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-2xl px-4 py-3">

          {/* En-tête */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900">
              {comment.author.displayName || comment.author.username}
            </span>
            <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-gray-400 italic">(modifié)</span>
            )}
          </div>

          {/* Contenu */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none
                           focus:outline-none focus:border-[#8B1A4A]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  disabled={isSubmitting}
                  className="text-xs px-3 py-1 bg-[#8B1A4A] text-white rounded-full
                             hover:bg-[#6d1439] disabled:opacity-50"
                >
                  {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button
                  onClick={() => { setIsEditing(false); setEditContent(comment.content) }}
                  className="text-xs px-3 py-1 text-gray-500 hover:text-gray-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <p className={`text-sm text-gray-700 ${comment.isDeleted ? 'italic text-gray-400' : ''}`}>
              {localContent}
            </p>
          )}
        </div>

        {/* Actions */}
        {!comment.isDeleted && !isEditing && (
          <div className="flex items-center gap-3 mt-1 ml-2">
            {isAuthenticated && depth === 0 && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-gray-500 hover:text-[#8B1A4A] font-medium transition-colors"
              >
                Répondre
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Modifier
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Supprimer
              </button>
            )}
          </div>
        )}

        {/* Formulaire de réponse */}
        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              placeholder={`Répondre à ${comment.author.displayName || comment.author.username}...`}
              onSuccess={(reply) => {
                onReplyAdded(reply, comment.id)
                setShowReplyForm(false)
              }}
              compact
            />
          </div>
        )}

        {/* Réponses imbriquées */}
        {comment.replies?.map(reply => (
          <CommentItem
            key={reply.id}
            comment={reply}
            postId={postId}
            depth={depth + 1}
            onReplyAdded={onReplyAdded}
          />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// COMPOSANT PRINCIPAL — Liste complète
// ─────────────────────────────────────────

export default function CommentList({ postId, comments: initialComments, total, onCommentAdded }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)

  // Ajouter un commentaire racine
  function handleNewComment(comment: Comment) {
    setComments(prev => [comment, ...prev])
    onCommentAdded(comment)
  }

  // Ajouter une réponse à un commentaire existant
  function handleReplyAdded(reply: Comment, parentId: string) {
    setComments(prev => prev.map(c =>
      c.id === parentId
        ? { ...c, replies: [...(c.replies || []), reply] }
        : c
    ))
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {total} commentaire{total > 1 ? 's' : ''}
      </h2>

      {/* Formulaire principal */}
      <CommentForm
        postId={postId}
        onSuccess={handleNewComment}
        placeholder="Partagez votre ressenti sur cette publication..."
      />

      {/* Liste */}
      <div className="mt-8 divide-y divide-gray-100">
        {comments.length === 0 ? (
          <p className="text-gray-400 text-sm py-6 text-center">
            Soyez le premier à commenter ✨
          </p>
        ) : (
          comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onReplyAdded={handleReplyAdded}
            />
          ))
        )}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────
// COMPOSANT — Formulaire de commentaire
// Exporté séparément pour être réutilisé
// ─────────────────────────────────────────

interface CommentFormProps {
  postId:      string
  parentId?:   string
  placeholder?: string
  onSuccess:   (comment: Comment) => void
  compact?:    boolean
}

export function CommentForm({ postId, parentId, placeholder, onSuccess, compact = false }: CommentFormProps) {
  const { user, token, isAuthenticated } = useAuth()
  const [content,     setContent]     = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message,     setMessage]     = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null)

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 rounded-2xl p-4 text-center">
        <p className="text-sm text-gray-500">
          <a href="/login" className="text-[#8B1A4A] font-medium hover:underline">
            Connectez-vous
          </a>{' '}
          pour laisser un commentaire
        </p>
      </div>
    )
  }

  async function handleSubmit() {
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ content: content.trim(), parentId }),
      })
      const data = await res.json()

      if (data.success) {
        setContent('')
        if (data.pending) {
          setMessage({ text: '⏳ Commentaire soumis — visible après modération', type: 'info' })
        } else {
          onSuccess(data.comment)
        }
      } else {
        setMessage({ text: data.message, type: 'error' })
      }
    } catch {
      setMessage({ text: 'Erreur réseau', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`flex gap-3 ${compact ? '' : ''}`}>
      {/* Avatar */}
      {!compact && (
        <div className="flex-shrink-0">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#8B1A4A] flex items-center justify-center text-white text-sm font-bold">
              {(user?.displayName ||  '?')[0].toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 space-y-2">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit() }}
          placeholder={placeholder || 'Écrire un commentaire...'}
          rows={compact ? 2 : 3}
          maxLength={2000}
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none
                     focus:outline-none focus:border-[#8B1A4A] focus:ring-1 focus:ring-[#8B1A4A]
                     placeholder:text-gray-400 transition-colors"
        />

        {/* Compteur + bouton */}
        <div className="flex items-center justify-between">
          <span className={`text-xs ${content.length > 1800 ? 'text-orange-500' : 'text-gray-400'}`}>
            {content.length}/2000
          </span>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="px-4 py-1.5 bg-[#8B1A4A] text-white text-sm rounded-full font-medium
                       hover:bg-[#6d1439] disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors"
          >
            {isSubmitting ? 'Envoi...' : 'Publier'}
          </button>
        </div>

        {/* Message de retour */}
        {message && (
          <p className={`text-xs px-3 py-2 rounded-lg ${
            message.type === 'error' ? 'bg-red-50 text-red-600' :
            message.type === 'info'  ? 'bg-amber-50 text-amber-700' :
            'bg-green-50 text-green-700'
          }`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}