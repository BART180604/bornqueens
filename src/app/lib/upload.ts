import sharp from "sharp";
import fs from "fs/promises"
import { existsSync } from "fs";
import crypto from "crypto"
import path from "path";


//les configurations

//1.1 les dossiers 
const BASE_UPLOAD = path.join(process.cwd(),"public","uploads")

export const UPLOAD_DIRS={
    posts : path.join(BASE_UPLOAD,"posts"),
    thumbnails : path.join(BASE_UPLOAD,"posts","thumbnails"),
    avatars : path.join(BASE_UPLOAD,"avatars")
}

//1.2 les tailles de sorties
const SIZES ={
    //photo principales :tailles maximales
    full :{width:1920, height : 1080, quality:85},
    //les miniatures
    thumbs:{width:600,height:600,quality:80},
    //les avatars
    avatar:{width:200,height:200,quality:85}
}

//1.3 les types mimes accepté , et tailles max
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

//2.. les type 

export interface UploadResult {
    filename:string,
    path:string,
    thumbPath:string,
    width:number,
    height:number,
    size:number,
    originalSize:number
}

interface UploadError{
    field:string
    message:string
}

//2.1 Créer les dossiers si inexistant

export async function CreateUPloadDir():Promise<void>{
    for(const dir of Object.values(UPLOAD_DIRS)){
        if(!existsSync(dir)){
            await fs.mkdir(dir,{recursive:true})

        }
        console.log(`Dossier créer: ${dir}`)
    }
}

//2.2 validation
export function validateUpload(file:File): UploadError | null {

    //si le type est non pris en charge
    if(!ALLOWED_TYPES.includes(file.type)){
        return {
            field:file.name,
            message:`Format de fichier non pris en charge :${file.type}`
        }
    }

    //si la taile du fichier excède la taille maximal 
    if(file.size > MAX_FILE_SIZE){
        return {
            field:file.name,
            message: `La taille de ${file.name} excède celle definis: ${MAX_FILE_SIZE} `
        }
    }
    return null
}

//2.3 Géneration d'un nom de fichier unique
function generateFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(6).toString('hex')
  const ext = path.extname(originalName).toLowerCase()
  const base = path.basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 30)

  return `${base}-${timestamp}-${random}`
}

// TRAITEMENT — Photo de publication
// ─────────────────────────────────────────

export async function processPostImage(file: File): Promise<UploadResult> {
  await CreateUPloadDir()

  const filename = generateFilename(file.name)
  const buffer = Buffer.from(await file.arrayBuffer())
  const originalSize = buffer.length

  // Chemins de sortie
  const fullPath = path.join(UPLOAD_DIRS.posts, `${filename}.webp`)
  const thumbPath = path.join(UPLOAD_DIRS.thumbnails, `${filename}.webp`)

  // ── Image principale ──
  // On utilise `inside` pour respecter les proportions sans recadrage forcé
  const fullInfo = await sharp(buffer)
    .rotate()                         // Respecter l'EXIF orientation
    .resize(SIZES.full.width, SIZES.full.height, {
      fit: 'inside',                  // Ne pas agrandir si plus petit
      withoutEnlargement: true,
    })
    .webp({ quality: SIZES.full.quality })
    .toFile(fullPath)

  // ── Miniature carrée ──
  // `cover` + gravity center pour un recadrage centré propre
  await sharp(buffer)
    .rotate()
    .resize(SIZES.thumbs.width, SIZES.thumbs.height, {
      fit: 'cover',
      position: 'centre',
    })
    .webp({ quality: SIZES.thumbs.quality })
    .toFile(thumbPath)

  return {
    filename,
    path: `/uploads/posts/${filename}.webp`,
    thumbPath: `/uploads/posts/thumbnails/${filename}.webp`,
    width: fullInfo.width ?? 0,
    height: fullInfo.height ?? 0,
    size: fullInfo.size,
    originalSize,
  }
}

export async function processAvatarImage(file: File): Promise<{ path: string; size: number }> {
  await CreateUPloadDir()

  const filename = generateFilename(file.name)
  const buffer = Buffer.from(await file.arrayBuffer())
  const avatarPath = path.join(UPLOAD_DIRS.avatars, `${filename}.webp`)

  await sharp(buffer)
    .rotate()
    .resize(SIZES.avatar.width, SIZES.avatar.height, {
      fit: 'cover',
      position: 'centre',
    })
    .webp({ quality: SIZES.avatar.quality })
    .toFile(avatarPath)

  return {
    path: `/uploads/avatars/${filename}.webp`,
    size: SIZES.avatar.width,
  }
}

//suppression des images

export async function deleteImage(imagePath:string):Promise<void>{

    try {
        //supression de l'image principale
        const fullPath = path.join(process.cwd(),"public",imagePath)
        if(existsSync(fullPath )) await fs.unlink(fullPath)
        
        //suppression de la miniature
        const thumbPath = fullPath.replace("/posts/","/posts/thumbnails/")
        if(existsSync(thumbPath)) await fs.unlink(thumbPath)
    } catch (error) {
        console.warn("[DELETE IMAGE]",error)
    }
}

// UTILITAIRE — Résumé de compression
// ─────────────────────────────────────────

export function compressionSummary(result: UploadResult): string {
  const ratio = ((1 - result.size / result.originalSize) * 100).toFixed(1)
  const originalKB = (result.originalSize / 1024).toFixed(0)
  const finalKB = (result.size / 1024).toFixed(0)
  return `${originalKB}KB → ${finalKB}KB (${ratio}%)`
}
