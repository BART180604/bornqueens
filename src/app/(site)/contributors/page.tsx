

// src/app/(site)/contributors/page.tsx
// Page contributeurs — équipe active + appel à rejoindre
export const dynamic = 'force-dynamic'
import { Metadata }  from 'next'
import Link          from 'next/link'
import { prisma }    from '@/app/lib/prisma'

export const metadata: Metadata = {
    title:       'Contributeurs — BornQueens',
    description: 'Découvrez les voix et les regards qui font vivre BornQueens. Photographes, rédacteurs, modèles — rejoignez le mouvement.',
}

// ─────────────────────────────────────────
// DATA
// ─────────────────────────────────────────

async function getContributors() {
    return prisma.user.findMany({
        where: {
            role:     { in: ['CONTRIBUTOR', 'ADMIN'] },
            isActive: true,
            posts:    { some: { status: 'PUBLISHED' } },
        },
        select: {
            id:          true,
            username:    true,
            displayName: true,
            avatarUrl:   true,
            bio:         true,
            _count: { select: { posts: true } },
        },
        orderBy: { createdAt: 'asc' },
    })
}

// ─────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────

export default async function ContributorsPage() {
    const contributors = await getContributors()

    return (
        <main style={{ paddingTop: '5rem' }}>

            {/* ── HERO ── */}
            <section style={{
                maxWidth:  '1400px',
                margin:    '0 auto',
                padding:   '4rem clamp(1rem, 4vw, 3rem) 3rem',
                textAlign: 'center',
            }}>
                <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '1.25rem' }}>
                    ✦ Les voix de BornQueens
                </p>
                <h1 className="title-hero" style={{ color: 'var(--clr-noir)', marginBottom: '1.5rem' }}>
                    Celles & ceux qui<br />font vivre l&apos;histoire
                </h1>
                <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize:   'clamp(1rem, 1.5vw, 1.125rem)',
                    color:      'var(--clr-gris)',
                    lineHeight: 1.8,
                    maxWidth:   '600px',
                    margin:     '0 auto',
                }}>
                    BornQueens est né de regards multiples, de plumes engagées et de mains créatives.
                    Chaque publication est une contribution à la mémoire collective.
                </p>
            </section>

            {/* ── SÉPARATEUR ── */}
            <div style={{
                maxWidth: '120px',
                margin:   '0 auto 4rem',
                height:   '1px',
                background: 'linear-gradient(to right, transparent, var(--clr-or), transparent)',
            }} />

            {/* ── GRILLE CONTRIBUTEURS ── */}
            {contributors.length > 0 ? (
                <section style={{
                    maxWidth: '1400px',
                    margin:   '0 auto',
                    padding:  '0 clamp(1rem, 4vw, 3rem) var(--space-section)',
                }}>
                    <div style={{
                        display:             'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap:                 '2rem',
                    }}>
                        {contributors.map(c => (
                            <ContributorCard key={c.id} contributor={c} />
                        ))}
                    </div>
                </section>
            ) : (
                <section style={{ textAlign: 'center', padding: '4rem', color: 'var(--clr-gris)' }}>
                    <p style={{ fontFamily: 'var(--font-body)' }}>
                        Les premiers contributeurs arrivent bientôt.
                    </p>
                </section>
            )}

            {/* ── APPEL À REJOINDRE ── */}
            <section style={{
                background: 'var(--clr-noir)',
                marginTop:  'var(--space-section)',
                padding:    'clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 3rem)',
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>

                    <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '1.25rem' }}>
                        ✦ Rejoindre le mouvement
                    </p>
                    <h2 className="title-section" style={{ color: 'var(--clr-creme)', marginBottom: '1.5rem' }}>
                        Votre regard a sa place ici
                    </h2>
                    <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize:   '1.0625rem',
                        color:      'rgba(251,247,241,0.7)',
                        lineHeight: 1.85,
                        marginBottom: '3.5rem',
                    }}>
                        BornQueens grandit grâce à des personnes qui croient que la beauté africaine
                        mérite d&apos;être documentée, célébrée et transmise. Que vous soyez devant ou
                        derrière l&apos;objectif, votre contribution compte.
                    </p>

                    {/* Cartes profils */}
                    <div style={{
                        display:             'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap:                 '1.5rem',
                        marginBottom:        '3.5rem',
                    }}>
                        <JoinCard
                            emoji="👑"
                            title="Modèles"
                            description="Vous incarnez la beauté et la culture africaine. Participez à des séances photographiques qui racontent votre histoire."
                        />
                        <JoinCard
                            emoji="📢"
                            title="Promoteurs"
                            description="Vous avez un réseau, une audience, une voix. Aidez BornQueens à atteindre celles qui ont besoin de se voir représentées."
                        />
                    </div>

                    <p style={{
                        fontFamily:   'var(--font-body)',
                        fontSize:     '0.875rem',
                        color:        'rgba(251,247,241,0.5)',
                        marginBottom: '2rem',
                    }}>
                        Photographes et rédacteurs — rejoignez-nous via la création d&apos;un compte contributeur.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/register" className="btn-primary" style={{ textDecoration: 'none' }}>
                            Créer un compte
                        </Link>
                        <a
                            href="mailto:ibatamoussi013@gmail.com"
                            style={{
                                display:       'inline-flex',
                                alignItems:    'center',
                                gap:           '0.5rem',
                                padding:       '0.75rem 1.75rem',
                                fontFamily:    'var(--font-body)',
                                fontSize:      '0.8rem',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color:         'var(--clr-or)',
                                border:        '1px solid rgba(212,168,67,0.4)',
                                textDecoration:'none',
                                transition:    'all 0.3s',
                            }}
                        >
                            Nous contacter
                        </a>
                    </div>
                </div>
            </section>

        </main>
    )
}

// ─────────────────────────────────────────
// SOUS-COMPOSANTS
// ─────────────────────────────────────────

function ContributorCard({ contributor }: {
    contributor: {
        id: string; username: string; displayName: string | null
        avatarUrl: string | null; bio: string | null
        _count: { posts: number }
    }
}) {
    const name = contributor.displayName ?? contributor.username

    return (
        <div style={{
            background: 'white',
            boxShadow:  'var(--shadow-card)',
            padding:    '2rem',
            display:    'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign:  'center',
            gap:        '1rem',
            transition: 'transform 0.2s, box-shadow 0.2s',
        }}

        >
            {/* Avatar */}
            {contributor.avatarUrl ? (
                <img
                    src={contributor.avatarUrl}
                    alt={name}
                    style={{
                        width: '80px', height: '80px',
                        borderRadius: '50%', objectFit: 'cover',
                        border: '2px solid rgba(212,168,67,0.3)',
                    }}
                />
            ) : (
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background:     'var(--clr-bordeaux)',
                    display:        'flex', alignItems: 'center', justifyContent: 'center',
                    color:          'white',
                    fontFamily:     'var(--font-display)',
                    fontSize:       '2rem',
                    border:         '2px solid rgba(212,168,67,0.3)',
                }}>
                    {name[0].toUpperCase()}
                </div>
            )}

            {/* Nom */}
            <div>
                <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize:   '1.3rem',
                    fontWeight: 600,
                    color:      'var(--clr-noir)',
                    marginBottom: '0.25rem',
                }}>
                    {name}
                </p>
                <p style={{
                    fontFamily:    'var(--font-body)',
                    fontSize:      '0.7rem',
                    color:         'var(--clr-or)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                }}>
                    @{contributor.username}
                </p>
            </div>

            {/* Bio */}
            {contributor.bio && (
                <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize:   '0.825rem',
                    color:      'var(--clr-gris)',
                    lineHeight: 1.7,
                }}>
                    {contributor.bio.length > 120
                        ? contributor.bio.substring(0, 120) + '…'
                        : contributor.bio}
                </p>
            )}

            {/* Stats */}
            <div style={{
                marginTop:    'auto',
                paddingTop:   '1rem',
                borderTop:    '1px solid rgba(0,0,0,0.06)',
                width:        '100%',
            }}>
        <span style={{
            fontFamily:    'var(--font-body)',
            fontSize:      '0.7rem',
            color:         'var(--clr-gris)',
            letterSpacing: '0.05em',
        }}>
          {contributor._count.posts} publication{contributor._count.posts > 1 ? 's' : ''}
        </span>
            </div>
        </div>
    )
}

function JoinCard({ emoji, title, description }: {
    emoji: string; title: string; description: string
}) {
    return (
        <div style={{
            background:   'rgba(255,255,255,0.04)',
            border:       '1px solid rgba(212,168,67,0.2)',
            padding:      '2rem 1.5rem',
            textAlign:    'center',
        }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{emoji}</div>
            <p style={{
                fontFamily:   'var(--font-display)',
                fontSize:     '1.2rem',
                color:        'var(--clr-creme)',
                marginBottom: '0.75rem',
            }}>
                {title}
            </p>
            <p style={{
                fontFamily: 'var(--font-body)',
                fontSize:   '0.875rem',
                color:      'rgba(251,247,241,0.6)',
                lineHeight: 1.75,
            }}>
                {description}
            </p>
        </div>
    )
}