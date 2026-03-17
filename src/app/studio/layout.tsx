'use client'

import { useEffect }                  from 'react'
import { useRouter, usePathname }     from 'next/navigation'
import Link                           from 'next/link'
import { useAuth }                    from '@/app/hooks/useAuth'

const NAV_ITEMS = [
    { href: '/studio',             icon: '◈', label: 'Vue d\'ensemble' },
    { href: '/studio/posts',       icon: '✦', label: 'Mes publications' },
    { href: '/studio/posts/new',   icon: '+', label: 'Nouvelle publication' },
    { href: '/studio/comments',    icon: '✉', label: 'Commentaires reçus' },
]

export default function StudioLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, logout, isAuthenticated } = useAuth()
    const router   = useRouter()
    const pathname = usePathname()

    const isAllowed = user?.role === 'CONTRIBUTOR' || user?.role === 'ADMIN'

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !isAllowed)) {
            router.replace('/')
        }
    }, [isLoading, isAuthenticated, isAllowed, router])

    if (isLoading) return <StudioSkeleton />
    if (!isAllowed) return null

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F4F1' }}>

            {/* ── SIDEBAR ── */}
            <aside style={{
                width:          '260px',
                flexShrink:     0,
                background:     'var(--clr-noir)',
                display:        'flex',
                flexDirection:  'column',
                position:       'fixed',
                top: 0, left: 0, bottom: 0,
                zIndex:         50,
                overflowY:      'auto',
            }}>
                {/* Logo */}
                <div style={{
                    padding:      '2rem 1.5rem',
                    borderBottom: '1px solid rgba(212,168,67,0.15)',
                }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize:   '1.3rem',
                            fontWeight: 600,
                            color:      'var(--clr-bordeaux)',
                        }}>
                            Born Queens
                        </div>
                        <div style={{
                            fontFamily:    'var(--font-body)',
                            fontSize:      '0.5rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color:         'var(--clr-or)',
                            marginTop:     '2px',
                        }}>
                            Espace Contributeur
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '1.5rem 0' }}>
                    {NAV_ITEMS.map(item => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/studio' && pathname.startsWith(item.href))

                        return (
                            <Link key={item.href} href={item.href} style={{
                                display:        'flex',
                                alignItems:     'center',
                                gap:            '0.875rem',
                                padding:        '0.75rem 1.5rem',
                                textDecoration: 'none',
                                color:          isActive ? 'var(--clr-creme)' : 'rgba(245,237,224,0.45)',
                                background:     isActive ? 'rgba(139,26,74,0.25)' : 'transparent',
                                borderLeft:     isActive ? '2px solid var(--clr-bordeaux)' : '2px solid transparent',
                                transition:     'all 0.2s var(--ease-elegant)',
                                fontFamily:     'var(--font-body)',
                                fontSize:       '0.8rem',
                                letterSpacing:  '0.05em',
                                marginBottom:   '2px',
                            }}
                                  onMouseEnter={e => {
                                      if (!isActive) {
                                          const el = e.currentTarget as HTMLAnchorElement
                                          el.style.color      = 'var(--clr-creme)'
                                          el.style.background = 'rgba(255,255,255,0.05)'
                                      }
                                  }}
                                  onMouseLeave={e => {
                                      if (!isActive) {
                                          const el = e.currentTarget as HTMLAnchorElement
                                          el.style.color      = 'rgba(245,237,224,0.45)'
                                          el.style.background = 'transparent'
                                      }
                                  }}
                            >
                                <span style={{
                                    width:     '20px',
                                    textAlign: 'center',
                                    fontSize:  item.icon === '+' ? '1.2rem' : '0.9rem',
                                    color:     isActive ? 'var(--clr-or)' : 'inherit',
                                    flexShrink: 0,
                                }}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        )
                    })}

                    <div style={{
                        height:     '1px',
                        background: 'rgba(212,168,67,0.1)',
                        margin:     '1rem 1.5rem',
                    }} />

                    <a href="/" target="_blank" rel="noopener noreferrer" style={{
                        display:        'flex',
                        alignItems:     'center',
                        gap:            '0.875rem',
                        padding:        '0.75rem 1.5rem',
                        textDecoration: 'none',
                        color:          'rgba(245,237,224,0.35)',
                        fontFamily:     'var(--font-body)',
                        fontSize:       '0.75rem',
                        letterSpacing:  '0.05em',
                        transition:     'color 0.2s',
                    }}
                       onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--clr-or)' }}
                       onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(245,237,224,0.35)' }}
                    >
                        <span style={{ width: '20px', textAlign: 'center', fontSize: '0.8rem' }}>↗</span>
                        Voir le site
                    </a>
                </nav>

                {/* Profil en bas */}
                <div style={{
                    padding:      '1.5rem',
                    borderTop:    '1px solid rgba(212,168,67,0.15)',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '0.75rem',
                }}>
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background:     'var(--clr-bordeaux)',
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            color:          'white',
                            fontFamily:     'var(--font-display)',
                            fontSize:       '1rem',
                            flexShrink:     0,
                        }}>
                            {(user?.displayName || user?.username || 'C')[0].toUpperCase()}
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                            fontFamily:    'var(--font-body)',
                            fontSize:      '0.75rem',
                            color:         'var(--clr-creme)',
                            fontWeight:    500,
                            overflow:      'hidden',
                            textOverflow:  'ellipsis',
                            whiteSpace:    'nowrap',
                        }}>
                            {user?.displayName || user?.username}
                        </p>
                        <p style={{
                            fontFamily:    'var(--font-body)',
                            fontSize:      '0.6rem',
                            color:         'var(--clr-or)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        }}>
                            Contributeur
                        </p>
                    </div>
                    <button onClick={logout} title="Déconnexion" style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color:      'rgba(245,237,224,0.3)',
                        fontSize:   '1rem',
                        transition: 'color 0.2s',
                        padding:    '4px',
                    }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(245,237,224,0.3)' }}
                    >
                        ⏻
                    </button>
                </div>
            </aside>

            {/* ── CONTENU ── */}
            <main style={{
                flex:          1,
                marginLeft:    '260px',
                minHeight:     '100vh',
                display:       'flex',
                flexDirection: 'column',
            }}>
                {/* Topbar */}
                <div style={{
                    background:     'white',
                    padding:        '1rem 2rem',
                    borderBottom:   '1px solid rgba(0,0,0,0.06)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    position:       'sticky',
                    top:            0,
                    zIndex:         40,
                }}>
                    <Breadcrumb pathname={pathname} />
                    <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize:   '0.7rem',
                        color:      'var(--clr-gris)',
                    }}>
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>

                <div style={{ flex: 1, padding: '2.5rem 2rem' }}>
                    {children}
                </div>
            </main>
        </div>
    )
}

function Breadcrumb({ pathname }: { pathname: string }) {
    const segments = pathname.split('/').filter(Boolean)
    const labels: Record<string, string> = {
        studio:   'Studio',
        posts:    'Publications',
        new:      'Nouvelle',
        comments: 'Commentaires',
        edit:     'Modifier',
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {segments.map((seg, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {i > 0 && <span style={{ color: 'var(--clr-gris)', fontSize: '0.7rem' }}>›</span>}
                    <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize:   '0.8rem',
                        color:      i === segments.length - 1 ? 'var(--clr-bordeaux)' : 'var(--clr-gris)',
                        fontWeight: i === segments.length - 1 ? 500 : 400,
                    }}>
                        {labels[seg] || seg}
                    </span>
                </span>
            ))}
        </div>
    )
}

function StudioSkeleton() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <div style={{ width: '260px', background: 'var(--clr-noir)', flexShrink: 0 }} />
            <div style={{ flex: 1, padding: '2.5rem 2rem' }}>
                <div style={{ height: '24px', width: '200px', background: 'rgba(0,0,0,0.08)', marginBottom: '2rem' }} />
            </div>
        </div>
    )
}