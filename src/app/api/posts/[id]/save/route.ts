import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// Sauvegarder un post
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const user = getCurrentUser(request)
        if (!user) {
            return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
        }

        const { id: postId } = await params

        const post = await prisma.post.findUnique({
            where: { id: postId, status: 'PUBLISHED' }
        })
        if (!post) {
            return NextResponse.json({ success: false, message: 'Post introuvable' }, { status: 404 })
        }

        // Upsert — évite les doublons
        await prisma.savedPost.upsert({
            where:  { postId_userId: { postId, userId: user.userId } },
            update: {},
            create: { postId, userId: user.userId },
        })

        return NextResponse.json({ success: true, saved: true })

    } catch (error) {
        console.error('[POST SAVE]', error)
        return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
    }
}

// Retirer des favoris
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const user = getCurrentUser(request)
        if (!user) {
            return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
        }

        const { id: postId } = await params

        await prisma.savedPost.deleteMany({
            where: { postId, userId: user.userId }
        })

        return NextResponse.json({ success: true, saved: false })

    } catch (error) {
        console.error('[DELETE SAVE]', error)
        return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
    }
}

// Vérifier si un post est sauvegardé
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const user = getCurrentUser(request)
        if (!user) {
            return NextResponse.json({ success: false, saved: false })
        }

        const { id: postId } = await params

        const saved = await prisma.savedPost.findUnique({
            where: { postId_userId: { postId, userId: user.userId } }
        })

        return NextResponse.json({ success: true, saved: !!saved })

    } catch (error) {
        console.error('[GET SAVE]', error)
        return NextResponse.json({ success: false, saved: false }, { status: 500 })
    }
}