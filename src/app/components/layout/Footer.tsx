"use client"
export default function Footer() {
  return (
    <footer style={{
      background: 'var(--clr-noir)',
      color: 'var(--clr-creme)',
      padding: 'var(--space-section) clamp(1.5rem, 5vw, 5rem) 2rem',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Grille footer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '3rem',
          paddingBottom: '3rem',
          borderBottom: '1px solid rgba(212,168,67,0.2)',
          marginBottom: '2rem',
        }} className="footer-grid">

          {/* Brand */}
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 600,
              color: 'var(--clr-bordeaux)',
              marginBottom: '0.25rem',
            }}>
              Born Queens
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.55rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--clr-or)',
              marginBottom: '1.5rem',
            }}>
              Histoire & Tresses Africaines
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.825rem',
              color: 'rgba(245,237,224,0.5)',
              lineHeight: 1.7,
              maxWidth: '280px',
            }}>
              Chaque tresse est un récit. Nous mettons en lumière l&apos;histoire,
              la beauté et la résilience des coiffures africaines.
            </p>
          </div>

          {/* Navigation */}
          {[
            {
              title: 'Explorer',
              links: [
                { href: '/',             label: 'Accueil' },
                { href: '/posts',        label: 'Galerie' },
                { href: '/contributors', label: 'Contributeurs' },
                { href: '/about',        label: 'À propos' },
              ]
            },
            {
              title: 'Compte',
              links: [
                { href: '/login',    label: 'Connexion' },
                { href: '/register', label: 'Inscription' },
                { href: '/dashboard', label: 'Dashboard' },
              ]
            },
            {
              title: 'Légal',
              links: [
                { href: '/legal/mentions',      label: 'Mentions légales' },
                { href: '/legal/confidentialite', label: 'Confidentialité' },
                { href: '/legal/cookies',       label: 'Cookies' },
                { href: '/contact',             label: 'Contact' },
              ]
            }
          ].map(col => (
            <div key={col.title}>
              <p className="label-category" style={{ color: 'var(--clr-or)', marginBottom: '1.25rem' }}>
                {col.title}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {col.links.map(link => (
                  <li key={link.href}>
                    <a href={link.href} className="footer-link" style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.8rem',
                      color: 'rgba(245,237,224,0.6)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bas du footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem',
        }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.7rem',
            color: 'rgba(245,237,224,0.3)',
          }}>
            © {new Date().getFullYear()} BornQueens. Tous droits réservés.
          </p>
          <p style={{
            fontFamily: 'var(--font-accent)',
            fontStyle: 'italic',
            fontSize: '0.9rem',
            color: 'var(--clr-or)',
            opacity: 0.6,
          }}>
            ✦ L&apos;art ne s&apos;explique pas, il se ressent ✦
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}