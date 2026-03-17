import { NextRequest,NextResponse } from "next/server";
import {getCurrentUser, isAdmin, isContributor} from "@/app/lib/auth";
import { processAvatarImage,processPostImage, UploadResult,validateUpload,compressionSummary} from "@/app/lib/upload";

// @ le upload d'image
export async function POST(request:NextRequest){
    try {

        //recuperate l'utilisateur connecté
        const user = getCurrentUser(request)
        if(!user){
            return NextResponse.json({
                success:false,message:"Utilisateur non authentifié"
            },{status:401})
        }
        if(!isContributor(user) && !isAdmin(user)){
            return NextResponse.json({
                success:false,message:"vous ne pouvez effectué cette action"
            },{status:403})
        }

        //tout es OK
        //parser le formData
        const formData = request.formData()
        const type = (await formData).get('type') as string || 'post'
        const files = (await formData).getAll('files') as File[]

        if(!files||files.length===0){
            return NextResponse.json({
                success:false, message:"No files upload"
            },{status:400})
        }

        //limité le nombre de fichier par upload
        const MAX_FILES = type === "avatar" ? 1 : 20
        if(files.length>MAX_FILES){
            return NextResponse.json({
                success:false, message:`Maximum ${MAX_FILES} fichier par upload`
            },{status:400})
        }

        //faire validé chacun des fichiers uploader
        const validationErrors = files.map(file=>validateUpload(file)).filter(Boolean)

        if(validationErrors.length>0){
            return NextResponse.json({
                success:false, message:"Fichiers Invalides",errors:validationErrors
            },{status:400})
        }

        //traiter les images en parallèles
        if(type==="avatar"){
            const result = await processAvatarImage(files[0])
            return NextResponse.json({
                success:true , file:result
            },{status:200})
        }

        //upload des fichiers de publications
        const results : UploadResult[] = await Promise.all(files.map(file=>processPostImage(file)))

        // Log de compression en dev
    if (process.env.NODE_ENV === 'development') {
      results.forEach((r, i) => {
        console.log(`📸 Photo ${i + 1} : ${compressionSummary(r)} — ${r.width}×${r.height}px`)
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: `${results.length} photo(s) uploadée(s) avec succès`,
        files: results.map(r => ({
          filename: r.filename,
          path: r.path,
          thumbPath: r.thumbPath,
          width: r.width,
          height: r.height,
          size: r.size,
        }))
      },
      { status: 201 }
    )
    } catch (error) {
        console.error("[UPLOADS ERROR] ",error)
        return NextResponse.json({
            success:false, message:"erreur lors du traitement des images"
        },{status:500})
    }
}