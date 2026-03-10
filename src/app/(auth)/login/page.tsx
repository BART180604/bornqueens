'use client'
// src/app/(auth)/login/page.tsx
// Page de connexion

import { useState, useEffect }   from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link                       from 'next/link'
import { useAuth }                from '@/app/hooks/useAuth'

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, isLoading } = useAuth()

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // URL vers laquelle rediriger après connexion (paramètre ?redirect=...)
  const redirectTo = searchParams.get('redirect') || '/'

  // Si déjà connecté → redirect immédiat
  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(redirectTo)
  }, [isAuthenticated, isLoading, router, redirectTo])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await login(email.trim(), password)
      if (result.success) {
        router.push(redirectTo)
      } else {
        setError(result.message)
      }
    } catch {
      setError('Erreur de connexion — réessayez')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return null

  return (
    <div style={pageStyle}>

      {/* Panneau gauche — visuel */}
      <div style={panelLeftStyle} className="auth-panel-left">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <p style={logoStyle}>Born Queens</p>
            <p style={logoSubStyle}>Histoire & Tresses Africaines</p>
          </Link>

          <div style={{ marginTop: '4rem' }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 300,
              color: 'var(--clr-creme)',
              lineHeight: 1.2,
              marginBottom: '1.5rem',
            }}>
              &ldquo;Chaque tresse<br />
              <em style={{ fontStyle: 'italic', color: 'var(--clr-or)' }}>
                raconte une histoire
              </em>&rdquo;
            </p>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'rgba(245,237,224,0.6)',
              lineHeight: 1.7,
              maxWidth: '360px',
            }}>
              Connectez-vous pour liker des publications,
              laisser des commentaires et faire partie
              de notre communauté culturelle.
            </p>
          </div>

          {/* Ornement bas */}
          <div style={{ position: 'absolute', bottom: '3rem', left: 0 }}>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.6rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(212,168,67,0.5)',
            }}>
              ✦ Culture · Art · Histoire ✦
            </p>
          </div>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div style={panelRightStyle}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* En-tête */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 600,
              color: 'var(--clr-noir)',
              marginBottom: '0.5rem',
            }}>
              Connexion
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--clr-gris)',
            }}>
              Pas encore de compte ?{' '}
              <Link href="/register" style={{ color: 'var(--clr-bordeaux)', textDecoration: 'none', fontWeight: 500 }}>
                S&apos;inscrire
              </Link>
            </p>
          </div>

          {/* Message de redirection */}
          {searchParams.get('redirect') && (
            <div style={{
              padding: '0.75rem 1rem',
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              marginBottom: '1.5rem',
              fontFamily: 'var(--font-body)',
              fontSize: '0.775rem',
              color: '#92400E',
            }}>
              Connectez-vous pour accéder à cette page
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div style={{
              padding: '0.875rem 1rem',
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderLeft: '3px solid #DC2626',
              marginBottom: '1.5rem',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              color: '#991B1B',
            }}>
              {error}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Email */}
            <div>
              <label style={labelStyle}>Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null) }}
                placeholder="votre@email.com"
                autoComplete="email"
                autoFocus
                required
                style={inputStyle}
                onFocus={e  => { e.target.style.borderColor = 'var(--clr-bordeaux)' }}
                onBlur={e   => { e.target.style.borderColor = 'rgba(0,0,0,0.15)' }}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Mot de passe</label>
                <Link href="/forgot-password" style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.7rem',
                  color: 'var(--clr-bordeaux)',
                  textDecoration: 'none',
                }}>
                  Mot de passe oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  style={{ ...inputStyle, paddingRight: '3rem' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--clr-bordeaux)' }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.15)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '0.875rem', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--clr-gris)', fontSize: '0.9rem', lineHeight: 1,
                    padding: 0,
                  }}
                  title={showPass ? 'Masquer' : 'Afficher'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Bouton soumettre */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.875rem',
                fontSize: '0.825rem',
                marginTop: '0.5rem',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isSubmitting ? (
                  <>
                    <span style={{
                      width: '14px', height: '14px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                      flexShrink: 0,
                    }} />
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </span>
            </button>
          </form>

          {/* Séparateur */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            margin: '2rem 0',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--clr-gris)', letterSpacing: '0.05em' }}>
              ou
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
          </div>

          {/* Lien inscription */}
          <Link href="/register" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', display: 'flex' }}>
            Créer un compte
          </Link>

          {/* Retour accueil */}
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/" style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              color: 'var(--clr-gris)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}>
              ← Retour au site
            </Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─────────────────────────────────────────
// STYLES PARTAGÉS
// ─────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
}

const panelLeftStyle: React.CSSProperties = {
  flex: '0 0 45%',
  background: `linear-gradient(135deg, var(--clr-noir) 0%, var(--clr-deep) 50%, #2D0A1A 100%)`,
  padding: 'clamp(2rem, 5vw, 5rem)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  position: 'relative',
  overflow: 'hidden',
}

const panelRightStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'clamp(2rem, 5vw, 4rem)',
  background: 'var(--clr-creme-light)',
}

const logoStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.6rem',
  fontWeight: 600,
  color: 'var(--clr-bordeaux)',
  margin: 0,
  letterSpacing: '-0.02em',
}

const logoSubStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.55rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--clr-or)',
  margin: '4px 0 0',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--clr-noir)',
  letterSpacing: '0.03em',
  marginBottom: '0.375rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  color: 'var(--clr-noir)',
  background: 'white',
  border: '1px solid rgba(0,0,0,0.15)',
  outline: 'none',
  transition: 'border-color 0.2s',
  borderRadius: 0,
}