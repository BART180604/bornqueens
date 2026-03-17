# BornQueens — Étape 8 : Dashboard Admin

## Fichiers créés

```
src/
├── app/dashboard/
│   ├── layout.tsx              ← Sidebar + topbar + protection admin
│   ├── page.tsx                ← Vue d'ensemble (Server Component)
│   ├── posts/
│   │   ├── page.tsx            ← Liste des publications (à créer)
│   │   ├── new/page.tsx        ← Nouvelle publication (wraps PostForm)
│   │   └── [id]/edit/page.tsx  ← Édition (wraps PostForm)
│   └── comments/
│       └── page.tsx            ← Modération commentaires
│
└── components/dashboard/
    └── PostForm.tsx            ← Formulaire création/édition complet
```

---

## Architecture du Dashboard

```
DashboardLayout (Client Component)
    │
    ├── Vérifie isAdmin via useAuth()
    │   └── Si non admin → redirect '/'
    │
    ├── SIDEBAR (fixe 260px)
    │   ├── Logo + label "Administration"
    │   ├── Nav items avec active state
    │   └── Profil admin + déconnexion
    │
    └── MAIN (flex-1, marginLeft 260px)
        ├── TOPBAR sticky
        │   ├── Breadcrumb auto-généré
        │   └── Date du jour
        └── CONTENT (children)
```

---

## Vue d'ensemble — Données chargées

La page dashboard charge **10 requêtes Prisma en parallèle** via `Promise.all` :

```typescript
const [
  totalPosts,           // count total
  publishedPosts,       // count publiés
  draftPosts,           // count brouillons
  totalComments,        // count commentaires actifs
  pendingComments,      // count en attente de modération
  totalUsers,           // count utilisateurs
  totalLikes,           // count likes totaux
  recentPosts,          // 5 dernières publications
  pendingCommentsList,  // 5 premiers commentaires à modérer
  topPosts,             // 3 publications les plus likées
] = await Promise.all([...])
```

**Pourquoi `Promise.all` et pas des `await` séquentiels ?**
10 requêtes séquentielles = 10 × ~20ms = ~200ms minimum.
En parallèle = ~20ms (le temps de la requête la plus lente).
C'est la même logique que vous avez déjà appliquée dans les API routes.

---

## PostForm — États et flux

```
ÉTAT INITIAL
  form = { title:'', content:'', photos:[], ... }
       │
       ▼
INTERACTIONS UTILISATEUR
  setField(key, value) ← met à jour form + efface l'erreur du champ
       │
       ▼
UPLOAD PHOTOS
  ImageUploader → onUploadComplete → setField('photos', [...existant, ...nouveaux])
       │
       ▼
SAUVEGARDE AUTO (si isEditing)
  onBlur du titre → autoSave() → PUT silencieux → indicateur "✓ Sauvegardé"
       │
       ▼
SOUMISSION FINALE
  validate() → si ok → submitForm() → redirect /dashboard/posts
```

### Validation côté client

```typescript
function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.title.trim())   e.title   = 'Le titre est requis'
  if (!form.content.trim()) e.content = 'Le contenu est requis'
  if (!form.photos.length)  e.photos  = 'Au moins une photo est requise'
  setErrors(e)
  return Object.keys(e).length === 0
}
```

La validation client est rapide mais pas suffisante — le back-end valide aussi.
Les deux couches sont complémentaires, pas redondantes.

---

## Interface de modération — 3 modes d'action

### Action individuelle
Chaque commentaire a ses propres boutons ✓ / ✗ / ⊗

### Action en masse (bulk)
- Cocher des commentaires → boutons "Approuver / Rejeter / Supprimer" apparaissent
- `Promise.all` pour traiter tous les ids sélectionnés simultanément
- Rafraîchissement automatique après l'action

### Filtres
```
[En attente] [Approuvés] [Tous]  +  [Recherche texte]
```
Chaque changement de filtre remet la page à 1 et vide la sélection.

---

## Route API manquante à créer

La page commentaires appelle `GET /api/comments/admin` qui n'existe pas encore.
À créer dans `src/app/api/comments/admin/route.ts` :

```typescript
export async function GET(request: NextRequest) {
  const user = getCurrentUser(request)
  if (!user || !isAdmin(user)) return 403...

  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') // 'pending' | 'approved' | 'all'
  const search = searchParams.get('search')
  const page   = parseInt(searchParams.get('page') || '1')
  const limit  = 20

  const where = {
    isDeleted: false,
    ...(filter === 'pending'  && { isApproved: false }),
    ...(filter === 'approved' && { isApproved: true }),
    ...(search && { content: { contains: search, mode: 'insensitive' } }),
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({ where, skip: (page-1)*limit, take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id, username, displayName } },
        post:   { select: { id, title, slug } }
      }
    }),
    prisma.comment.count({ where })
  ])

  return NextResponse.json({
    success: true, comments,
    pagination: { page, limit, total, totalPages: Math.ceil(total/limit) }
  })
}
```

---

## Pages à créer (simples wrappers)

```tsx
// src/app/dashboard/posts/new/page.tsx
import PostForm from '@/components/dashboard/PostForm'
export default function NewPostPage() {
  return <PostForm />
}

// src/app/dashboard/posts/[id]/edit/page.tsx
import PostForm from '@/components/dashboard/PostForm'
export default async function EditPostPage({ params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: { photos: true, categories: true, tags: true }
  })
  if (!post) notFound()
  return <PostForm post={post} />
}
```

---

## Récapitulatif complet — 9 étapes BornQueens

| Étape | Module          | Statut |
|-------|-----------------|--------|
| 1     | Architecture    | ✅ |
| 2     | Base de données | ✅ |
| 3     | Auth JWT        | ✅ |
| 4     | Upload photos   | ✅ |
| 5     | CRUD Posts      | ✅ |
| 6     | Commentaires    | ✅ |
| 7     | Front-end       | ✅ |
| 8     | Dashboard Admin | ✅ |
| 9     | Déploiement VPS | 🔜 |

---

## Prochaine et dernière étape : Déploiement VPS (Étape 9)

On va couvrir :
- Configuration du serveur (Ubuntu, Nginx, PM2)
- Variables d'environnement de production
- Build Next.js et démarrage avec PM2
- Configuration SSL avec Certbot (HTTPS gratuit)
- Backup automatique de la base de données
- Checklist de mise en ligne