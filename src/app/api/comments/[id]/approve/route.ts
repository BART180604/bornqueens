import { NextRequest,NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/app/lib/auth';
import {prisma} from "@/app/lib/prisma"

type Params= {params:Promise<{id:string}>}

export async function PATCH(request:NextRequest,{params}:Params){

    try {
        const user = getCurrentUser(request)
        if(!user || !isAdmin(user)){
            return NextResponse.json({
                success:true, message:"Accès refusé"
            },{status:403})
        }

        const {approved}= await request.json()
        if (typeof approved !== 'boolean') {
            return NextResponse.json({ success: false, message: 'Champ "approved" (boolean) requis' }, { status: 400 })
        }
        const {id:commentId} = await params
        const comment = await prisma.comment.findUnique({ where: { id: commentId } })
        if (!comment || comment.isDeleted) {
           return NextResponse.json({ success: false, message: 'Commentaire introuvable' }, { status: 404 })
        }

        const updated = await prisma.comment.update({
          where: { id: comment.id },
          data:  { isApproved: approved },
          include: {
             author: { select: { id: true, username: true, displayName: true } },
             post:   { select: { id: true, title: true, slug: true } }
            }
        })

        return NextResponse.json({
          success: true,
          message: approved ? 'Commentaire approuvé et publié' : 'Commentaire rejeté',
          comment: updated,
        })
    } catch (error) {
        console.error("[PATCH APPROUVE]",error)
        return NextResponse.json({
            success:false,message:"Server Error"
        },{status:500})
    }
} 



export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request)
    if (!user && !isAdmin(user)) {
      return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page  = Math.max(1, Number.parseInt(searchParams.get('page')  || '1'))
    const limit = Math.min(50, Number.parseInt(searchParams.get('limit') || '20'))

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where:   { isApproved: false, isDeleted: false },
        orderBy: { createdAt: 'asc' }, // les plus anciens d'abord
        skip:    (page - 1) * limit,
        take:    limit,
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          post:   { select: { id: true, title: true, slug: true } }
        }
      }),
      prisma.comment.count({ where: { isApproved: false, isDeleted: false } })
    ])

    return NextResponse.json({
      success: true,
      comments,
      pagination: {
        page, limit, total,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      }
    })

  } catch (error) {
    console.error('[PENDING COMMENTS]', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
