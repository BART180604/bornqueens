# BornQueens — Étape 4 : Upload & Traitement des Photos

## Fichiers créés

```
src/
├── lib/
│   └── upload.ts                       ← Logique Sharp, validation, compression
│
├── app/api/
│   └── upload/route.ts                 ← POST /api/upload
│
└── components/dashboard/
    └── ImageUploader.tsx               ← Composant React drag & drop

next.config.ts                          ← Config images Next.js
```

---

## Ce qui se passe lors d'un upload

```
[Client]  Sélectionne 5 photos (JPEG, PNG...)
              │
              ▼
[Composant]  Validation locale (type, taille)
             Génération des previews (URL.createObjectURL)
              │
              ▼
[API]  POST /api/upload
       FormData { type: 'post', files: [...] }
              │
              ▼
[Sharp]  Pour chaque photo :
         ┌─────────────────────────────────────────┐
         │  1. Rotation EXIF automatique            │
         │  2. Resize → max 1920×1080 (inside)      │
         │     → converti en WebP (qualité 85)      │
         │     → sauvé dans /uploads/posts/         │
         │                                          │
         │  3. Resize → 600×600 (cover, centré)     │
         │     → converti en WebP (qualité 80)      │
         │     → sauvé dans /uploads/posts/thumbs/  │
         └─────────────────────────────────────────┘
              │
              ▼
[API]  Retourne { path, thumbPath, width, height, size }
              │
              ▼
[Client]  Affiche les photos uploadées ✅
          Passe les résultats au parent via onUploadComplete()
```

---

## Structure des dossiers créés automatiquement

```
public/
└── uploads/
    ├── posts/
    │   ├── fulani-braids-1703123456-abc123.webp    ← Image pleine résolution
    │   └── thumbs/
    │       └── fulani-braids-1703123456-abc123.webp ← Miniature 600×600
    └── avatars/
        └── reine-1703123456-def456.webp             ← Avatar 200×200
```

---

## Gains de compression typiques

| Format original | Taille originale | Après Sharp WebP | Gain |
|----------------|-----------------|-------------------|------|
| JPEG 4K (photo)| ~8 MB           | ~400 KB           | −95% |
| JPEG HD        | ~3 MB           | ~180 KB           | −94% |
| PNG screenshot | ~1.5 MB         | ~120 KB           | −92% |
| JPEG mobile    | ~2 MB           | ~150 KB           | −93% |

C'est la raison pour laquelle on convertit tout en WebP —
performances drastiquement améliorées sans perte visuelle notable.

---

## Utilisation du composant ImageUploader

```tsx
// Dans le formulaire de création d'une publication
import ImageUploader from '@/components/dashboard/ImageUploader'

function PostForm() {
  const [uploadedPhotos, setUploadedPhotos] = useState([])

  return (
    <form>
      <input name="title" placeholder="Titre de la publication" />

      <ImageUploader
        maxFiles={20}
        onUploadComplete={(photos) => {
          setUploadedPhotos(photos)
          // photos = [{ path, thumbPath, width, height, ... }]
        }}
      />

      {/* La première photo est automatiquement la couverture (index 0) */}
    </form>
  )
}
```

---

## Appel direct à l'API (sans le composant)

```typescript
const formData = new FormData()
formData.append('type', 'post')
formData.append('files', file1)
formData.append('files', file2)
formData.append('files', file3)

const res = await fetch('/api/upload', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
})

const data = await res.json()
// data.files = [{ filename, path, thumbPath, width, height, size }]
```

---

## Points techniques importants

### `.rotate()` de Sharp
Corrige automatiquement l'orientation EXIF — sans ça, les photos prises
en portrait sur mobile arrivent souvent couchées sur le serveur.

### `fit: 'inside'` vs `fit: 'cover'`
- `inside` (image principale) → respecte les proportions, ne recadre jamais
- `cover` (miniature) → recadre au centre pour remplir le carré parfaitement

### `withoutEnlargement: true`
Une photo de 800×600 ne sera jamais agrandie à 1920×1080.
Sharp ne l'agrandit pas, ce qui éviterait de perdre en qualité.

### Nommage des fichiers
`{slug-du-nom}-{timestamp}-{random}.webp`
- Le timestamp garantit l'unicité dans le temps
- Le random (6 bytes hex) évite les collisions simultanées
- Pas d'espaces, pas de caractères spéciaux → compatible avec tous les OS

---

## Prochaine étape : CRUD des Publications (Étape 5)

On va construire :
- `POST /api/posts` — Créer une publication avec ses photos
- `GET /api/posts` — Lister avec pagination et filtres
- `GET /api/posts/[id]` — Détail complet + photos + commentaires
- `PUT /api/posts/[id]` — Modifier (admin/auteur seulement)
- `DELETE /api/posts/[id]` — Supprimer + nettoyer les fichiers