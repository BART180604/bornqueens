import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isContributor, isAdmin } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const user = getCurrentUser(request)
        if (!user || (!isContributor(user) && !isAdmin(user))) {
            return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 })
        }

        const [totalPosts, publishedPosts, draftPosts, totalLikes, totalComments] = await Promise.all([
            prisma.post.count({ where: { authorId: user.userId } }),
            prisma.post.count({ where: { authorId: user.userId, status: 'PUBLISHED' } }),
            prisma.post.count({ where: { authorId: user.userId, status: 'DRAFT' } }),
            prisma.like.count({ where: { post: { authorId: user.userId } } }),
            prisma.comment.count({ where: { post: { authorId: user.userId }, isDeleted: false } }),
        ])

        return NextResponse.json({
            success: true,
            stats: { totalPosts, publishedPosts, draftPosts, totalLikes, totalComments }
        })

    } catch (error) {
        console.error('[GET STUDIO STATS]', error)
        return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
    }
}