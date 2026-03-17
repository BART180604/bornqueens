# BornQueens — Étape 3 : Authentification JWT

## Fichiers créés

```
src/
├── lib/
│   ├── prisma.ts          ← Instance Prisma singleton
│   └── auth.ts            ← Helpers JWT (sign, verify, extract, guards)
│
├── app/api/auth/
│   ├── register/route.ts  ← POST /api/auth/register
│   ├── login/route.ts     ← POST /api/auth/login
│   ├── logout/route.ts    ← POST /api/auth/logout
│   └── me/route.ts        ← GET  /api/auth/me
│
├── hooks/
│   └── useAuth.ts         ← Context + Hook React côté client
│
└── middleware.ts           ← Protection automatique des routes /dashboard
```

---

## Flux d'authentification complet

```
[Client]  POST /api/auth/login { email, password }
              │
              ▼
[API]     Cherche user en BDD
          Compare password avec bcrypt.compare()
              │
              ▼
[API]     Génère JWT signé avec JWT_SECRET
          { userId, email, role, username }
              │
         ┌───┴────────────────────┐
         ▼                        ▼
  Cookie httpOnly            Body JSON
  auth_token=xxx             { token, user }
  (pour SSR)                 (pour SPA/localStorage)
              │
              ▼
[Client]  Stocke token dans localStorage
          AuthContext mis à jour
          Redirect vers dashboard si admin
```

---

## Double stratégie token : Cookie + localStorage

On stocke le token aux deux endroits, et voici pourquoi :

| Stratégie | Avantage | Inconvénient |
|-----------|----------|--------------|
| Cookie httpOnly | Inaccessible au JS → sécurisé contre XSS | Envoyé automatiquement → risque CSRF |
| localStorage | Contrôle total côté JS | Accessible au JS → risque XSS |

**Notre approche :**
- Le **cookie httpOnly** sert au middleware Next.js (SSR, protection des routes)
- Le **localStorage** sert aux appels API client (fetch avec Authorization header)
- Le middleware côté serveur lit le cookie → pas de JS nécessaire
- Les hooks React lisent localStorage → contrôle total côté client

---

## Utilisation dans les composants

### Protéger une page côté client
```tsx
// src/app/dashboard/page.tsx
'use client'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, isLoading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/')
    }
  }, [isLoading, isAdmin])

  if (isLoading) return <div>Chargement...</div>

  return <div>Bienvenue {user?.displayName}</div>
}
```

### Protéger une API Route côté serveur
```typescript
// Dans n'importe quelle API route
import { getCurrentUser, isAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
  }

  if (!isAdmin(user)) {
    return NextResponse.json({ message: 'Accès refusé' }, { status: 403 })
  }

  // ... logique protégée
}
```

### Connecter un utilisateur dans un formulaire
```tsx
'use client'
import { useAuth } from '@/hooks/useAuth'

export default function LoginForm() {
  const { login } = useAuth()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const result = await login(email, password)
    if (result.success) {
      // Redirect...
    } else {
      // Afficher result.message
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button type="submit">Se connecter</button>
    </form>
  )
}
```

### Wrapper l'app avec AuthProvider
```tsx
// src/app/layout.tsx
import { AuthProvider } from '@/hooks/useAuth'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

---

## Points de sécurité importants

### 1. Le mot de passe n'est JAMAIS renvoyé
Dans toutes les réponses API, le champ `password` est explicitement exclu
via `select` Prisma ou destructuration avec `const { password: _, ...rest } = user`.

### 2. Message d'erreur volontairement vague au login
```typescript
// ❌ NE PAS FAIRE — révèle si l'email existe
if (!user) return error("Email introuvable")
if (!match) return error("Mot de passe incorrect")

// ✅ CORRECT — l'attaquant ne sait pas ce qui est faux
return error("Identifiants incorrects")
```

### 3. Coût bcrypt à 12
Un coût de 12 rend le hashage ~250ms — suffisamment lent pour décourager
une attaque par brute force, suffisamment rapide pour l'UX normale.

### 4. Validation email/username en base
La contrainte `@unique` Prisma garantit l'unicité au niveau BDD,
en complément de la vérification applicative.

---

## Prochaine étape : Upload de photos (Étape 4)

On construira :
- La route `POST /api/upload`
- La compression automatique avec Sharp.js
- Le stockage organisé dans `/public/uploads/`
- La gestion des formats (WebP conversion)
- La limite de taille et de type de fichier