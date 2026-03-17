'use client'
// src/components/dashboard/PostForm.tsx
// Formulaire complet de création / édition d'une publication

import React, { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import { useAuth }             from '@/app/hooks/useAuth'
import ImageUploader           from '@/app/components/dashboard/ImageUploader'

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface Category { id: string; name: string; slug: string }
interface Tag      { id: string; name: string; slug: string }

interface UploadedPhoto {
  filename: string; path: string; thumbPath: string
  width: number; height: number; size: number
  caption?: string; alt?: string
  photographerName?: string; modelName?: string
}

interface PostFormData {
  title:       string
  excerpt:     string
  content:     string
  region:      string
  period:      string
  status:      'DRAFT' | 'PUBLISHED'
  coverIndex:  number
  categoryIds: string[]
  tagNames:    string[]
  photos:      UploadedPhoto[]
}

interface PostFormProps {
  post?: {
    id:      string
    title:   string
    excerpt: string | null
    content: string
    region:  string | null
    period:  string | null
    status:  string
    coverIndex: number
    photos:  UploadedPhoto[]
    categories: { id: string }[]
    tags:    { name: string }[]
  }
}

// ─────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────

export default function PostForm({ post }: Readonly<PostFormProps>) {
  const router      = useRouter()
  const { token, user } = useAuth()
  const redirectPath = user?.role === 'ADMIN' ? '/dashboard/posts' : '/studio/posts'
  const isEditing   = !!post

  const [categories,   setCategories]   = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors,       setErrors]       = useState<Record<string, string>>({})
  const [tagInput,     setTagInput]     = useState('')
  const [saveStatus,   setSaveStatus]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const [form, setForm] = useState<PostFormData>({
    title:       post?.title       || '',
    excerpt:     post?.excerpt     || '',
    content:     post?.content     || '',
    region:      post?.region      || '',
    period:      post?.period      || '',
    status:      (post?.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
    coverIndex:  post?.coverIndex  ?? 0,
    categoryIds: post?.categories.map(c => c.id) || [],
    tagNames:    post?.tags.map(t => t.name)      || [],
    photos:      post?.photos      || [],
  })

  useEffect(() => {
    fetch('/api/categories')
        .then(r => r.json())
        .then(d => { if (d.success) setCategories(d.categories) })
        .catch(() => {})
  }, [])

  function setField<K extends keyof PostFormData>(key: K, value: PostFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => { const e = { ...prev }; delete e[key]; return e })
  }

  function toggleCategory(id: string) {
    setField('categoryIds',
        form.categoryIds.includes(id)
            ? form.categoryIds.filter(c => c !== id)
            : [...form.categoryIds, id]
    )
  }

  function addTag(name: string) {
    const trimmed = name.trim()
    if (!trimmed || form.tagNames.includes(trimmed)) return
    setField('tagNames', [...form.tagNames, trimmed])
    setTagInput('')
  }

  function removeTag(name: string) {
    setField('tagNames', form.tagNames.filter(t => t !== name))
  }

  function handlePhotosUploaded(photos: UploadedPhoto[]) {
    setField('photos', [...form.photos, ...photos])
  }

  function removePhoto(index: number) {
    const updated = form.photos.filter((_, i) => i !== index)
    setField('photos', updated)
    if (form.coverIndex >= updated.length) setField('coverIndex', 0)
  }

  function movePhoto(from: number, to: number) {
    const updated = [...form.photos]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    setField('photos', updated)
  }

  function updatePhoto(index: number, field: 'photographerName' | 'modelName', value: string) {
    const updated = [...form.photos]
    updated[index] = { ...updated[index], [field]: value }
    setField('photos', updated)
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.title.trim())   e.title   = 'Le titre est requis'
    if (!form.content.trim()) e.content = 'Le contenu est requis'
    if (!form.photos.length)  e.photos  = 'Au moins une photo est requise'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function autoSave() {
    if (!form.title.trim() || !form.photos.length || !isEditing) return
    setSaveStatus('saving')
    try {
      await submitForm('DRAFT', true)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
    }
  }

  async function submitForm(statusOverride?: 'DRAFT' | 'PUBLISHED', silent = false) {
    if (!silent && !validate()) return

    const payload = { ...form, status: statusOverride || form.status }
    const method  = isEditing ? 'PUT'  : 'POST'
    const url     = isEditing ? `/api/posts/${post!.id}` : '/api/posts'

    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data
  }

  async function handleSaveDraft() {
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await submitForm('DRAFT')
      router.push(redirectPath)
    } catch (e: any) {
      setErrors({ global: e.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePublish() {
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await submitForm('PUBLISHED')
      router.push(redirectPath)
    } catch (e: any) {
      setErrors({ global: e.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────

  return (
      <div style={{ maxWidth: '1100px' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--clr-noir)' }}>
            {isEditing ? 'Modifier la publication' : 'Nouvelle publication'}
          </h1>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--clr-gris)' }}>
            {saveStatus === 'saving' && '⟳ Sauvegarde...'}
            {saveStatus === 'saved'  && '✓ Sauvegardé'}
            {saveStatus === 'error'  && '✕ Erreur de sauvegarde'}
          </div>
        </div>

        {/* Erreur globale */}
        {errors.global && (
            <div style={{ padding: '1rem', background: '#FEE2E2', border: '1px solid #FCA5A5', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.825rem', color: '#991B1B' }}>
                {errors.global}
              </p>
            </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}
             className="postform-grid">

          {/* ── COLONNE PRINCIPALE ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <FormSection title="Titre *">
              <input
                  type="text"
                  value={form.title}
                  onChange={e => setField('title', e.target.value)}
                  onBlur={autoSave}
                  placeholder="Ex : Les Tresses Fulani — Couronne du Sahel"
                  style={inputStyle(!!errors.title)}
              />
              {errors.title && <FieldError message={errors.title} />}
            </FormSection>

            <FormSection title="Résumé" hint="Texte d'aperçu affiché dans la grille et les partages sociaux">
            <textarea
                value={form.excerpt}
                onChange={e => setField('excerpt', e.target.value)}
                placeholder="2-3 phrases qui donnent envie de lire..."
                rows={3}
                style={{ ...inputStyle(), resize: 'vertical' }}
            />
            </FormSection>

            <FormSection title="Contenu éditorial *" hint="Supporte le Markdown : **gras**, *italique*, ## titre, > citation">
            <textarea
                value={form.content}
                onChange={e => setField('content', e.target.value)}
                placeholder="Racontez l'histoire de cette coiffure, son origine, sa symbolique..."
                rows={16}
                style={{ ...inputStyle(!!errors.content), resize: 'vertical', fontFamily: 'monospace', fontSize: '0.875rem' }}
            />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'var(--clr-gris)' }}>
                {form.content.length} caractères
              </span>
              </div>
              {errors.content && <FieldError message={errors.content} />}
            </FormSection>

            {/* ── GALERIE PHOTOS ── */}
            <FormSection title="Galerie photos *" hint="La première photo est la couverture. Glissez pour réordonner.">
              {form.photos.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1rem' }}>
                    {form.photos.map((photo, i) => (
                        <div key={i} style={{ overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>

                          {/* Miniature */}
                          <div style={{ position: 'relative', aspectRatio: '1/1' }}>
                            <img
                                src={photo.thumbPath || photo.path}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            {/* Badge couverture */}
                            {i === form.coverIndex && (
                                <div style={{
                                  position: 'absolute', bottom: 0, left: 0, right: 0,
                                  background: 'var(--clr-bordeaux)', color: 'white',
                                  fontFamily: 'var(--font-body)', fontSize: '0.55rem',
                                  letterSpacing: '0.1em', textAlign: 'center', padding: '2px',
                                }}>
                                  COUVERTURE
                                </div>
                            )}
                            {/* Bouton définir couverture */}
                            {i !== form.coverIndex && (
                                <button onClick={() => setField('coverIndex', i)} style={{
                                  position: 'absolute', top: '4px', left: '4px',
                                  background: 'rgba(0,0,0,0.6)', color: 'white',
                                  border: 'none', cursor: 'pointer',
                                  fontFamily: 'var(--font-body)', fontSize: '0.55rem',
                                  padding: '2px 6px', letterSpacing: '0.05em',
                                }}>
                                  ☆
                                </button>
                            )}
                            {/* Bouton supprimer */}
                            <button
                                type="button"
                                onClick={() => removePhoto(i)}
                                style={{
                                  position: 'absolute', top: '4px', right: '4px',
                                  background: 'rgba(220,38,38,0.8)', color: 'white',
                                  border: 'none', cursor: 'pointer', width: '22px', height: '22px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.75rem',
                                }}>
                              ✕
                            </button>
                          </div>

                          {/* Champs photographe / modèle */}
                          <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'white' }}>
                            <input
                                type="text"
                                placeholder="Photographe"
                                value={photo.photographerName || ''}
                                onChange={e => updatePhoto(i, 'photographerName', e.target.value)}
                                style={{
                                  width: '100%', boxSizing: 'border-box',
                                  border: '1px solid rgba(0,0,0,0.1)', padding: '3px 6px',
                                  fontFamily: 'var(--font-body)', fontSize: '0.65rem',
                                  color: 'var(--clr-noir)', outline: 'none',
                                  background: 'var(--clr-creme)',
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Modèle"
                                value={photo.modelName || ''}
                                onChange={e => updatePhoto(i, 'modelName', e.target.value)}
                                style={{
                                  width: '100%', boxSizing: 'border-box',
                                  border: '1px solid rgba(0,0,0,0.1)', padding: '3px 6px',
                                  fontFamily: 'var(--font-body)', fontSize: '0.65rem',
                                  color: 'var(--clr-noir)', outline: 'none',
                                  background: 'var(--clr-creme)',
                                }}
                            />
                          </div>

                        </div>
                    ))}
                  </div>
              )}

              <ImageUploader
                  onUploadComplete={handlePhotosUploaded}
                  maxFiles={20 - form.photos.length}
              />
              {errors.photos && <FieldError message={errors.photos} />}
            </FormSection>
          </div>

          {/* ── COLONNE LATÉRALE ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Actions */}
            <div style={{ background: 'white', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', opacity: isSubmitting ? 0.6 : 1 }}
              >
                <span>{isSubmitting ? '...' : isEditing ? '✦ Mettre à jour' : '✦ Publier'}</span>
              </button>
              <button
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="btn-ghost"
                  style={{ width: '100%', justifyContent: 'center' }}
              >
                Sauvegarder le brouillon
              </button>
            </div>

            {/* Infos */}
            <FormSection title="Informations">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>Région</label>
                  <input type="text" value={form.region}
                         onChange={e => setField('region', e.target.value)}
                         placeholder="Ex : Afrique de l'Ouest"
                         style={inputStyle()} />
                </div>
                <div>
                  <label style={labelStyle}>Époque</label>
                  <input type="text" value={form.period}
                         onChange={e => setField('period', e.target.value)}
                         placeholder="Ex : XIXe siècle, Contemporain"
                         style={inputStyle()} />
                </div>
              </div>
            </FormSection>

            {/* Catégories */}
            <FormSection title="Catégories">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {categories.length === 0 && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--clr-gris)', fontStyle: 'italic' }}>
                      Aucune catégorie créée pour l&apos;instant.
                    </p>
                )}
                {categories.map(cat => (
                    <label key={cat.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.625rem',
                      padding: '0.5rem 0.75rem', cursor: 'pointer',
                      background: form.categoryIds.includes(cat.id) ? 'rgba(139,26,74,0.06)' : 'transparent',
                      border: `1px solid ${form.categoryIds.includes(cat.id) ? 'rgba(139,26,74,0.3)' : 'rgba(0,0,0,0.06)'}`,
                      transition: 'all 0.15s',
                    }}>
                      <input
                          type="checkbox"
                          checked={form.categoryIds.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                          style={{ accentColor: 'var(--clr-bordeaux)', width: '14px', height: '14px' }}
                      />
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                        background:'var(--clr-bordeaux)',
                      }} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>
                    {cat.name}
                  </span>
                    </label>
                ))}
              </div>
            </FormSection>

            {/* Tags */}
            <FormSection title="Tags" hint="Appuyer sur Entrée pour ajouter">
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {form.tagNames.map(tag => (
                    <span key={tag} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.2rem 0.6rem',
                      background: 'rgba(139,26,74,0.08)', color: 'var(--clr-bordeaux)',
                      fontFamily: 'var(--font-body)', fontSize: '0.7rem',
                      border: '1px solid rgba(139,26,74,0.2)',
                    }}>
                  #{tag}
                      <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1, fontSize: '0.7rem' }}>✕</button>
                </span>
                ))}
              </div>
              <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) }
                    if (e.key === ',' )    { e.preventDefault(); addTag(tagInput.replace(',', '')) }
                  }}
                  placeholder="Tresses Fulani, Mariage..."
                  style={inputStyle()}
              />
            </FormSection>
          </div>
        </div>

        <style>{`
        @media (max-width: 900px) {
          .postform-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      </div>
  )
}

// ─────────────────────────────────────────
// HELPERS VISUELS
// ─────────────────────────────────────────

function FormSection({ title, hint, children }: Readonly<{ title: string; hint?: string; children: React.ReactNode }>) {
  return (
      <div style={{ background: 'white', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: '0.875rem' }}>
          <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--clr-noir)', display: 'block' }}>
            {title}
          </label>
          {hint && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'var(--clr-gris)', marginTop: '2px' }}>{hint}</p>}
        </div>
        {children}
      </div>
  )
}

function FieldError({ message }: { message: string }) {
  return (
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: '#DC2626', marginTop: '4px' }}>
        {message}
      </p>
  )
}

const inputStyle = (hasError = false): React.CSSProperties => ({
  width: '100%',
  padding: '0.625rem 0.875rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  color: 'var(--clr-noir)',
  background: 'white',
  border: `1px solid ${hasError ? '#FCA5A5' : 'rgba(0,0,0,0.12)'}`,
  outline: 'none',
  transition: 'border-color 0.2s',
  borderRadius: 0,
})

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: '0.7rem',
  fontWeight: 500,
  color: 'var(--clr-gris)',
  letterSpacing: '0.05em',
  marginBottom: '0.375rem',
}