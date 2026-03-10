'use client'
// src/app/(auth)/register/page.tsx
// Page d'inscription

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { useAuth }             from '@/app/hooks/useAuth'

// ─────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────


function validateForm(data: {
  username: string; email: string; password: string; confirm: string
}): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!data.username.trim()) {
    errors.username = 'Le nom d\'utilisateur est requis'
  } else if (data.username.length < 3) {
    errors.username = 'Minimum 3 caractères'
  } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
    errors.username = 'Uniquement lettres, chiffres et underscores'
  }

  if (!data.email.trim()) {
    errors.email = 'L\'adresse email est requise'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Adresse email invalide'
  }

  if (!data.password) {
    errors.password = 'Le mot de passe est requis'
  } else if (data.password.length < 8) {
    errors.password = 'Minimum 8 caractères'
  } else if (!/[A-Z]/.test(data.password)) {
    errors.password = 'Au moins une majuscule'
  } else if (!/[0-9]/.test(data.password)) {
    errors.password = 'Au moins un chiffre'
  }

  if (!data.confirm) {
    errors.confirm = 'Confirmez votre mot de passe'
  } else if (data.confirm !== data.password) {
    errors.confirm = 'Les mots de passe ne correspondent pas'
  }

  return errors
}

// ─────────────────────────────────────────
// INDICATEUR DE FORCE DU MOT DE PASSE
// ─────────────────────────────────────────

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: 'transparent' }
  let score = 0
  if (password.length >= 8)              score++
  if (password.length >= 12)             score++
  if (/[A-Z]/.test(password))           score++
  if (/[0-9]/.test(password))           score++
  if (/[^a-zA-Z0-9]/.test(password))    score++

  if (score <= 2) return { score, label: 'Faible',    color: '#DC2626' }
  if (score <= 3) return { score, label: 'Moyen',     color: '#D97706' }
  if (score <= 4) return { score, label: 'Fort',      color: '#059669' }
  return           { score, label: 'Très fort',  color: '#047857' }
}

// ─────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const { register, isAuthenticated, isLoading } = useAuth()

  const [form, setForm] = useState({
    username:    '',
    displayName: '',
    email:       '',
    password:    '',
    confirm:     '',
  })
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors,      setErrors]      = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [globalError, setGlobalError]  = useState<string | null>(null)

  const strength = getPasswordStrength(form.password)

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/')
  }, [isAuthenticated, isLoading, router])

  function setField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    // Effacer l'erreur du champ modifié
    if (errors[key]) setErrors(prev => { const e = { ...prev }; delete e[key]; return e })
    if (globalError) setGlobalError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validationErrors = validateForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setGlobalError(null)

    try {
      const result = await register({
        username:    form.username.trim(),
        displayName: form.displayName.trim() ,
        email:       form.email.trim(),
        password:    form.password,
      })

      if (result.success) {
        router.push('/?welcome=1')
      } else {
        // Erreurs de validation serveur (ex : email déjà pris)
        if (result.field) {
          setErrors({ [result.field]: result.message })
        } else {
          setGlobalError(result.message)
        }
      }
    } catch {
      setGlobalError('Erreur de connexion — réessayez')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Panneau gauche — visuel */}
      <div style={{
        flex: '0 0 40%',
        background: 'linear-gradient(160deg, #0D0A0B 0%, #1A0F13 40%, #2D0A1A 100%)',
        padding: 'clamp(2rem, 5vw, 5rem)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }} className="auth-panel-left">

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 600, color: 'var(--clr-bordeaux)', margin: 0 }}>
            Born Queens
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clr-or)', margin: '4px 0 0' }}>
            Histoire & Tresses Africaines
          </p>
        </Link>

        {/* Texte central */}
        <div>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
            fontWeight: 300, color: 'var(--clr-creme)',
            lineHeight: 1.2, marginBottom: '1.5rem',
          }}>
            Rejoignez notre<br />
            <em style={{ fontStyle: 'italic', color: 'var(--clr-or)' }}>
              communauté culturelle
            </em>
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'rgba(245,237,224,0.55)',
            lineHeight: 1.8, maxWidth: '320px',
          }}>
            Likez, commentez, sauvegardez vos publications préférées
            et participez à la valorisation du patrimoine africain.
          </p>

          {/* Avantages */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '2rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              'Accès à toutes les publications',
              'Likes et commentaires',
              'Sauvegarder vos favoris',
              'Profil personnalisé',
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'var(--clr-or)', fontSize: '0.7rem' }}>✦</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'rgba(245,237,224,0.6)' }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(212,168,67,0.4)' }}>
          ✦ Culture · Art · Histoire ✦
        </p>
      </div>

      {/* Panneau droit — formulaire */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(2rem, 5vw, 4rem)',
        background: 'var(--clr-creme-light)',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          {/* En-tête */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--clr-noir)', marginBottom: '0.5rem' }}>
              Créer un compte
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--clr-gris)' }}>
              Déjà membre ?{' '}
              <Link href="/login" style={{ color: 'var(--clr-bordeaux)', textDecoration: 'none', fontWeight: 500 }}>
                Se connecter
              </Link>
            </p>
          </div>

          {/* Erreur globale */}
          {globalError && (
            <div style={{ padding: '0.875rem 1rem', background: '#FEE2E2', border: '1px solid #FCA5A5', borderLeft: '3px solid #DC2626', marginBottom: '1.5rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: '#991B1B' }}>
              {globalError}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Ligne : Nom d'utilisateur + Prénom affiché */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <div>
                <label style={labelStyle}>Nom d&apos;utilisateur *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setField('username', e.target.value)}
                  placeholder="queen_ndiamel"
                  autoComplete="username"
                  autoFocus
                  style={inputStyle(!!errors.username)}
                  onFocus={e => { e.target.style.borderColor = 'var(--clr-bordeaux)' }}
                  onBlur={e  => { e.target.style.borderColor = errors.username ? '#FCA5A5' : 'rgba(0,0,0,0.15)' }}
                />
                {errors.username && <FieldError msg={errors.username} />}
                {!errors.username && form.username && !/^[a-zA-Z0-9_]+$/.test(form.username) && (
                  <FieldError msg="Uniquement lettres, chiffres et _" />
                )}
              </div>
              <div>
                <label style={labelStyle}>Prénom affiché <span style={{ color: 'var(--clr-gris)', fontWeight: 400 }}>(optionnel)</span></label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={e => setField('displayName', e.target.value)}
                  placeholder="Ndiamelette"
                  style={inputStyle(false)}
                  onFocus={e => { e.target.style.borderColor = 'var(--clr-bordeaux)' }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.15)' }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Adresse email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                placeholder="votre@email.com"
                autoComplete="email"
                style={inputStyle(!!errors.email)}
                onFocus={e => { e.target.style.borderColor = 'var(--clr-bordeaux)' }}
                onBlur={e  => { e.target.style.borderColor = errors.email ? '#FCA5A5' : 'rgba(0,0,0,0.15)' }}
              />
              {errors.email && <FieldError msg={errors.email} />}
            </div>

            {/* Mot de passe */}
            <div>
              <label style={labelStyle}>Mot de passe *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setField('password', e.target.value)}
                  placeholder="Minimum 8 caractères"
                  autoComplete="new-password"
                  style={{ ...inputStyle(!!errors.password), paddingRight: '3rem' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--clr-bordeaux)' }}
                  onBlur={e  => { e.target.style.borderColor = errors.password ? '#FCA5A5' : 'rgba(0,0,0,0.15)' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-gris)', fontSize: '0.9rem', padding: 0 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>

              {/* Barre de force */}
              {form.password && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '3px',
                        background: i <= strength.score ? strength.color : 'rgba(0,0,0,0.1)',
                        borderRadius: '2px',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
              {errors.password && <FieldError msg={errors.password} />}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label style={labelStyle}>Confirmer le mot de passe *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={e => setField('confirm', e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={{ ...inputStyle(!!errors.confirm), paddingRight: '3rem' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--clr-bordeaux)' }}
                  onBlur={e  => { e.target.style.borderColor = errors.confirm ? '#FCA5A5' : 'rgba(0,0,0,0.15)' }}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-gris)', fontSize: '0.9rem', padding: 0 }}>
                  {showConfirm ? '🙈' : '👁'}
                </button>
                {/* Icône de correspondance */}
                {form.confirm && !errors.confirm && (
                  <span style={{
                    position: 'absolute', right: '2.5rem', top: '50%', transform: 'translateY(-50%)',
                    color: form.confirm === form.password ? '#059669' : '#DC2626', fontSize: '0.8rem',
                  }}>
                    {form.confirm === form.password ? '✓' : '✗'}
                  </span>
                )}
              </div>
              {errors.confirm && <FieldError msg={errors.confirm} />}
            </div>

            {/* CGU */}
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--clr-gris)', lineHeight: 1.6 }}>
              En créant un compte, vous acceptez nos{' '}
              <Link href="/legal/mentions" style={{ color: 'var(--clr-bordeaux)', textDecoration: 'none' }}>conditions d&apos;utilisation</Link>
              {' '}et notre{' '}
              <Link href="/legal/confidentialite" style={{ color: 'var(--clr-bordeaux)', textDecoration: 'none' }}>politique de confidentialité</Link>.
            </p>

            {/* Bouton */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '0.825rem', opacity: isSubmitting ? 0.7 : 1 }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isSubmitting ? (
                  <>
                    <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                    Création en cours...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </span>
            </button>
          </form>

          {/* Retour */}
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/" style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--clr-gris)', textDecoration: 'none' }}>
              ← Retour au site
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .auth-panel-left { display: none !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: '#DC2626', marginTop: '4px' }}>
      {msg}
    </p>
  )
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

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '0.75rem 1rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  color: 'var(--clr-noir)',
  background: 'white',
  border: `1px solid ${hasError ? '#FCA5A5' : 'rgba(0,0,0,0.15)'}`,
  outline: 'none',
  transition: 'border-color 0.2s',
  borderRadius: 0,
})