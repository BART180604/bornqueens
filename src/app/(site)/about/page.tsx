// src/app/(site)/about/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'À propos — BornQueens',
    description: 'Un projet photographique narratif célébrant la beauté, l\'identité et la puissance des femmes africaines à travers les coiffures traditionnelles.',
}

export default function AboutPage() {
    return (
        <main style={{ paddingTop: '5rem', background: 'var(--clr-creme-light)' }}>

            {/* ── HERO ÉDITORIAL ── */}
            <section style={{
                maxWidth:    '1400px',
                margin:      '0 auto',
                padding:     '5rem clamp(1rem, 4vw, 3rem) 4rem',
                display:     'grid',
                gridTemplateColumns: '1fr 1fr',
                gap:         'clamp(3rem, 6vw, 7rem)',
                alignItems:  'center',
            }}
                     className="about-hero"
            >
                {/* Texte */}
                <div>
                    <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '1.5rem' }}>
                        ✦ Le projet
                    </p>
                    <h1 style={{
                        fontFamily:  'var(--font-display)',
                        fontSize:    'clamp(3rem, 6vw, 5.5rem)',
                        fontWeight:  600,
                        lineHeight:  1.05,
                        color:       'var(--clr-noir)',
                        marginBottom: '2rem',
                        letterSpacing: '-0.02em',
                    }}>
                        Born<br />
                        <span style={{ color: 'var(--clr-bordeaux)' }}>Queens</span>
                    </h1>
                    <p style={{
                        fontFamily:   'var(--font-accent)',
                        fontSize:     'clamp(1.1rem, 2vw, 1.4rem)',
                        fontStyle:    'italic',
                        color:        'var(--clr-gris)',
                        lineHeight:   1.75,
                        borderLeft:   '3px solid var(--clr-or)',
                        paddingLeft:  '1.5rem',
                    }}>
                        Un projet photographique qui réinterprète les tresses africaines des années 50,
                        à travers une narration visuelle poétique.
                    </p>
                </div>

                {/* Bloc décoratif */}
                <div style={{ position: 'relative', height: '420px' }} className="about-deco">
                    <div style={{
                        position:   'absolute',
                        top:        0,
                        left:       '10%',
                        width:      '75%',
                        height:     '100%',
                        background: 'var(--clr-bordeaux)',
                        opacity:    0.08,
                    }} />
                    <div style={{
                        position:      'absolute',
                        top:           '2rem',
                        left:          0,
                        right:         '2rem',
                        bottom:        '-2rem',
                        border:        '1px solid rgba(212,168,67,0.3)',
                    }} />
                    <div style={{
                        position:       'absolute',
                        inset:          '1rem',
                        display:        'flex',
                        flexDirection:  'column',
                        alignItems:     'center',
                        justifyContent: 'center',
                        gap:            '2rem',
                        padding:        '3rem',
                        background:     'white',
                        boxShadow:      '0 20px 60px rgba(13,10,11,0.08)',
                    }}>
                        <p style={{
                            fontFamily:    'var(--font-display)',
                            fontSize:      '4rem',
                            color:         'var(--clr-or)',
                            lineHeight:    1,
                            opacity:       0.4,
                        }}>✦</p>
                        <p style={{
                            fontFamily:    'var(--font-display)',
                            fontSize:      'clamp(1rem, 2vw, 1.25rem)',
                            color:         'var(--clr-noir)',
                            textAlign:     'center',
                            lineHeight:    1.6,
                            fontWeight:    500,
                        }}>
                            Chaque image raconte une histoire.<br />
                            Chaque tresse, une mémoire.
                        </p>
                        <div style={{ width: '40px', height: '1px', background: 'var(--clr-or)' }} />
                        <p style={{
                            fontFamily:    'var(--font-body)',
                            fontSize:      '0.75rem',
                            color:         'var(--clr-gris)',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            textAlign:     'center',
                        }}>
                            Photographie · Stylisme · Storytelling
                        </p>
                    </div>
                </div>
            </section>

            {/* ── SÉPARATEUR ── */}
            <div style={{
                maxWidth:   '120px',
                margin:     '0 auto',
                height:     '1px',
                background: 'linear-gradient(to right, transparent, var(--clr-or), transparent)',
            }} />

            {/* ── CONCEPT ── */}
            <section style={{
                maxWidth: '1400px',
                margin:   '0 auto',
                padding:  '5rem clamp(1rem, 4vw, 3rem)',
                display:  'grid',
                gridTemplateColumns: '340px 1fr',
                gap:      'clamp(3rem, 6vw, 7rem)',
                alignItems: 'start',
            }}
                     className="about-concept"
            >
                {/* Label latéral */}
                <div style={{ position: 'sticky', top: '7rem' }}>
                    <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '1rem' }}>
                        ✦ Le concept
                    </p>
                    <h2 style={{
                        fontFamily:   'var(--font-display)',
                        fontSize:     'clamp(2rem, 3vw, 2.75rem)',
                        fontWeight:   600,
                        color:        'var(--clr-noir)',
                        lineHeight:   1.15,
                        marginBottom: '1.5rem',
                    }}>
                        Un univers immersif
                    </h2>
                    <div style={{
                        width:      '40px',
                        height:     '2px',
                        background: 'var(--clr-bordeaux)',
                    }} />
                </div>

                {/* Corps */}
                <div style={{ paddingTop: '0.5rem' }}>
                    <p style={{
                        fontFamily:   'var(--font-body)',
                        fontSize:     '1.0625rem',
                        color:        '#2A1F23',
                        lineHeight:   1.9,
                        marginBottom: '2rem',
                    }}>
                        Born Queens mêle <strong>photographie</strong>, <strong>stylisme</strong>, <strong>maquillage</strong>,
                        <strong> coiffure</strong> et <strong>storytelling</strong> pour créer un univers où chaque modèle
                        devient l&apos;héroïne de sa propre histoire. Loin d&apos;un simple catalogue esthétique,
                        chaque série photographique explore une dimension profonde de la féminité africaine.
                    </p>

                    {/* Thèmes */}
                    <div style={{
                        display:             'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap:                 '1rem',
                        marginTop:           '2.5rem',
                    }}>
                        {[
                            { theme: 'Identité',   symbol: '◈' },
                            { theme: 'Quotidien',  symbol: '◈' },
                            { theme: 'Désir',      symbol: '◈' },
                            { theme: 'Amour',      symbol: '◈' },
                            { theme: 'Sororité',   symbol: '◈' },
                            { theme: 'Puissance',  symbol: '◈' },
                        ].map(({ theme, symbol }) => (
                            <div key={theme} style={{
                                padding:    '1.25rem',
                                border:     '1px solid rgba(212,168,67,0.2)',
                                background: 'white',
                                textAlign:  'center',
                            }}>
                                <p style={{
                                    fontFamily:   'var(--font-display)',
                                    fontSize:     '1.5rem',
                                    color:        'var(--clr-or)',
                                    opacity:      0.5,
                                    marginBottom: '0.5rem',
                                }}>
                                    {symbol}
                                </p>
                                <p style={{
                                    fontFamily:    'var(--font-body)',
                                    fontSize:      '0.75rem',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color:         'var(--clr-noir)',
                                    fontWeight:    500,
                                }}>
                                    {theme}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── OBJECTIFS — fond sombre ── */}
            <section style={{
                background: 'var(--clr-noir)',
                padding:    'clamp(4rem, 7vw, 6rem) clamp(1rem, 4vw, 3rem)',
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '1rem' }}>
                            ✦ Notre mission
                        </p>
                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize:   'clamp(2rem, 4vw, 3rem)',
                            color:      'var(--clr-creme)',
                            fontWeight: 600,
                            lineHeight: 1.2,
                        }}>
                            Pourquoi Born Queens existe
                        </h2>
                    </div>

                    <div style={{
                        display:             'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap:                 '1.5px',
                        background:         'rgba(212,168,67,0.15)',
                    }}>
                        {[
                            {
                                number: '01',
                                title:  'Valoriser',
                                text:   'Les coiffures africaines et leur dimension culturelle et artistique, trop longtemps invisibilisées.',
                            },
                            {
                                number: '02',
                                title:  'Célébrer',
                                text:   'La femme africaine dans toutes ses dimensions — identité, émotion, désir, sororité — sans compromis.',
                            },
                            {
                                number: '03',
                                title:  'Inspirer',
                                text:   'Créer une narration visuelle forte, capable d\'émouvoir, de sensibiliser et de laisser une empreinte.',
                            },
                            {
                                number: '04',
                                title:  'Préserver',
                                text:   'Documenter un patrimoine esthétique et culturel à travers l\'art photographique pour les générations futures.',
                            },
                        ].map(obj => (
                            <div key={obj.number} style={{
                                background: 'var(--clr-deep)',
                                padding:    '2.5rem 2rem',
                            }}>
                                <p style={{
                                    fontFamily:    'var(--font-display)',
                                    fontSize:      '3rem',
                                    color:         'var(--clr-or)',
                                    opacity:       0.3,
                                    lineHeight:    1,
                                    marginBottom:  '1.25rem',
                                }}>
                                    {obj.number}
                                </p>
                                <p style={{
                                    fontFamily:   'var(--font-display)',
                                    fontSize:     '1.25rem',
                                    color:        'var(--clr-creme)',
                                    marginBottom: '0.75rem',
                                    fontWeight:   600,
                                }}>
                                    {obj.title}
                                </p>
                                <p style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize:   '0.875rem',
                                    color:      'rgba(251,247,241,0.6)',
                                    lineHeight: 1.8,
                                }}>
                                    {obj.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={{
                maxWidth:  '700px',
                margin:    '0 auto',
                padding:   'clamp(4rem, 7vw, 6rem) clamp(1rem, 4vw, 3rem)',
                textAlign: 'center',
            }}>
                <p style={{
                    fontFamily:   'var(--font-accent)',
                    fontSize:     'clamp(1.1rem, 2vw, 1.35rem)',
                    fontStyle:    'italic',
                    color:        'var(--clr-gris)',
                    lineHeight:   1.8,
                    marginBottom: '3rem',
                }}>
                    « Chaque tresse porte une histoire. Chaque femme, un héritage.
                    Born Queens est le lieu où cet héritage devient visible. »
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/posts" className="btn-primary" style={{ textDecoration: 'none' }}>
                        <span>Explorer la galerie</span>
                    </Link>
                    <Link href="/contributors" className="btn-outline" style={{ textDecoration: 'none' }}>
                        <span>Rejoindre le projet</span>
                    </Link>
                </div>
            </section>

            <style>{`
        @media (max-width: 768px) {
          .about-hero    { grid-template-columns: 1fr !important; }
          .about-deco    { display: none !important; }
          .about-concept { grid-template-columns: 1fr !important; }
          .about-concept > div:first-child { position: static !important; }
        }
      `}</style>

        </main>
    )
}