'use client'
// src/components/layout/Navbar.tsx

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const pathname = usePathname()

  // Détecter le scroll pour le style transparent → opaque
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fermer le menu mobile sur changement de route
  const closeMenu = () => setMenuOpen(false)

  const navLinks = [
    { href: '/',              label: 'Accueil' },
    { href: '/posts',         label: 'Galerie' },
    { href: '/contributors',  label: 'Contributeurs' },
    { href: '/about',         label: 'À propos' },
  ]

  {navLinks.map(link => (
  <Link key={link.href} href={link.href} onClick={closeMenu}>
    {link.label}
  </Link>
))}

  return (
    <>
      <header
        className={`navbar ${scrolled ? 'scrolled' : ''}`}
        style={{ padding: scrolled ? '0.75rem 0' : '1.5rem 0' }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.6rem',
                  fontWeight: 600,
                  color: 'var(--clr-bordeaux)',
                  letterSpacing: '-0.02em',
                }}>
                  Born Queens
                </span>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.55rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'var(--clr-or)',
                  marginTop: '2px',
                }}>
                  Tressée par l&apos;histoire
                </span>
              </div>
            </Link>

            {/* Navigation desktop */}
            <nav style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}
                 className="hidden-mobile">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: pathname === link.href ? 'var(--clr-bordeaux)' : 'var(--clr-noir)',
                    textDecoration: 'none',
                    position: 'relative',
                    paddingBottom: '4px',
                    transition: 'color 0.3s',
                  }}
                >
                  {link.label}
                  {pathname === link.href && (
                    <span style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: 'var(--clr-or)',
                    }} />
                  )}
                </Link>
              ))}
            </nav>

            {/* Actions droite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                 className="hidden-mobile">
              {isAuthenticated ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {isAdmin && (
                        <Link href="/dashboard" className="btn-ghost" style={{ padding: '0.5rem 1.2rem' }}>
                          <span>Dashboard</span>
                        </Link>
                    )}

                    {/* ← AJOUTER : avatar/lien profil */}
                    <Link href="/me" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {user?.avatarUrl ? (
                          <img
                              src={user.avatarUrl}
                              alt={user.username}
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--clr-or)' }}
                          />
                      ) : (
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: 'var(--clr-bordeaux)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontFamily: 'var(--font-display)', fontSize: '0.9rem',
                            border: '1.5px solid var(--clr-or)',
                          }}>
                            {(user?.displayName || user?.username || '?')[0].toUpperCase()}
                          </div>
                      )}
                      <span style={{
                        fontFamily: 'var(--font-body)', fontSize: '0.75rem',
                        color: pathname === '/me' ? 'var(--clr-bordeaux)' : 'var(--clr-gris)',
                        letterSpacing: '0.05em',
                      }}>
        {user?.displayName || user?.username}


                        {(user?.role === 'CONTRIBUTOR') && (
                            <Link href="/studio" className="btn-ghost" style={{ padding: '0.5rem 1.2rem' }}>
                              <span>Mon Studio</span>
                            </Link>
                        )}
      </span>
                    </Link>

                    <button
                        onClick={logout}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: 'var(--font-body)', fontSize: '0.75rem',
                          color: 'var(--clr-gris)', letterSpacing: '0.08em',
                        }}
                    >
                      Déconnexion
                    </button>
                  </div>
              ) : (
                  <Link href="/login" className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
                    <span>Connexion</span>
                  </Link>
              )}



            </div>

            {/* Burger mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="show-mobile"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                padding: '4px',
              }}
              aria-label="Menu"
            >
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  display: 'block',
                  width: '24px',
                  height: '1.5px',
                  background: 'var(--clr-bordeaux)',
                  transition: 'all 0.3s var(--ease-elegant)',
                  transformOrigin: 'center',
                  transform: menuOpen
                    ? i === 0 ? 'translateY(6.5px) rotate(45deg)'
                    : i === 1 ? 'scaleX(0)'
                    : 'translateY(-6.5px) rotate(-45deg)'
                    : 'none',
                }} />
              ))}
            </button>
          </div>
        </div>
      </header>

      {/* Menu mobile overlay */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--clr-creme-light)',
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem',
          animation: 'fadeIn 0.3s var(--ease-elegant)',
        }}>
          {navLinks.map((link, i) => (
            <Link
              key={link.href}
              onClick={closeMenu}
              href={link.href}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                fontWeight: 300,
                color: pathname === link.href ? 'var(--clr-bordeaux)' : 'var(--clr-noir)',
                textDecoration: 'none',
                animationDelay: `${i * 0.08}s`,
              }}
              className="animate-fade-up"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
              <Link
                  href="/me"
                  onClick={closeMenu}
                  style={{
                    fontFamily: 'var(--font-display)', fontSize: '2.5rem',
                    fontWeight: 300, color: 'var(--clr-bordeaux)', textDecoration: 'none',
                  }}
                  className="animate-fade-up"
              >
                Mon profil
              </Link>


          )}
          {isAuthenticated && (
              <button
                  onClick={() => { logout(); closeMenu() }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                    color: 'var(--clr-gris)', letterSpacing: '0.08em',
                  }}
              >
                Déconnexion
              </button>
          )}

        </div>
      )}

      {/* Styles responsives inlinés */}
      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  )
}