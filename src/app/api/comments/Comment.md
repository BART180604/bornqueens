# BornQueens — Étape 6 : Commentaires

## Fichiers créés

```
src/
├── app/api/
│   ├── posts/[id]/comments/route.ts    ← GET (liste) + POST (créer)
│   ├── comments/[id]/route.ts          ← PUT (modifier) + DELETE (soft)
│   └── comments/[id]/approve/route.ts  ← PATCH (modération admin)
│
└── components/interactions/
    └── CommentList.tsx                 ← Liste + formulaire + réponses imbriquées
```

---

## Architecture du système de commentaires

```
Publication
    │
    ├── Commentaire A  (racine, parentId: null)
    │       ├── Réponse A1  (parentId: A)
    │       └── Réponse A2  (parentId: A)
    │
    ├── Commentaire B  (racine)
    │       └── Réponse B1
    │
    └── Commentaire C  (racine, sans réponses)
```

**1 seul niveau d'imbrication** — on n'autorise pas les réponses à des réponses.
C'est une décision UX délibérée : au-delà, les fils deviennent illisibles.

---

## Flux de modération

```
Utilisateur poste un commentaire
          │
          ├─ Rôle ADMIN ? ──→ isApproved: true  → visible immédiatement
          │
          └─ Rôle VISITOR/CONTRIBUTOR
                    │
                    ▼
              isApproved: false  (en attente)
                    │
              Notification admin (à implémenter)
                    │
          Admin → PATCH /api/comments/[id]/approve
                    │
          ├── { approved: true }  → visible pour tous
          └── { approved: false } → rejeté, reste masqué
```

---

## Soft Delete — Pourquoi ça marche ainsi

Quand un commentaire est supprimé :
```typescript
// On ne DELETE pas la ligne en base
// On la masque et on remplace le contenu
await prisma.comment.update({
  where: { id },
  data:  { isDeleted: true, content: '[Commentaire supprimé]' }
})
```

**Pourquoi ?** Si le commentaire A a des réponses A1, A2, A3, et qu'on
supprime vraiment A, les réponses perdent leur `parentId` → erreur de
contrainte de clé étrangère. Le soft delete préserve la structure du fil.

---

## Utilisation dans une page de détail

```tsx
// src/app/(site)/posts/[id]/page.tsx
import CommentList from '@/components/interactions/CommentList'

export default async function PostPage({ params }: { params: { slug: string } }) {
  // Fetch côté serveur (SSR)
  const res  = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/posts/${params.slug}`)
  const data = await res.json()
  const post = data.post

  return (
    <article>
      {/* ... contenu de la publication ... */}

      <CommentList
        postId={post.id}
        comments={post.comments}
        total={post.commentsCount}
        onCommentAdded={(comment) => {
          // Optionnel : mettre à jour le compteur dans le titre
          console.log('Nouveau commentaire :', comment)
        }}
      />
    </article>
  )
}
```

---

## File de modération dans le dashboard

```tsx
// src/app/dashboard/comments/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function ModerationPage() {
  const { token } = useAuth()
  const [comments, setComments] = useState([])

  useEffect(() => {
    fetch('/api/comments/pending', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => setComments(d.comments))
  }, [token])

  async function handleApprove(id: string, approved: boolean) {
    await fetch(`/api/comments/${id}/approve`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ approved }),
    })
    setComments(prev => prev.filter((c: any) => c.id !== id))
  }

  return (
    <div>
      <h1>Modération — {comments.length} en attente</h1>
      {comments.map((c: any) => (
        <div key={c.id} className="border rounded-lg p-4 mb-3">
          <p className="text-sm text-gray-500">
            {c.author.displayName} sur <strong>{c.post.title}</strong>
          </p>
          <p className="mt-2">{c.content}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleApprove(c.id, true)}
              className="px-3 py-1 bg-green-500 text-white text-sm rounded-full"
            >
              ✅ Approuver
            </button>
            <button
              onClick={() => handleApprove(c.id, false)}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded-full"
            >
              ❌ Rejeter
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## Récapitulatif des routes commentaires

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/posts/[id]/comments` | Public | Lister les commentaires approuvés |
| POST | `/api/posts/[id]/comments` | Connecté | Poster un commentaire |
| PUT | `/api/comments/[id]` | Auteur | Modifier son commentaire |
| DELETE | `/api/comments/[id]` | Auteur / Admin | Soft delete |
| PATCH | `/api/comments/[id]/approve` | Admin | Approuver / rejeter |
| GET | `/api/comments/pending` | Admin | File de modération |

---

## Prochaine étape : Front-end (Étape 7)

On va construire :
- Page d'accueil — grille immersive de publications
- Page de détail — galerie lightbox + récit + interactions
- Composant `LikeButton` avec animation
- Composant `ShareButtons` pour le partage social
- Navigation et layout global