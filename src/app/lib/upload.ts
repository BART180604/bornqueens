import sharp from "sharp"
import crypto from "crypto"
import path from "path"
import { v2 as cloudinary } from "cloudinary"

// ─────────────────────────────────────────
// CONFIGURATION CLOUDINARY
// ─────────────────────────────────────────

cloudinary.config({
    cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
    api_key:     process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRET,
})

// ─────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────

const SIZES = {
    full:   { width: 1920, height: 1080, quality: 85 },
    thumbs: { width: 600,  height: 600,  quality: 80 },
    avatar: { width: 200,  height: 200,  quality: 85 },
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export interface UploadResult {
    filename:     string
    path:         string
    thumbPath:    string
    width:        number
    height:       number
    size:         number
    originalSize: number
}

interface UploadError {
    field:   string
    message: string
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

export function validateUpload(file: File): UploadError | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return { field: file.name, message: `Format non pris en charge : ${file.type}` }
    }
    if (file.size > MAX_FILE_SIZE) {
        return { field: file.name, message: `Fichier trop volumineux : max 10MB` }
    }
    return null
}

function generateFilename(originalName: string): string {
    const timestamp = Date.now()
    const random    = crypto.randomBytes(6).toString('hex')
    const ext       = path.extname(originalName).toLowerCase()
    const base      = path.basename(originalName, ext)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30)
    return `${base}-${timestamp}-${random}`
}

// Upload un buffer vers Cloudinary
async function uploadToCloudinary(
    buffer: Buffer,
    folder: string,
    publicId: string
): Promise<{ url: string; width: number; height: number; bytes: number }> {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder,
                public_id:      publicId,
                resource_type:  'image',
                format:         'webp',
                overwrite:      true,
            },
            (error, result) => {
                if (error || !result) return reject(error)
                resolve({
                    url:    result.secure_url,
                    width:  result.width,
                    height: result.height,
                    bytes:  result.bytes,
                })
            }
        ).end(buffer)
    })
}

// ─────────────────────────────────────────
// TRAITEMENT — Photo de publication
// ─────────────────────────────────────────

export async function processPostImage(file: File): Promise<UploadResult> {
    const filename     = generateFilename(file.name)
    const buffer       = Buffer.from(await file.arrayBuffer())
    const originalSize = buffer.length

    // Traitement Sharp — image principale
    const fullBuffer = await sharp(buffer)
        .rotate()
        .resize(SIZES.full.width, SIZES.full.height, {
            fit:               'inside',
            withoutEnlargement: true,
        })
        .webp({ quality: SIZES.full.quality })
        .toBuffer()

    // Traitement Sharp — miniature
    const thumbBuffer = await sharp(buffer)
        .rotate()
        .resize(SIZES.thumbs.width, SIZES.thumbs.height, {
            fit:      'cover',
            position: 'centre',
        })
        .webp({ quality: SIZES.thumbs.quality })
        .toBuffer()

    // Upload vers Cloudinary en parallèle
    const [fullResult, thumbResult] = await Promise.all([
        uploadToCloudinary(fullBuffer,  'bornqueens/posts',       filename),
        uploadToCloudinary(thumbBuffer, 'bornqueens/thumbnails',  `${filename}_thumb`),
    ])

    return {
        filename,
        path:         fullResult.url,
        thumbPath:    thumbResult.url,
        width:        fullResult.width,
        height:       fullResult.height,
        size:         fullResult.bytes,
        originalSize,
    }
}

// ─────────────────────────────────────────
// TRAITEMENT — Avatar
// ─────────────────────────────────────────

export async function processAvatarImage(file: File): Promise<{ path: string; size: number }> {
    const filename = generateFilename(file.name)
    const buffer   = Buffer.from(await file.arrayBuffer())

    const avatarBuffer = await sharp(buffer)
        .rotate()
        .resize(SIZES.avatar.width, SIZES.avatar.height, {
            fit:      'cover',
            position: 'centre',
        })
        .webp({ quality: SIZES.avatar.quality })
        .toBuffer()

    const result = await uploadToCloudinary(avatarBuffer, 'bornqueens/avatars', filename)

    return {
        path: result.url,
        size: result.bytes,
    }
}

// ─────────────────────────────────────────
// SUPPRESSION
// ─────────────────────────────────────────

export async function deleteImage(imagePath: string): Promise<void> {
    try {
        // Extraire le public_id depuis l'URL Cloudinary
        // URL format: https://res.cloudinary.com/cloud/image/upload/v123/bornqueens/posts/filename.webp
        const match = imagePath.match(/bornqueens\/[^.]+/)
        if (!match) return

        await cloudinary.uploader.destroy(match[0])

        // Supprimer aussi la miniature si c'est une photo de post
        if (imagePath.includes('/posts/') && !imagePath.includes('_thumb')) {
            const thumbMatch = imagePath.match(/bornqueens\/posts\/([^.]+)/)
            if (thumbMatch) {
                await cloudinary.uploader.destroy(`bornqueens/thumbnails/${thumbMatch[1]}_thumb`)
            }
        }
    } catch (error) {
        console.warn('[DELETE IMAGE]', error)
    }
}

// ─────────────────────────────────────────
// UTILITAIRE
// ─────────────────────────────────────────

export function compressionSummary(result: UploadResult): string {
    const ratio      = ((1 - result.size / result.originalSize) * 100).toFixed(1)
    const originalKB = (result.originalSize / 1024).toFixed(0)
    const finalKB    = (result.size / 1024).toFixed(0)
    return `${originalKB}KB → ${finalKB}KB (${ratio}%)`
}

// Garde la compatibilité — n'est plus nécessaire mais évite les erreurs d'import
export async function CreateUPloadDir(): Promise<void> {}
export const UPLOAD_DIRS = { posts: '', thumbnails: '', avatars: '' }