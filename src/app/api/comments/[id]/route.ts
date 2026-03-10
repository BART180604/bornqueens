import { NextRequest,NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { selectAuthor } from "../../posts/[id]/comment/route";

type Params = { params: { id: string } }

//PUT modifier un commentaire

export async function PUT(request:NextRequest, {params}:Params){
    try {
        // recuper le requérent
        const user = await getCurrentUser(request)
        if(!user){return NextResponse.json({success:false, message:"utilisateur non authentifié"}),{status:401}}
        //recupérer le comentaire en question
        const comment = await prisma.comment.findFirst({
            where:{id:params.id}

        })
        if(!comment){
            return NextResponse.json({success:false, message:"Commentaire introuvable"},{status:404})
        }
        //seul l'auteur peut modifier son commentaire
        if(comment.authorId!==user.userId){
            return NextResponse.json({success:false, message:"Vous n'êtes pas autorisé à effectuer cette action"})
        }

        const {content} = await request.json()
        if(!content?.trim()){
            return NextResponse.json({success:false, message:"Le contenu du message est requis"})
        }
        if(content.trim().length>2000){
            return NextResponse.json({success:false,message:"Le contenu ne peut excéder les 2000 caractères "})
        }

        //après modif repassé en modération sauf admin
        const updated= await prisma.comment.update({
            where:{id:params.id},
            data:{
                content: content.trim(),
                isApproved:isAdmin(user),

            },
            include:{author:selectAuthor}
        })
        return NextResponse.json({
            success:true,
            message:isAdmin(user)?"Commentaire modifié" : "Commentaire modifié - en attente de modération",
            comment : updated

        })
    } catch (error) {
        console.error("[PUT COMMENT]",error)
        return NextResponse.json({success:false,message:"Server Error"},{status:500})
    }
}


//delete comment
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const comment = await prisma.comment.findUnique({ where: { id: params.id } })
    if (!comment || comment.isDeleted) {
      return NextResponse.json({ success: false, message: 'Commentaire introuvable' }, { status: 404 })
    }

    // L'auteur ou un admin peut supprimer
    if (comment.authorId !== user.userId && !isAdmin(user)) {
      return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 })
    }

    // Soft delete — on garde la ligne pour ne pas briser les réponses imbriquées
    await prisma.comment.update({
      where: { id: params.id },
      data:  { isDeleted: true, content: '[Commentaire supprimé]' }
    })

    return NextResponse.json({ success: true, message: 'Commentaire supprimé' })

  } catch (error) {
    console.error('[DELETE COMMENT]', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
