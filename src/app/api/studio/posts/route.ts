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
        const limit = 10

        const where = { authorId: user.userId }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip:    (page - 1) * limit,
                take:    limit,
                select: {
                    id:          true,
                    title:       true,
                    slug:        true,
                    status:      true,
                    publishedAt: true,
                    createdAt:   true,
                    photos: {
                        orderBy: { order: 'asc' },
                        take:    1,
                        select:  { thumbPath: true, path: true },
                    },
                    _count: { select: { likes: true, comments: true } },
                }
            }),
            prisma.post.count({ where })
        ])

        return NextResponse.json({
            success: true,
            posts:   posts.map(p => ({
                ...p,
                publishedAt: p.publishedAt?.toISOString() ?? null,
                createdAt:   p.createdAt.toISOString(),
            })),
            pagination: {
                page, limit, total,
                totalPages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error('[GET STUDIO POSTS]', error)
        return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
    }
}