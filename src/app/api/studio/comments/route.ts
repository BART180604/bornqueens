import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isContributor, isAdmin } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const user = getCurrentUser(request)
        if (!user || (!isContributor(user) && !isAdmin(user))) {
            return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const page  = Math.max(1, parseInt(searchParams.get('page') || '1'))
        const limit = 20

        const where = {
            post:      { authorId: user.userId },
            isDeleted: false,
        }

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip:    (page - 1) * limit,
                take:    limit,
                include: {
                    author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
                    post:   { select: { id: true, title: true, slug: true } },
                }
            }),
            prisma.comment.count({ where })
        ])

        return NextResponse.json({
            success: true,
            comments: comments.map(c => ({
                ...c,
                createdAt: c.createdAt.toISOString(),
            })),
            pagination: {
                page, limit, total,
                totalPages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error('[GET STUDIO COMMENTS]', error)
        return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
    }
}