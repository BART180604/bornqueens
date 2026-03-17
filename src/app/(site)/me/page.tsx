'use client'
// src/app/(site)/me/page.tsx
// Page profil de l'utilisateur connecté

import React, { useState, useEffect, useRef } from 'react'
import { useRouter }                    from 'next/navigation'
import Link                             from 'next/link'
import { useAuth }                      from '@/app/hooks/useAuth'

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface SavedPost {
  id:    string
  title: string
  slug:  string
  photos: { thumbPath: string; path: string }[]
}

interface UserStats {
  likesCount:     number
  commentsCount:  number
  savedPostsCount: number
}

// ─────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading,refreshUser} = useAuth()

  const [activeTab,   setActiveTab]   = useState<'infos' | 'password' | 'saved'>('infos')
  const [savedPosts,  setSavedPosts]  = useState<SavedPost[]>([])
  const [stats,       setStats]       = useState<UserStats | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // ── Formulaire infos ──
  const [infoForm, setInfoForm] = useState({ displayName: '', bio: '' })
  const [infoSaving,  setInfoSaving]  = useState(false)
  const [infoMessage, setInfoMessage] = useState<{ text: string; ok: boolean } | null>(null)

  // ── Formulaire mot de passe ──
  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' })
  const [showPassFields, setShowPassFields] = useState({ current: false, next: false, confirm: false })
  const [passSaving,  setPassSaving]  = useState(false)
  const [passMessage, setPassMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [passErrors,  setPassErrors]  = useState<Record<string, string>>({})

  // Redirection si non connectée
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login?redirect=/me')
  }, [isLoading, isAuthenticated, router])

  // Préremplir le formulaire dès que user est disponible
  useEffect(() => {
    if (user) {
      setInfoForm({
        displayName: user.displayName || '',
        bio:         user.bio         || '',
      })
    }
  }, [user])

  // Charger les stats et publications sauvegardées
  useEffect(() => {
    if (!token) return

    Promise.all([
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/me/saved', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([meData, savedData]) => {
      if (meData.user) {
        setStats({
          likesCount:      meData.user._count?.likes      || 0,
          commentsCount:   meData.user._count?.comments   || 0,
          savedPostsCount: meData.user._count?.savedPosts || 0,
        })
      }
      if (savedData.success) setSavedPosts(savedData.savedPosts || [])
    }).catch(() => {})
  }, [token])

  // ── Upload avatar ──
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Prévisualisation immédiate
    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)

    const fd = new FormData()
    fd.append('avatar', file)

    try {
      const res  = await fetch('/api/me/avatar', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      })
      const data = await res.json()
      if (data.success) {
        await refreshUser()
        setInfoMessage({ text: 'Photo de profil mise à jour', ok: true })
      } else {
        setAvatarPreview(null)
        setInfoMessage({ text: data.message || 'Erreur lors du téléversement', ok: false })
      }
    } catch {
      setAvatarPreview(null)
      setInfoMessage({ text: 'Erreur réseau', ok: false })
    }
  }

  // ── Sauvegarder les infos ──
  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault()
    setInfoSaving(true)
    setInfoMessage(null)

    try {
      const res  = await fetch('/api/me', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ displayName: infoForm.displayName.trim(), bio: infoForm.bio.trim() }),
      })
      const data = await res.json()

      if (data.success) {
        await refreshUser()
        setInfoMessage({ text: 'Profil mis à jour avec succès', ok: true })
      } else {
        setInfoMessage({ text: data.message || 'Erreur lors de la sauvegarde', ok: false })
      }
    } catch {
      setInfoMessage({ text: 'Erreur réseau', ok: false })
    } finally {
      setInfoSaving(false)
    }
  }

  // ── Changer le mot de passe ──
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}

    if (!passForm.current)              errs.current = 'Requis'
    if (!passForm.next)                 errs.next    = 'Requis'
    else if (passForm.next.length < 8)  errs.next    = 'Minimum 8 caractères'
    if (!passForm.confirm)              errs.confirm = 'Requis'
    else if (passForm.confirm !== passForm.next) errs.confirm = 'Les mots de passe ne correspondent pas'

    if (Object.keys(errs).length) { setPassErrors(errs); return }

    setPassSaving(true)
    setPassMessage(null)
    setPassErrors({})

    try {
      const res  = await fetch('/api/me/password', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ currentPassword: passForm.current, newPassword: passForm.next }),
      })
      const data = await res.json()

      if (data.success) {
        setPassForm({ current: '', next: '', confirm: '' })
        setPassMessage({ text: 'Mot de passe modifié avec succès', ok: true })
      } else {
        setPassMessage({ text: data.message || 'Erreur', ok: false })
        if (data.field) setPassErrors({ [data.field]: data.message })
      }
    } catch {
      setPassMessage({ text: 'Erreur réseau', ok: false })
    } finally {
      setPassSaving(false)
    }
  }

  // ── Retirer une publication des favoris ──
  async function handleUnsave(postId: string) {
    await fetch(`/api/posts/${postId}/save`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setSavedPosts(prev => prev.filter(p => p.id !== postId))
  }

  if (isLoading || !user) return null

  const avatarSrc = avatarPreview || user.avatarUrl || null
  const initials  = (user.displayName || user.username || '?')[0].toUpperCase()

  return (
    <main style={{ paddingTop: '6rem', paddingBottom: 'var(--space-section)', background: 'var(--clr-creme-light)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 3rem)' }}>

        {/* ── HEADER PROFIL ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: '2rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid rgba(212,168,67,0.3)',
          marginBottom: '2.5rem',
          flexWrap: 'wrap',
        }}>
          {/* Avatar cliquable */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: '96px', height: '96px', borderRadius: '50%',
                overflow: 'hidden', cursor: 'pointer',
                border: '3px solid var(--clr-or)',
                position: 'relative',
              }}
              onClick={() => avatarInputRef.current?.click()}
              title="Changer la photo"
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background: 'var(--clr-bordeaux)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: '2.5rem',
                  color: 'white',
                }}>
                  {initials}
                </div>
              )}

              {/* Overlay "changer" au hover */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(13,10,11,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s',
                color: 'white', fontSize: '0.65rem',
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.05em',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0' }}
              >
                Changer
              </div>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </div>

          {/* Infos */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--clr-noir)', marginBottom: '0.2rem' }}>
              {user.displayName || user.username}
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--clr-gris)', marginBottom: '0.75rem' }}>
              @{user.username}
              {user.role === 'ADMIN' && (
                <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.5rem', background: 'var(--clr-bordeaux)', color: 'white', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                  ADMIN
                </span>
              )}
            </p>

            {/* Stats */}
            {stats && (
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {[
                  { value: stats.likesCount,     label: 'Likes donnés' },
                  { value: stats.commentsCount,  label: 'Commentaires' },
                  { value: stats.savedPostsCount, label: 'Favoris' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--clr-bordeaux)', lineHeight: 1 }}>
                      {s.value}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'var(--clr-gris)', letterSpacing: '0.05em' }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── ONGLETS ── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: '2rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          {([
            { key: 'infos',    label: 'Mes informations' },
            { key: 'password', label: 'Mot de passe' },
            { key: 'saved',    label: `Favoris ${stats ? `(${stats.savedPostsCount})` : ''}` },
          ] as { key: typeof activeTab; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.75rem 1.5rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? 'var(--clr-bordeaux)' : 'var(--clr-gris)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid var(--clr-bordeaux)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.03em',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CONTENU ONGLET : INFOS ── */}
        {activeTab === 'infos' && (
          <form onSubmit={handleSaveInfo}>
            <div style={{ background: 'white', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', maxWidth: '560px' }}>

              {infoMessage && (
                <div style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', background: infoMessage.ok ? '#D1FAE5' : '#FEE2E2', border: `1px solid ${infoMessage.ok ? '#A7F3D0' : '#FCA5A5'}`, fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: infoMessage.ok ? '#065F46' : '#991B1B' }}>
                  {infoMessage.ok ? '✓ ' : '✕ '}{infoMessage.text}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Username (lecture seule) */}
                <div>
                  <label style={labelStyle}>Nom d&apos;utilisateur</label>
                  <input type="text" value={user.username} disabled
                    style={{ ...inputStyle(false), background: '#F9F9F9', color: 'var(--clr-gris)', cursor: 'not-allowed' }} />
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'var(--clr-gris)', marginTop: '4px' }}>
                    Le nom d&apos;utilisateur ne peut pas être modifié
                  </p>
                </div>

                {/* Email (lecture seule) */}
                <div>
                  <label style={labelStyle}>Adresse email</label>
                  <input type="email" value={user.email} disabled
                    style={{ ...inputStyle(false), background: '#F9F9F9', color: 'var(--clr-gris)', cursor: 'not-allowed' }} />
                </div>

                {/* Prénom affiché */}
                <div>
                  <label style={labelStyle}>Prénom affiché</label>
                  <input
                    type="text"
                    value={infoForm.displayName}
                    onChange={e => setInfoForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Votre prénom public"
                    style={inputStyle(false)}
                    onFocus={e => { e.target.style.borderColor = 'var(--clr-bordeaux)' }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.15)' }}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label style={labelStyle}>Biographie <span style={{ color: 'var(--clr-gris)', fontWeight: 400 }}>(optionnelle)</span></label>
                  <textarea
                    value={infoForm.bio}
                    onChange={e => setInfoForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Quelques mots sur vous..."
                    rows={3}
                    maxLength={300}
                    style={{ ...inputStyle(false), resize: 'vertical' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--clr-bordeaux)' }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.15)' }}
                  />
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'var(--clr-gris)', textAlign: 'right', marginTop: '4px' }}>
                    {infoForm.bio.length}/300
                  </p>
                </div>

                <button type="submit" disabled={infoSaving} className="btn-primary"
                  style={{ alignSelf: 'flex-start', opacity: infoSaving ? 0.7 : 1 }}>
                  <span>{infoSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── CONTENU ONGLET : MOT DE PASSE ── */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword}>
            <div style={{ background: 'white', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', maxWidth: '440px' }}>

              {passMessage && (
                <div style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', background: passMessage.ok ? '#D1FAE5' : '#FEE2E2', border: `1px solid ${passMessage.ok ? '#A7F3D0' : '#FCA5A5'}`, fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: passMessage.ok ? '#065F46' : '#991B1B' }}>
                  {passMessage.ok ? '✓ ' : '✕ '}{passMessage.text}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {([
                  { key: 'current', label: 'Mot de passe actuel',    field: 'current' as const, show: showPassFields.current, placeholder: '••••••••' },
                  { key: 'next',    label: 'Nouveau mot de passe',   field: 'next'    as const, show: showPassFields.next,    placeholder: 'Minimum 8 caractères' },
                  { key: 'confirm', label: 'Confirmer le nouveau',   field: 'confirm' as const, show: showPassFields.confirm,  placeholder: '••••••••' },
                ]).map(field => (
                  <div key={field.key}>
                    <label style={labelStyle}>{field.label}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={field.show ? 'text' : 'password'}
                        value={passForm[field.field]}
                        onChange={e => {
                          setPassForm(prev => ({ ...prev, [field.field]: e.target.value }))
                          if (passErrors[field.field]) setPassErrors(prev => { const e = { ...prev }; delete e[field.field]; return e })
                        }}
                        placeholder={field.placeholder}
                        style={{ ...inputStyle(!!passErrors[field.key]), paddingRight: '3rem' }}
                        onFocus={e => { e.target.style.borderColor = 'var(--clr-bordeaux)' }}
                        onBlur={e  => { e.target.style.borderColor = passErrors[field.key] ? '#FCA5A5' : 'rgba(0,0,0,0.15)' }}
                      />
                      <button type="button"
                        onClick={() => setShowPassFields(prev => ({ ...prev, [field.field]: !prev[field.field as keyof typeof prev] }))}
                        style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-gris)', fontSize: '0.9rem', padding: 0 }}>
                        {field.show ? '🙈' : '👁'}
                      </button>
                    </div>
                    {passErrors[field.key] && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: '#DC2626', marginTop: '4px' }}>
                        {passErrors[field.key]}
                      </p>
                    )}
                  </div>
                ))}

                <button type="submit" disabled={passSaving} className="btn-primary"
                  style={{ alignSelf: 'flex-start', opacity: passSaving ? 0.7 : 1 }}>
                  <span>{passSaving ? 'Modification...' : 'Modifier le mot de passe'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── CONTENU ONGLET : FAVORIS ── */}
        {activeTab === 'saved' && (
          <div>
            {savedPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'white', border: '1px dashed rgba(0,0,0,0.1)' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'rgba(0,0,0,0.2)', marginBottom: '0.75rem' }}>♡</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--clr-gris)', marginBottom: '1.5rem' }}>
                  Vous n&apos;avez pas encore de publications sauvegardées
                </p>
                <Link href="/posts" className="btn-primary">
                  <span>Explorer la galerie</span>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }} className="saved-grid">
                {savedPosts.map(post => (
                  <div key={post.id} style={{ position: 'relative', overflow: 'hidden', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <Link href={`/posts/${post.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                      <div style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
                        {post.photos[0] ? (
                          <img
                            src={post.photos[0].thumbPath || post.photos[0].path}
                            alt={post.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', display: 'block' }}
                            onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.05)' }}
                            onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'var(--clr-deep)' }} />
                        )}
                      </div>
                      <div style={{ padding: '0.875rem 1rem' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--clr-noir)', lineHeight: 1.3 }}>
                          {post.title}
                        </p>
                      </div>
                    </Link>
                    {/* Bouton retirer */}
                    <button
                      onClick={() => handleUnsave(post.id)}
                      title="Retirer des favoris"
                      style={{
                        position: 'absolute', top: '0.5rem', right: '0.5rem',
                        background: 'rgba(13,10,11,0.6)', color: 'white',
                        border: 'none', cursor: 'pointer', width: '28px', height: '28px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', backdropFilter: 'blur(4px)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,0.8)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(13,10,11,0.6)' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) { .saved-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </main>
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