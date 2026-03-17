'use client'
// src/components/posts/GalleryFilters.tsx
// Sidebar de filtres — Client Component
// Les filtres modifient l'URL (searchParams) → la page Server Component se recharge

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useTransition, useCallback }    from 'react'

interface Category {
    id:    string
    name:  string
    slug:  string
    _count: { posts: number }
}

interface GalleryFiltersProps {
    categories:     Category[]
    regions:        string[]
    activeCategory?: string
    activeRegion?:   string
    activeSearch?:   string
}

export default function GalleryFilters({
                                           categories,
                                           regions,
                                           activeCategory,
                                           activeRegion,
                                           activeSearch,
                                       }: Readonly<GalleryFiltersProps>) {
    const router      = useRouter()
    const pathname    = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const [searchInput, setSearchInput] = useState(activeSearch || '')

    // ── Construire la nouvelle URL en conservant les autres params ──
    const buildURL = useCallback((updates: Record<string, string | undefined>) => {
        const params = new URLSearchParams(searchParams.toString())

        Object.entries(updates).forEach(([key, value]) => {
            if (value) {
                params.set(key, value)
            } else {
                params.delete(key)
            }
        })

        // Réinitialiser la page à 1 quand un filtre change
        params.delete('page')

        return `${pathname}?${params.toString()}`
    }, [pathname, searchParams])

    function applyFilter(key: string, value: string | undefined) {
        startTransition(() => {
            router.push(buildURL({ [key]: value }))
        })
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        applyFilter('search', searchInput.trim() || undefined)
    }

    function clearAll() {
        setSearchInput('')
        startTransition(() => router.push(pathname))
    }

    const hasActiveFilters = !!(activeCategory || activeRegion || activeSearch)

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            opacity: isPending ? 0.6 : 1,
            transition: 'opacity 0.2s',
        }}>

            {/* ── RECHERCHE ── */}
            <div>
                <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '0.875rem' }}>
                    ✦ Recherche
                </p>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0' }}>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Mot-clé, région..."
                        style={{
                            flex: 1,
                            padding: '0.625rem 0.875rem',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.8rem',
                            color: 'var(--clr-noir)',
                            background: 'white',
                            border: '1px solid rgba(0,0,0,0.12)',
                            borderRight: 'none',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            borderRadius: 0,
                        }}
                        onFocus={e  => { e.target.style.borderColor = 'var(--clr-bordeaux)' }}
                        onBlur={e   => { e.target.style.borderColor = 'rgba(0,0,0,0.12)' }}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: '0.625rem 0.875rem',
                            background: 'var(--clr-bordeaux)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            flexShrink: 0,
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--clr-bordeaux-light)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--clr-bordeaux)' }}
                    >
                        ⌕
                    </button>
                </form>

                {/* Badge recherche active */}
                {activeSearch && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '0.5rem',
                        padding: '0.35rem 0.625rem',
                        background: 'rgba(139,26,74,0.06)',
                        border: '1px solid rgba(139,26,74,0.15)',
                    }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--clr-bordeaux)' }}>
              « {activeSearch} »
            </span>
                        <button
                            onClick={() => { setSearchInput(''); applyFilter('search', undefined) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-bordeaux)', fontSize: '0.75rem', padding: 0, lineHeight: 1 }}
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            {/* ── CATÉGORIES ── */}
            <div>
                <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '0.875rem' }}>
                    ✦ Catégories
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>

                    {/* Toutes */}
                    <button
                        onClick={() => applyFilter('category', undefined)}
                        style={filterItemStyle(!activeCategory)}
                    >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--clr-gris)', flexShrink: 0 }} />
                        <span style={{ flex: 1, textAlign: 'left' }}>Toutes</span>
                        <span style={{ fontSize: '0.65rem', color: !activeCategory ? 'rgba(255,255,255,0.7)' : 'var(--clr-gris)' }}>
              {categories.reduce((sum, c) => sum + c._count.posts, 0)}
            </span>
                    </button>

                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => applyFilter('category', activeCategory === cat.slug ? undefined : cat.slug)}
                            style={filterItemStyle(activeCategory === cat.slug)}
                        >
              <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--clr-bordeaux)',
                  flexShrink: 0,
              }} />
                            <span style={{ flex: 1, textAlign: 'left' }}>{cat.name}</span>
                            <span style={{ fontSize: '0.65rem', color: activeCategory === cat.slug ? 'rgba(255,255,255,0.7)' : 'var(--clr-gris)' }}>
                {cat._count.posts}
              </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── RÉGIONS ── */}
            {regions.length > 0 && (
                <div>
                    <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '0.875rem' }}>
                        ✦ Région
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {regions.map(region => (
                            <button
                                key={region}
                                onClick={() => applyFilter('region', activeRegion === region ? undefined : region)}
                                style={filterItemStyle(activeRegion === region)}
                            >
                                <span style={{ flex: 1, textAlign: 'left' }}>{region}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── EFFACER TOUT ── */}
            {hasActiveFilters && (
                <button
                    onClick={clearAll}
                    style={{
                        padding: '0.625rem',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.75rem',
                        color: 'var(--clr-bordeaux)',
                        background: 'transparent',
                        border: '1px solid var(--clr-bordeaux)',
                        cursor: 'pointer',
                        letterSpacing: '0.06em',
                        transition: 'all 0.2s var(--ease-elegant)',
                        textTransform: 'uppercase',
                    }}
                    onMouseEnter={e => {
                        const el = e.currentTarget as HTMLButtonElement
                        el.style.background = 'var(--clr-bordeaux)'
                        el.style.color = 'white'
                    }}
                    onMouseLeave={e => {
                        const el = e.currentTarget as HTMLButtonElement
                        el.style.background = 'transparent'
                        el.style.color = 'var(--clr-bordeaux)'
                    }}
                >
                    ✕ Effacer tous les filtres
                </button>
            )}

            {/* Indicateur de chargement */}
            {isPending && (
                <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.7rem',
                    color: 'var(--clr-gris)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}>
                  <span style={{
                      width: '10px', height: '10px',
                      border: '1.5px solid rgba(0,0,0,0.15)',
                      borderTop: '1.5px solid var(--clr-bordeaux)',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                      flexShrink: 0,
                  }}/>

                    Chargement...
                </p>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

// ─────────────────────────────────────────
// HELPER — Style d'un élément de filtre
// ─────────────────────────────────────────

function filterItemStyle(isActive: boolean): React.CSSProperties {
    return {
        display:        'flex',
        alignItems:     'center',
        gap:            '0.625rem',
        padding:        '0.5rem 0.75rem',
        fontFamily:     'var(--font-body)',
        fontSize:       '0.8rem',
        color:          isActive ? 'white' : 'var(--clr-noir)',
        background:     isActive ? 'var(--clr-bordeaux)' : 'white',
        border:         `1px solid ${isActive ? 'var(--clr-bordeaux)' : 'rgba(0,0,0,0.07)'}`,
        cursor:         'pointer',
        transition:     'all 0.15s var(--ease-elegant)',
        textAlign:      'left',
        width:          '100%',
        letterSpacing:  '0.02em',
    }
}