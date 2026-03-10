'use client'
// src/components/dashboard/ImageUploader.tsx
// Composant d'upload multiple avec preview et drag & drop

import { useState, useCallback, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface UploadedPhoto {
  filename: string
  path: string
  thumbPath: string
  width: number
  height: number
  size: number
  // Métadonnées additionnelles renseignées par l'utilisateur
  caption?: string
  alt?: string
  photographerName?: string
  modelName?: string
}

interface PreviewFile {
  id: string
  file: File
  preview: string    // URL.createObjectURL
  status: 'pending' | 'uploading' | 'done' | 'error'
  result?: UploadedPhoto
  error?: string
}

interface ImageUploaderProps {
  onUploadComplete: (photos: UploadedPhoto[]) => void
  maxFiles?: number
}

// ─────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────

export default function ImageUploader({
  onUploadComplete,
  maxFiles = 20,
}: ImageUploaderProps) {
  const { token } = useAuth()
  const [previews, setPreviews] = useState<PreviewFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Ajouter des fichiers à la liste ──
  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const remaining = maxFiles - previews.length
    const toAdd = fileArray.slice(0, remaining)

    const newPreviews: PreviewFile[] = toAdd.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
    }))

    setPreviews(prev => [...prev, ...newPreviews])
  }, [previews.length, maxFiles])

  // ── Drag & Drop ──
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  // ── Réordonner les photos (drag interne) ──
  const movePhoto = (fromIndex: number, toIndex: number) => {
    setPreviews(prev => {
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      return updated
    })
  }

  // ── Supprimer une photo de la liste ──
  const removePhoto = (id: string) => {
    setPreviews(prev => {
      const target = prev.find(p => p.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter(p => p.id !== id)
    })
  }

  // ── Mettre à jour les métadonnées ──
  const updateMeta = (id: string, field: keyof UploadedPhoto, value: string) => {
    setPreviews(prev => prev.map(p =>
      p.id === id
        ? { ...p, result: { ...p.result!, [field]: value } }
        : p
    ))
  }

  // ── Upload vers l'API ──
  const handleUpload = async () => {
    const pendingFiles = previews.filter(p => p.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    // Marquer tous les fichiers comme "en cours"
    setPreviews(prev => prev.map(p =>
      p.status === 'pending' ? { ...p, status: 'uploading' } : p
    ))

    try {
      const formData = new FormData()
      formData.append('type', 'post')
      pendingFiles.forEach(p => formData.append('files', p.file))

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json()

      if (!data.success) {
        // Marquer tous comme erreur
        setPreviews(prev => prev.map(p =>
          p.status === 'uploading'
            ? { ...p, status: 'error', error: data.message }
            : p
        ))
        return
      }

      // Associer les résultats aux previews
      setPreviews(prev => {
        const uploadingFiles = prev.filter(p => p.status === 'uploading')
        return prev.map(p => {
          if (p.status !== 'uploading') return p
          const index = uploadingFiles.indexOf(p)
          const result = data.files[index]
          return result
            ? { ...p, status: 'done', result }
            : { ...p, status: 'error', error: 'Résultat manquant' }
        })
      })

      // Notifier le parent
      const uploaded = data.files as UploadedPhoto[]
      onUploadComplete(uploaded)

    } catch (error) {
      setPreviews(prev => prev.map(p =>
        p.status === 'uploading'
          ? { ...p, status: 'error', error: 'Erreur réseau' }
          : p
      ))
    } finally {
      setIsUploading(false)
    }
  }

  const pendingCount = previews.filter(p => p.status === 'pending').length
  const doneCount = previews.filter(p => p.status === 'done').length

  return (
    <div className="space-y-4">

      {/* Zone de drop */}
      {previews.length < maxFiles && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-[#8B1A4A] bg-[#F9EFF4] scale-[1.01]'
              : 'border-gray-300 hover:border-[#8B1A4A] hover:bg-gray-50'
            }
          `}
        >
          <div className="text-4xl mb-3">📸</div>
          <p className="text-gray-700 font-medium">
            Glissez vos photos ici ou <span className="text-[#8B1A4A] underline">cliquez pour sélectionner</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">
            JPG, PNG, WebP — max 10MB par photo — {previews.length}/{maxFiles} photos
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
        </div>
      )}

      {/* Grille de previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previews.map((preview, index) => (
            <div key={preview.id} className="relative group rounded-lg overflow-hidden border border-gray-200">

              {/* Image */}
              <div className="aspect-square relative">
                <img
                  src={preview.preview}
                  alt=""
                  className="w-full h-full object-cover"
                />

                {/* Overlay statut */}
                {preview.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {preview.status === 'done' && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                )}
                {preview.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <span className="text-2xl">❌</span>
                  </div>
                )}

                {/* Badge couverture */}
                {index === 0 && (
                  <span className="absolute top-1 left-1 bg-[#8B1A4A] text-white text-xs px-2 py-0.5 rounded-full">
                    Couverture
                  </span>
                )}

                {/* Bouton supprimer */}
                {preview.status !== 'uploading' && (
                  <button
                    onClick={() => removePhoto(preview.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Légende */}
              <div className="p-2 bg-white">
                <input
                  type="text"
                  placeholder="Légende..."
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#8B1A4A]"
                  onChange={e => updateMeta(preview.id, 'caption', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bouton d'upload */}
      {pendingCount > 0 && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full py-3 bg-[#8B1A4A] text-white rounded-xl font-medium
                     hover:bg-[#6d1439] disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {isUploading
            ? 'Traitement en cours...'
            : `Uploader ${pendingCount} photo${pendingCount > 1 ? 's' : ''}`
          }
        </button>
      )}

      {/* Résumé */}
      {doneCount > 0 && (
        <p className="text-sm text-green-600 text-center">
          ✅ {doneCount} photo{doneCount > 1 ? 's' : ''} uploadée{doneCount > 1 ? 's' : ''} avec succès
        </p>
      )}
    </div>
  )
}