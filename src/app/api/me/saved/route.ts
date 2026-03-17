import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const user = getCurrentUser(request)
        if (!user) {
            return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
        }

        const savedPosts = await prisma.savedPost.findMany({
            where:   { userId: user.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                post: {
                    select: {
                        id:    true,
                        title: true,
                        slug:  true,
                        photos: {
                            orderBy: { order: 'asc' },
                            take:    1,
                            select:  { path: true, thumbPath: true },
                        },
                    }
                }
            }
        })

        return NextResponse.json({
            success:    true,
            savedPosts: savedPosts.map(s => s.post),
        })

    } catch (error) {
        console.error('[GET SAVED]', error)
        return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
    }
}