# BornQueens — Base de Données

## Diagramme des relations

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│    User     │       │      Post       │       │   Category  │
│─────────────│       │─────────────────│       │─────────────│
│ id          │──┐    │ id              │──┐    │ id          │
│ email       │  │    │ title           │  │    │ name        │
│ username    │  │    │ slug            │  │    │ slug        │
│ password    │  │    │ content         │  │    │ description │
│ displayName │  │    │ region          │  │    │ color       │
│ avatar      │  │    │ period          │  └───▶│─────────────│
│ bio         │  │    │ status          │       │ PostCategory│
│ role        │  │    │ coverIndex      │       └─────────────┘
│ isActive    │  │    │ viewCount       │
└─────────────┘  │    │ publishedAt     │       ┌─────────────┐
                 │    │─────────────────│       │     Tag     │
      ┌──────────┘    │ authorId ───────┼──┐    │─────────────│
      │               └─────────────────┘  │    │ id          │
      │                        │           │    │ name        │
      │         ┌──────────────┼───────┐   │    │ slug        │
      │         │              │       │   └───▶│─────────────│
      │         ▼              ▼       ▼        │   PostTag   │
      │   ┌──────────┐  ┌──────────┐  ┌──────┐ └─────────────┘
      │   │  Photo   │  │ Comment  │  │ Like │
      │   │──────────│  │──────────│  │──────│
      │   │ filename │  │ content  │  │userId│◀──┐
      │   │ path     │  │isApproved│  │postId│   │
      │   │ caption  │  │isDeleted │  └──────┘   │
      │   │ alt      │  │parentId ─┼──┐          │
      │   │ order    │  │authorId ─┼──┼──────────┘
      │   │ credits  │  └──────────┘  │
      │   └──────────┘                │ (réponses imbriquées)
      │                               ▼
      │                         ┌──────────┐
      └────────────────────────▶│ SavedPost│
                                │──────────│
                                │ userId   │
                                │ postId   │
                                └──────────┘
```

---

## Décisions de conception expliquées

### Pourquoi `cuid()` et pas `uuid()` ou auto-increment ?
Les CUIDs sont plus courts, sans tirets dans les URLs, et évitent les collisions
en environnement distribué. Parfait pour des slugs et des IDs dans les URLs.

### Pourquoi `isDeleted` sur Comment et pas une vraie suppression ?
C'est un **soft delete** — le commentaire n'est pas effacé de la base,
il est juste marqué comme supprimé. Ça permet de garder la cohérence des
réponses imbriquées et de pouvoir restaurer un commentaire supprimé par erreur.

### Pourquoi `@@unique([userId, postId])` sur Like et SavedPost ?
Pour garantir au niveau base de données qu'un utilisateur ne peut pas liker
deux fois la même publication. Même si le front-end le gère, la BDD est
le dernier rempart. C'est une contrainte d'intégrité, pas juste de la validation.

### Pourquoi `coverIndex` sur Post plutôt qu'un boolean `isCover` sur Photo ?
Un index est plus flexible — pas besoin de mettre à jour deux lignes quand
on change la photo de couverture (retirer l'ancien boolean, mettre le nouveau).
Un seul champ sur le post suffit.

### Pourquoi séparer `PostCategory` et `PostTag` en tables explicites ?
Prisma permet les relations implicites many-to-many, mais les tables explicites
donnent plus de contrôle (ex: ajouter un champ `order` plus tard) et
sont plus lisibles dans la base de données.

### Le champ `content` stocke du Markdown
Le texte éditorial sera stocké en Markdown dans PostgreSQL. Côté front,
on utilisera `react-markdown` pour le rendu. Simple, portable, pas de
dépendance à un éditeur lourd.

---

## Commandes pour démarrer

```bash
# 1. Copier le schema.prisma dans prisma/schema.prisma

# 2. Créer la base de données PostgreSQL
createdb bornqueens

# 3. Configurer .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/bornqueens"

# 4. Lancer la première migration
npx prisma migrate dev --name init

# 5. Générer le client Prisma
npx prisma generate

# 6. Ouvrir Prisma Studio pour visualiser la BDD
npx prisma studio
```

---

## Données de test (seed)

Créer `prisma/seed.ts` :

```typescript
import { PrismaClient, Role, PostStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Créer un admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@bornqueens.com',
      username: 'admin',
      password: await bcrypt.hash('password123', 12),
      displayName: 'BornQueens Admin',
      role: Role.ADMIN,
    }
  })

  // Créer des catégories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Afrique de l\'Ouest', slug: 'afrique-ouest', color: '#8B1A4A' } }),
    prisma.category.create({ data: { name: 'Afrique Centrale', slug: 'afrique-centrale', color: '#D4A843' } }),
    prisma.category.create({ data: { name: 'Afrique de l\'Est', slug: 'afrique-est', color: '#2D6A4F' } }),
    prisma.category.create({ data: { name: 'Diaspora', slug: 'diaspora', color: '#4A1942' } }),
  ])

  // Créer des tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'Tresses Fulani', slug: 'tresses-fulani' } }),
    prisma.tag.create({ data: { name: 'Cornrows', slug: 'cornrows' } }),
    prisma.tag.create({ data: { name: 'Locks', slug: 'locks' } }),
    prisma.tag.create({ data: { name: 'Mariage', slug: 'mariage' } }),
    prisma.tag.create({ data: { name: 'Cérémonie', slug: 'ceremonie' } }),
  ])

  console.log('✅ Seed terminé')
  console.log(`   ${categories.length} catégories créées`)
  console.log(`   ${tags.length} tags créés`)
  console.log(`   Admin : admin@bornqueens.com / password123`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

```bash
# Ajouter dans package.json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}

# Lancer le seed
npx prisma db seed
```