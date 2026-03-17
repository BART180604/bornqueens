'use client'
// src/components/interactions/CommentsSection.tsx
// Wrapper Client Component pour la section commentaires.
//
// Pourquoi ce fichier existe :
// PostDetailPage est un Server Component — il ne peut pas passer
// des fonctions (event handlers) en props à des Client Components.
// Ce wrapper reçoit les commentaires initiaux comme données sérialisables,
// gère l'état local, et possède la fonction onCommentAdded.

import { useState }  from 'react'
import CommentList   from '@/app/components/interactions/CommentList'

// ─────────────────────────────────────────
// TYPES — identiques à CommentList.tsx
// ─────────────────────────────────────────

interface CommentAuthor {
    id:          string
    username:    string
    displayName: string | null
    avatarUrl:      string | null
}

interface Comment {
    id:        string
    content:   string
    isDeleted: boolean
    createdAt: string
    updatedAt: string
    author:    CommentAuthor
    replies:   Comment[]
    _count?:   { replies: number }
}

interface CommentsSectionProps {
    postId:          string
    initialComments: Comment[]
    initialTotal:    number
}

// ─────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────

export default function CommentsSection({
                                            postId,
                                            initialComments,
                                            initialTotal,
                                        }: CommentsSectionProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [total,    setTotal]    = useState(initialTotal)

    function handleCommentAdded(newComment: Comment) {
        setComments(prev => [newComment, ...prev])
        setTotal(prev => prev + 1)
    }

    return (
        <CommentList
            postId={postId}
            comments={comments}
            total={total}
            onCommentAdded={handleCommentAdded}
        />
    )
}