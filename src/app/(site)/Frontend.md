# BornQueens — Étape 7 : Front-end

## Fichiers créés

```
src/
├── app/
│   ├── globals.css                          ← Design system complet
│   ├── layout.tsx                           ← Layout racine + Footer
│   └── (site)/
│       ├── page.tsx                         ← Page d'accueil
│       └── posts/[slug]/page.tsx            ← Page de détail
│
└── components/
    ├── layout/
    │   └── Navbar.tsx                       ← Navigation fixe + mobile
    ├── posts/
    │   ├── PostCard.tsx                     ← Carte publication (normale + featured)
    │   └── Gallery.tsx                      ← Galerie + lightbox
    └── interactions/
        ├── LikeButton.tsx                   ← Like avec animation cœur
        └── ShareButtons.tsx                 ← Partage multi-réseaux
```

---

## Direction artistique — Luxury Editorial Africaine

| Décision | Choix | Raison |
|----------|-------|--------|
| Police titres | Cormorant Garamond | Serif élégant, noble, intemporel |
| Police corps | Jost | Sans-serif clair et lisible |
| Police accents | Playfair Display | Italique dramatique pour les citations |
| Couleur dominante | Bordeaux #8B1A4A | Royauté, profondeur, Afrique |
| Accent | Or #D4A843 | Prestige, lumière, chaleur |
| Fond | Crème #FBF7F1 | Douceur, papier, intemporel |
| Mode | Dark sur le hero | Immersion maximale |

---

## Architecture des pages

### Page d'accueil `/`
```
┌──────────────────────────────────────────┐
│           HERO — 92vh                    │
│  Photo pleine largeur + gradient         │
│  Titre + excerpt + CTA + compteurs       │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  INTRO ÉDITORIALE  |  STATISTIQUES       │
│  Mission + CTA     |  4 chiffres clés    │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│              GRILLE GALERIE              │
│  [Featured 2×] [Normal] [Normal]         │
│  [Normal] [Featured 2×] [Normal]         │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  BANDE NOIRE — Catégories par région     │
└──────────────────────────────────────────┘
```

### Page de détail `/posts/[slug]`
```
┌──────────────────────────────────────────┐
│  GALERIE PHOTOS — grille + lightbox      │
└──────────────────────────────────────────┘
┌────────────────────┬─────────────────────┐
│  ARTICLE           │  SIDEBAR            │
│  Breadcrumb        │  Auteur             │
│  Catégories        │  Publications liées │
│  Titre + méta      │  (sticky)           │
│  Corps éditorial   │                     │
│  Tags              │                     │
│  ─────────────     │                     │
│  Like + Partage    │                     │
│  Commentaires      │                     │
└────────────────────┴─────────────────────┘
```

---

## Composant Gallery — fonctionnement détaillé

### Grille des miniatures
La grille s'adapte automatiquement au nombre de photos :
- 1 photo  → pleine largeur
- 2 photos → 2 colonnes égales
- 3+ photos → grille 3 colonnes, première photo en 2 colonnes (mise en avant)

### Lightbox
La lightbox gère 3 modes d'interaction simultanément :

| Input | Action |
|-------|--------|
| Clic sur miniature | Ouvre la lightbox à l'index cliqué |
| ← → clavier | Navigation entre photos |
| Swipe gauche/droite (mobile) | Navigation tactile |
| Escape | Fermeture |
| Clic sur overlay | Fermeture |
| Points de progression | Navigation directe |

### Performance
```tsx
// Chaque image lightbox est chargée avec priority
// Le spinner apparaît pendant le chargement
<Image priority onLoad={() => setIsLoading(false)} />
```

---

## LikeButton — Optimistic UI + Animation

Le like fonctionne en 3 temps :

```
1. Clic utilisateur
   │
   ▼
2. Mise à jour IMMÉDIATE de l'UI (optimistic)
   liked: true, count: count + 1
   Animation heartPulse déclenchée
   │
   ▼
3. Appel API en arrière-plan
   │
   ├── Succès → synchroniser avec la valeur serveur
   └── Échec  → rollback vers l'état précédent
```

Le résultat : l'interface semble instantanée même sur une connexion lente.

---

## Open Graph — Partage social optimisé

La page de détail génère automatiquement les métadonnées Open Graph :

```typescript
// Résultat quand quelqu'un partage une publication BornQueens sur Facebook
openGraph: {
  title:       "Les Tresses Fulani — Couronne du Sahel",
  description: "Excerpt de la publication...",
  images: [{
    url:    "/uploads/posts/fulani-braids-xxx.webp",
    width:  1200,
    height: 630
  }],
  type: "article",
}
```

→ L'aperçu de partage affichera la belle photo de couverture, pas un lien nu.

---

## Design tokens — Variables CSS globales

Toutes les valeurs de design sont centralisées dans `globals.css` :

```css
/* Utilisation dans n'importe quel composant */
style={{ color: 'var(--clr-bordeaux)' }}
style={{ fontFamily: 'var(--font-display)' }}
style={{ transition: 'all 0.3s var(--ease-elegant)' }}
style={{ boxShadow: 'var(--shadow-card)' }}
```

Avantage : changer la couleur principale = modifier 1 variable.

---

## Note importante — react-markdown

Dans la page de détail, le contenu utilise temporairement `dangerouslySetInnerHTML`.
En production, remplacer par `react-markdown` :

```bash
npm install react-markdown remark-gfm
```

```tsx
import ReactMarkdown from 'react-markdown'
import remarkGfm    from 'remark-gfm'

<div className="prose-editorial">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {post.content}
  </ReactMarkdown>
</div>
```

---

## Prochaine étape : Dashboard Admin (Étape 8)

On va construire :
- Layout dashboard avec sidebar navigation
- Tableau de bord — statistiques et publications récentes
- Formulaire de création/édition de publication (PostForm)
- Interface de modération des commentaires
- Gestion des utilisateurs