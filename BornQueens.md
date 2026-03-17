# BornQueens — Chronologie exacte de création des fichiers

> 3 sessions de travail · 10 mars → 12 mars 2026  
> Chaque fichier listé dans l'ordre réel de création ou d'édition.

---

## SESSION 1 — 10 mars 2026
**Étapes 1 à 5 (Architecture → CRUD Publications)**

### Étape 1 — Architecture & Documentation
| # | Fichier output | Destination projet | Contenu |
|---|---------------|-------------------|---------|
| 1 | `ARCHITECTURE.md` | (doc) | Structure dossiers, flux de données, variables d'env, liste dépendances npm |

### Étape 2 — Base de données
| # | Fichier output | Destination projet | Contenu |
|---|---------------|-------------------|---------|
| 2 | `schema.prisma` | `prisma/schema.prisma` | Schéma complet : User, Post, Photo, Category, Tag, Comment, Like + relations many-to-many |
| 3 | `DATABASE.md` | (doc) | Explication du schéma, relations, index, conventions |

### Étape 3 — Authentification JWT
| # | Fichier output | Destination projet | Contenu |
|---|---------------|-------------------|---------|
| 4 | `lib.auth.ts` | `src/lib/auth.ts` | Helpers JWT : signToken, verifyToken, getCurrentUser, isAdmin, isContributor |
| 5 | `lib.prisma.ts` | `src/lib/prisma.ts` | Singleton Prisma Client (pattern anti-hot-reload) |
| 6 | `api.auth.register.route.ts` | `src/app/api/auth/register/route.ts` | POST — création compte, hash bcrypt, token JWT |
| 7 | `api.auth.login.route.ts` | `src/app/api/auth/login/route.ts` | POST — vérification password, double token (cookie httpOnly + JSON) |
| 8 | `api.auth.logout.route.ts` | `src/app/api/auth/logout/route.ts` | POST — suppression cookie |
| 9 | `api.auth.me.route.ts` | `src/app/api/auth/me/route.ts` | GET — profil utilisateur connecté |
| 10 | `middleware.ts` | `src/middleware.ts` | Protection routes dashboard, redirection si non-auth |
| 11 | `hooks.useAuth.ts` | `src/hooks/useAuth.ts` | Hook React — état auth, login/logout, token localStorage |
| 12 | `AUTH.md` | (doc) | Flux auth complet, double-token pattern, exemples d'utilisation |

### Étape 4 — Upload & Traitement photos (Sharp)
| # | Fichier output | Destination projet | Contenu |
|---|---------------|-------------------|---------|
| 13 | `lib.upload.ts` | `src/lib/upload.ts` | Sharp : rotation EXIF, resize WebP 1920px + thumb 600px, nommage fichiers |
| 14 | `api.upload.route.ts` | `src/app/api/upload/route.ts` | POST /api/upload — FormData, validation type/taille, appel Sharp |
| 15 | `ImageUploader.tsx` | `src/components/dashboard/ImageUploader.tsx` | Composant drag & drop multi-fichiers, preview, progress |
| 16 | `next.config.ts` | `next.config.ts` | Config domaines images autorisés |
| 17 | `UPLOAD.md` | (doc) | Flux upload, gains compression WebP, options Sharp expliquées |

### Étape 5 — CRUD Publications
> ⚠️ Ces 4 modules ont été livrés en **code inline** (pas de fichier créé directement)  
> À copier-coller manuellement dans les bons chemins.

| # | Destination projet | Contenu |
|---|-------------------|---------|
| — | `src/app/api/posts/route.ts` | GET (liste paginée + 5 filtres) + POST (création avec transaction) |
| — | `src/app/api/posts/[id]/route.ts` | GET (détail + viewCount++) + PUT (transaction delete/create relations) + DELETE (BDD + fichiers) |
| — | `src/app/api/posts/[id]/like/route.ts` | POST — toggle like avec @@unique Prisma comme garde-fou |
| — | `src/hooks/usePosts.ts` | usePosts() + useLike() avec optimistic UI + rollback |

---

## SESSION 2 — 12 mars 2026 (matin, 12h35)
**Étapes 6 à 8 (Commentaires → Frontend → Dashboard) + début Étape 9**

### Étape 6 — Commentaires
| # | Fichier output | Destination projet | Contenu |
|---|---------------|-------------------|---------|
| 18 | `api.posts.id.comments.route.ts` | `src/app/api/posts/[id]/comments/route.ts` | GET (liste paginée) + POST (création, 1 niveau imbrication, modération auto admin) |
| 19 | `api.comments.id.route.ts` | `src/app/api/comments/[id]/route.ts` | PUT (modifier, repasse en modération) + DELETE (soft delete — préserve les réponses) |
| 20 | `api.comments.approve.route.ts` | `src/app/api/comments/[id]/approve/route.ts` | PATCH (approuver/rejeter, admin) + GET file de modération |
| 21 | `CommentList.tsx` | `src/components/interactions/CommentList.tsx` | Liste + CommentItem (edit/delete inline) + CommentForm (avec état pending) |
| 22 | `COMMENTS.md` | (doc) | Architecture imbrication, flux modération, explication soft delete |

### Étape 7 — Frontend complet
| # | Fichier output | Destination projet | Contenu |
|---|---------------|-------------------|---------|
| 23 | `globals.css` | `src/app/globals.css` | Design tokens CSS : palette bordeaux/or/crème, typographies Cormorant+Jost, animations |
| 24 | `Navbar.tsx` | `src/components/layout/Navbar.tsx` | Navigation principale, menu mobile, indicateur auth |
| 25 | `HomePage.tsx` | `src/app/(site)/page.tsx` | Hero éditorial + grille immersive de publications (SSR) |
| 26 | `PostCard.tsx` | `src/components/posts/PostCard.tsx` | Carte publication : cover, titre, méta, hover reveal |
| 27 | `Gallery.tsx` | `src/components/posts/Gallery.tsx` | Galerie lightbox : navigation clavier/swipe, zoom, EXIF |
| 28 | `Interactions.tsx` | `src/components/interactions/LikeButton.tsx` | LikeButton (animation cœur) + ShareButtons (Web Share API + fallback) |
| 29 | `PostDetailPage.tsx` | `src/app/(site)/posts/[slug]/page.tsx` | Layout éditorial : galerie + contenu + sidebar auteur + publications liées |
| 30 | `layout.tsx` | `src/app/layout.tsx` | Layout racine : fonts Google, metadata globale |
| 31 | `FRONTEND.md` | (doc) | Direction artistique, palette, typographies, composants |

### Étape 8 — Dashboard Admin
| # | Fichier output | Destination projet | Contenu |
|---|---------------|-------------------|---------|
| 32 | `dashboard.layout.tsx` | `src/app/dashboard/layout.tsx` | Sidebar navigation admin, protection auth |
| 33 | `dashboard.page.tsx` | `src/app/dashboard/page.tsx` | Vue d'ensemble : stats (posts, vues, likes, commentaires en attente) |
| 34 | `dashboard.PostForm.tsx` | `src/components/dashboard/PostForm.tsx` | Formulaire création/édition publication : titre, contenu, catégories, tags, ImageUploader |
| 35 | `dashboard.CommentsPage.tsx` | `src/app/dashboard/comments/page.tsx` | File de modération : approuver/rejeter avec feedback optimiste |
| 36 | `DASHBOARD.md` | (doc) | Structure dashboard, routes protégées, guide utilisation |

### Étape 9 (début) — Page Login
| # | Fichier output | Destination projet | Contenu |
|---|---------------|-------------------|---------|
| 37 | (LoginPage.tsx — session coupée) | `src/app/(auth)/login/page.tsx` | Formulaire connexion — session interrompue, livré complet en session 3 |

---

## SESSION 3 — 12 mars 2026 (après-midi, 14h15)
**Suite Étape 9 + Étape 9b/9c/9d/9e + Corrections**

### Étape 9 — Pages Auth front-end (suite et fin)
| # | Fichier output | Destination projet | Contenu |
|---|---------------|-------------------|---------|
| 38 | `auth.register.page.tsx` → `RegisterPage.tsx` | `src/app/(auth)/register/page.tsx` | Formulaire inscription, validation double couche client+serveur |
| 39 | `auth.me.page.tsx` → `ProfilePage.tsx` | `src/app/(site)/me/page.tsx` | Profil utilisateur : 3 onglets (infos, mot de passe, favoris) |
| 40 | `auth.forgot-password.page.tsx` → `ForgotPasswordPage.tsx` | `src/app/(auth)/forgot-password/page.tsx` | Flux reset 2 étapes sur même page, détecte `?token=` dans URL |
| 41 | `AUTH_PAGES.md` | (doc) | Routes API manquantes à créer, schema Prisma à modifier, variables SMTP |

### Étape 9b — Galerie publique /posts
| # | Fichier output | Destination projet | Contenu |
|---|---------------|-------------------|---------|
| 42 | `posts.page.tsx` → `PostsPage.tsx` | `src/app/(site)/posts/page.tsx` | Galerie filtrée SSR : searchParams → Prisma direct (pas de fetch interne) |
| 43 | `GalleryFilters.tsx` | `src/components/posts/GalleryFilters.tsx` | Sidebar filtres Client Component : useTransition + router.push |

### Étape 9c — Dashboard posts (liste + new + edit)
| # | Fichier output | Destination projet | Contenu |
|---|---------------|-------------------|---------|
| 44 | `dashboard.posts.page.tsx` | `src/app/dashboard/posts/page.tsx` | Tableau publications admin (Server Component, fetch Prisma direct) |
| 45 | `DashboardPostsClient.tsx` | `src/components/dashboard/DashboardPostsClient.tsx` | Tableau interactif : menu contextuel ⋮, changement statut optimiste |
| 46 | `dashboard.posts.new-edit.tsx` | `src/app/dashboard/posts/new/page.tsx` + `posts/[id]/edit/page.tsx` | Pages new et edit regroupées, remapping categories pour PostForm |

### Étape 9d — API Catégories
| # | Fichier output | Destination projet | Contenu |
|---|---------------|-------------------|---------|
| 47 | `api.categories.route.ts` | `src/app/api/categories/route.ts` | GET (public, ?withCount) + POST (admin, slug auto-généré) |
| 48 | `api.categories.id.route.ts` | `src/app/api/categories/[id]/route.ts` | GET + PUT + DELETE (protégé 409 si publications liées, force requis) |

### Étape 9e — ShareButtons séparé
| # | Fichier output | Destination projet | Contenu |
|---|---------------|-------------------|---------|
| 49 | `ShareButtons.tsx` | `src/components/interactions/ShareButtons.tsx` | Extrait de Interactions.tsx, export default, fallback execCommand pour HTTP |

### Corrections et re-livrages
| # | Fichier output | Raison | Ce qui a changé |
|---|---------------|--------|-----------------|
| 50 | `PostDetailPage.tsx` (v1 typée) | Types `avatar` → `avatarUrl`, interfaces explicites | Retypage complet sans `Prisma.GetPayload` |
| 51 | `PostDetailPage.tsx` (v2 finale) | Correction `onCommentAdded` passé en prop depuis Server Component | `CommentList` remplacé par `CommentsSection` |
| 52 | `CommentsSection.tsx` *(session actuelle)* | Nouveau fichier — wrapper Client pour résoudre l'erreur | `'use client'`, useState comments/total, possède `handleCommentAdded` |
| 53 | `PostDetailPage.tsx` *(session actuelle)* | Fichier exact de l'utilisateur avec les vrais imports | Import `CommentsSection`, `initialComments`/`initialTotal` au lieu de `onCommentAdded` |

---

## Récapitulatif — Index complet par destination projet

```
prisma/
  schema.prisma                                     ← #2

src/
  app/
    globals.css                                     ← #23
    layout.tsx                                      ← #30
    (site)/
      page.tsx                                      ← #25  (HomePage)
      posts/
        page.tsx                                    ← #42  (PostsPage)
        [slug]/
          page.tsx                                  ← #29 → #50 → #53  (PostDetailPage, 3 versions)
      me/
        page.tsx                                    ← #39  (ProfilePage)
    (auth)/
      login/page.tsx                                ← #37  (LoginPage)
      register/page.tsx                             ← #38  (RegisterPage)
      forgot-password/page.tsx                      ← #40  (ForgotPasswordPage)
    api/
      auth/
        register/route.ts                           ← #6
        login/route.ts                              ← #7
        logout/route.ts                             ← #8
        me/route.ts                                 ← #9
      upload/route.ts                               ← #14
      posts/
        route.ts                                    ← inline étape 5
        [id]/
          route.ts                                  ← inline étape 5
          like/route.ts                             ← inline étape 5
          comments/route.ts                         ← #18
      comments/
        [id]/route.ts                               ← #19
        [id]/approve/route.ts                       ← #20
      categories/
        route.ts                                    ← #47
        [id]/route.ts                               ← #48
    dashboard/
      layout.tsx                                    ← #32
      page.tsx                                      ← #33
      posts/
        page.tsx                                    ← #44
        new/page.tsx                                ← #46
        [id]/edit/page.tsx                          ← #46
      comments/page.tsx                             ← #35
  lib/
    auth.ts                                         ← #4
    prisma.ts                                       ← #5
    upload.ts                                       ← #13
  hooks/
    useAuth.ts                                      ← #11
    usePosts.ts                                     ← inline étape 5
  middleware.ts                                     ← #10
  components/
    layout/
      Navbar.tsx                                    ← #24
    posts/
      PostCard.tsx                                  ← #26
      Gallery.tsx                                   ← #27
      GalleryFilters.tsx                            ← #43
    interactions/
      LikeButton.tsx                                ← #28  (dans Interactions.tsx)
      ShareButtons.tsx                              ← #49  (extrait séparé)
      CommentList.tsx                               ← #21
      CommentsSection.tsx                           ← #52  ← NOUVEAU (wrapper client)
    dashboard/
      ImageUploader.tsx                             ← #15
      PostForm.tsx                                  ← #34
      DashboardPostsClient.tsx                      ← #45

next.config.ts                                      ← #16
```

---

## Note sur les fichiers "inline" (Étape 5)

Les 4 fichiers de l'étape 5 (`posts/route.ts`, `posts/[id]/route.ts`, `posts/[id]/like/route.ts`, `usePosts.ts`) ont été livrés en code dans le chat, pas créés comme fichiers téléchargeables. Ils sont dans le transcript de la session 1 et dans le résumé. Le code est complet et à jour.