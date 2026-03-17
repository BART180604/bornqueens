import {NextRequest,NextResponse} from 'next/server';
import { getCurrentUser } from '@/app/lib/auth';
import {prisma} from "@/app/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {

    try {
        const user = getCurrentUser(request)
        if(!user){
            return NextResponse.json({
                success: false, message: "Utilisateur non authentifié"
            }, { status: 401 })
        }

        const { id: postId } = await params

        const post = await prisma.post.findUnique({
            where: {
                id: postId, status: "PUBLISHED"
            }
        })

        if(!post){
            return NextResponse.json({
                success: false, message: "Post Introuvable"
            }, { status: 400 })
        }

        const existingLike = await prisma.like.findUnique({
            where: {
                postId_authorId: { postId, authorId: user.userId }
            }
        })

        if (existingLike){
            await prisma.like.delete({ where: { id: existingLike.id } })
            const count = await prisma.like.count({ where: { postId } })
            return NextResponse.json({ success: true, liked: false, likesCount: count })
        } else {
            await prisma.like.create({ data: { authorId: user.userId, postId } })
            const count = await prisma.like.count({ where: { postId } })
            return NextResponse.json({ success: true, liked: true, likesCount: count })
        }

    } catch (error) {
        console.error("[POST LIKE]", error)
        return NextResponse.json({
            success: false, message: "Server Intern Error"
        }, { status: 500 })
    }
}